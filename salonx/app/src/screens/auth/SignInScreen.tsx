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

export function SignInScreen() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSendCode = async () => {
    setError(null);
    setBusy(true);
    try {
      const normalized = normalizeUsE164(phone);
      const res = await requestOtp(normalized);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push({
        pathname: '/verify-otp',
        params: { phone: normalized },
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
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>
            Enter your US mobile number. We’ll send a one-time code (SMS in production; dev server logs the OTP).
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 555 123 4567"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            keyboardType="phone-pad"
            autoCorrect={false}
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
            onPress={onSendCode}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Send code"
          >
            <Text style={styles.primaryBtnText}>{busy ? '…' : 'Send code'}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            onPress={() => router.push('/sign-up')}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={[styles.link, { color: primaryColor }]}>Create an account</Text>
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
