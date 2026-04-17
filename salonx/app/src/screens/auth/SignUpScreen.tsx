import React, { useState } from 'react';
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
import { ms, vs, wp, hp } from '../../utils/responsive';
import { normalizeUsE164 } from '../../lib/phone';

export function SignUpScreen() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const { signUp, requestOtp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      const normalizedPhone = normalizeUsE164(phone);
      const res = await signUp(name, email, password, normalizedPhone);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      const otpRes = await requestOtp(normalizedPhone);
      if (!otpRes.ok) {
        setError(otpRes.message);
        return;
      }
      router.replace({
        pathname: '/verify-otp',
        params: { phone: normalizedPhone },
      });
    } finally {
      setBusy(false);
    }
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Add your details, then verify your phone with a one-time code.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Alex Stylist"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            editable={!busy}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@salon.com"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!busy}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.text.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!busy}
          />

          <Text style={styles.label}>Phone (US)</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 555 123 4567"
            placeholderTextColor={colors.text.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!busy}
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: primaryColor },
              pressed && styles.pressed,
            ]}
            onPress={onSubmit}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            <Text style={styles.primaryBtnText}>{busy ? '…' : 'Continue'}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            onPress={() => router.back()}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={[styles.link, { color: primaryColor }]}>Back to sign in</Text>
          </Pressable>
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
    paddingTop: hp(3),
    paddingBottom: hp(4),
  },
  title: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(26),
    color: colors.text.primary,
    marginBottom: vs(8),
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(14),
    color: colors.text.muted,
    marginBottom: vs(24),
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
    height: vs(48),
    borderRadius: ms(10),
    paddingHorizontal: wp(4),
    fontSize: ms(15),
    color: colors.text.primary,
    backgroundColor: colors.bg,
    marginBottom: vs(16),
    borderWidth: ms(1),
    borderColor: 'rgba(255,255,255,0.08)',
  },
  primaryBtn: {
    height: vs(50),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(8),
  },
  primaryBtnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(16),
    color: '#FFFFFF',
  },
  linkRow: {
    marginTop: vs(20),
    alignItems: 'center',
  },
  link: {
    fontFamily: 'Lato_700Bold',
    fontSize: ms(15),
  },
  pressed: { opacity: 0.85 },
});
