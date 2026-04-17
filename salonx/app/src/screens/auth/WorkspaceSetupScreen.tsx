import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { checkOrganizationSlugAvailable, createOrganization } from '../../lib/orgApi';
import { patchSalonSettings, patchBusiness, patchWorkspace } from '../../lib/salonApi';
import {
  PUBLIC_WEB_DOMAIN,
  isValidPublicSlug,
  normalizePublicSlug,
} from '../../lib/orgSlug';
import { normalizeUsE164 } from '../../lib/phone';
import { ms, vs, wp, hp } from '../../utils/responsive';

const STEPS = 4;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const US_E164_RE = /^\+1[2-9]\d{2}[2-9]\d{6}$/;

/**
 * Multi-step onboarding: org + salon (1:1), business contact (globally unique),
 * public slug → `{slug}.xsalonx.com`, Free vs Pro.
 */
export function WorkspaceSetupScreen() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const { token, user } = useAuth();
  const { setCurrentSalonId, saveWorkspaceProfile, refreshSalons } = useTenant();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [publicSlug, setPublicSlug] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');
  const [plan, setPlan] = useState<'FREE' | 'PRO'>('FREE');

  const subdomainPreview = useMemo(() => {
    const s = normalizePublicSlug(publicSlug);
    if (!s) return `your-studio.${PUBLIC_WEB_DOMAIN}`;
    return `${s}.${PUBLIC_WEB_DOMAIN}`;
  }, [publicSlug]);

  const applyAccountEmail = useCallback(() => {
    if (user?.email) setBusinessEmail(user.email.trim().toLowerCase());
  }, [user?.email]);

  const applyAccountPhone = useCallback(() => {
    if (user?.phoneNumber) setBusinessPhone(user.phoneNumber.trim());
  }, [user?.phoneNumber]);

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!displayName.trim()) return 'Enter a workspace name.';
      return null;
    }
    if (s === 1) {
      const em = businessEmail.trim().toLowerCase();
      const ph = normalizeUsE164(businessPhone);
      if (!em || !EMAIL_RE.test(em)) return 'Enter a valid business email.';
      if (!US_E164_RE.test(ph)) return 'Enter a valid US business phone (+1…).';
      return null;
    }
    if (s === 2) {
      const slug = normalizePublicSlug(publicSlug);
      if (!isValidPublicSlug(slug)) {
        return 'Use a subdomain: 2–63 chars, lowercase letters, numbers, hyphens (no leading/trailing hyphen).';
      }
      if (!addressLine1.trim()) return 'Enter a street address.';
      if (!city.trim()) return 'Enter a city.';
      return null;
    }
    return null;
  };

  const onNext = async () => {
    setError(null);
    const v = validateStep(step);
    if (v) {
      setError(v);
      return;
    }
    if (step === 2 && token) {
      const slug = normalizePublicSlug(publicSlug);
      const free = await checkOrganizationSlugAvailable(token, slug);
      if (!free) {
        setError('This subdomain is already taken. Try another.');
        return;
      }
    }
    if (step < STEPS - 1) {
      setStep((x) => x + 1);
      return;
    }
    await submitAll();
  };

  const submitAll = async () => {
    if (!token || !user) {
      setError('Session missing. Sign in again.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const slug = normalizePublicSlug(publicSlug);
      const name = displayName.trim();
      const desc = description.trim();
      const em = businessEmail.trim().toLowerCase();
      const ph = normalizeUsE164(businessPhone);

      const org = await createOrganization(token, { name, slug });

      const rows = await refreshSalons();
      const row = rows?.find((r) => r.salon.organizationId === org.id);
      if (!row) {
        setError('Workspace was created but could not be loaded. Try again.');
        return;
      }

      const salonId = row.salon.id;

      await setCurrentSalonId(salonId, {
        force: true,
        organizationId: org.id,
      });

      const websiteUrl = `https://${slug}.${PUBLIC_WEB_DOMAIN}`;

      await patchBusiness(token, salonId, {
        legalName: name,
        email: em,
        phone: ph,
        websiteUrl,
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        region: region.trim() || null,
        postalCode: postalCode.trim() || null,
        country: country.trim() || null,
      });

      await patchWorkspace(token, salonId, {
        displayNameOverride: name,
        info: desc.length > 0 ? desc : null,
      });

      if (plan === 'PRO') {
        await patchSalonSettings(token, salonId, { plan: 'PRO' });
      }

      await saveWorkspaceProfile({
        displayName: name,
        info: desc.length > 0 ? desc : null,
      });

      router.replace('/(tabs)');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not finish setup.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const onBack = () => {
    setError(null);
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepLabel}>
            Step {step + 1} of {STEPS}
          </Text>
          <Text style={styles.title}>Create your workspace</Text>
          <Text style={styles.subtitle}>
            One organization per salon. Your subdomain is your public site URL.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {step === 0 ? (
            <>
              <Text style={styles.label}>Workspace name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Studio North"
                placeholderTextColor={colors.text.muted}
                value={displayName}
                onChangeText={setDisplayName}
                editable={!busy}
              />
              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Short line about your team…"
                placeholderTextColor={colors.text.muted}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                editable={!busy}
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Text style={styles.label}>Business email</Text>
              <TextInput
                style={styles.input}
                placeholder="contact@yourstudio.com"
                placeholderTextColor={colors.text.muted}
                value={businessEmail}
                onChangeText={setBusinessEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!busy}
              />
              <Pressable style={styles.linkRow} onPress={applyAccountEmail} disabled={busy}>
                <Text style={[styles.linkText, { color: primaryColor }]}>Use my account email</Text>
              </Pressable>

              <Text style={styles.label}>Business phone</Text>
              <TextInput
                style={styles.input}
                placeholder="+15551234567"
                placeholderTextColor={colors.text.muted}
                value={businessPhone}
                onChangeText={setBusinessPhone}
                keyboardType="phone-pad"
                editable={!busy}
              />
              <Pressable style={styles.linkRow} onPress={applyAccountPhone} disabled={busy}>
                <Text style={[styles.linkText, { color: primaryColor }]}>Use my account phone</Text>
              </Pressable>
              <Text style={styles.hint}>
                Business email and phone must be unique across all salons. If you use them here, you
                cannot reuse them for another salon.
              </Text>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={styles.label}>Public subdomain</Text>
              <TextInput
                style={styles.input}
                placeholder="your-studio"
                placeholderTextColor={colors.text.muted}
                value={publicSlug}
                onChangeText={(t) => setPublicSlug(t.toLowerCase())}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
              />
              <Text style={styles.preview}>https://{subdomainPreview}</Text>

              <Text style={styles.label}>Street address</Text>
              <TextInput
                style={styles.input}
                placeholder="123 Main St"
                placeholderTextColor={colors.text.muted}
                value={addressLine1}
                onChangeText={setAddressLine1}
                editable={!busy}
              />
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                editable={!busy}
              />
              <Text style={styles.label}>State / region</Text>
              <TextInput
                style={styles.input}
                value={region}
                onChangeText={setRegion}
                editable={!busy}
              />
              <Text style={styles.label}>Postal code</Text>
              <TextInput
                style={styles.input}
                value={postalCode}
                onChangeText={setPostalCode}
                editable={!busy}
              />
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                placeholder="US"
                placeholderTextColor={colors.text.muted}
                value={country}
                onChangeText={setCountry}
                editable={!busy}
              />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Text style={styles.label}>Plan</Text>
              <View style={styles.planRow}>
                <Pressable
                  style={[
                    styles.planCard,
                    plan === 'FREE' && { borderColor: primaryColor, borderWidth: 2 },
                  ]}
                  onPress={() => setPlan('FREE')}
                  disabled={busy}
                >
                  <Text style={styles.planTitle}>Free</Text>
                  <Text style={styles.planMeta}>Get started</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.planCard,
                    plan === 'PRO' && { borderColor: primaryColor, borderWidth: 2 },
                  ]}
                  onPress={() => setPlan('PRO')}
                  disabled={busy}
                >
                  <Text style={styles.planTitle}>Pro</Text>
                  <Text style={styles.planMeta}>More features (billing later)</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          <View style={styles.actions}>
            {step > 0 ? (
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                onPress={onBack}
                disabled={busy}
              >
                <Text style={[styles.secondaryBtnText, { color: primaryColor }]}>Back</Text>
              </Pressable>
            ) : (
              <View style={styles.secondaryBtn} />
            )}
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: primaryColor },
                pressed && styles.pressed,
                busy && styles.disabled,
              ]}
              onPress={onNext}
              disabled={busy}
            >
              <Text style={styles.primaryBtnText}>
                {busy ? '…' : step === STEPS - 1 ? 'Finish' : 'Continue'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },
  stepLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(11),
    color: colors.text.muted,
    marginBottom: vs(6),
    textTransform: 'uppercase',
    letterSpacing: ms(0.6),
  },
  title: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(24),
    color: colors.text.primary,
    marginBottom: vs(8),
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(14),
    color: colors.text.muted,
    marginBottom: vs(20),
    lineHeight: ms(20),
  },
  error: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(14),
    color: colors.indicator.badge,
    marginBottom: vs(12),
  },
  label: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(12),
    color: colors.text.secondary,
    marginBottom: vs(6),
    textTransform: 'uppercase',
    letterSpacing: ms(0.5),
  },
  input: {
    minHeight: vs(48),
    borderRadius: ms(10),
    paddingHorizontal: wp(4),
    paddingVertical: vs(12),
    fontSize: ms(15),
    color: colors.text.primary,
    backgroundColor: colors.bg,
    marginBottom: vs(14),
    borderWidth: ms(1),
    borderColor: 'rgba(255,255,255,0.08)',
  },
  textArea: {
    minHeight: vs(88),
  },
  preview: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(13),
    color: colors.text.muted,
    marginTop: vs(-8),
    marginBottom: vs(12),
  },
  hint: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(12),
    color: colors.text.muted,
    lineHeight: ms(18),
    marginTop: vs(4),
  },
  linkRow: {
    marginTop: vs(-8),
    marginBottom: vs(12),
  },
  linkText: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(14),
  },
  planRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginBottom: vs(16),
  },
  planCard: {
    flex: 1,
    padding: wp(4),
    borderRadius: ms(12),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: ms(1),
    borderColor: 'rgba(255,255,255,0.08)',
  },
  planTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(16),
    color: colors.text.primary,
  },
  planMeta: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(12),
    color: colors.text.muted,
    marginTop: vs(4),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vs(16),
    gap: wp(4),
  },
  primaryBtn: {
    flex: 1,
    height: vs(50),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(16),
    color: '#FFFFFF',
  },
  secondaryBtn: {
    minWidth: wp(22),
    height: vs(50),
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(16),
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
