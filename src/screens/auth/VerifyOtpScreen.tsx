import React, { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ms, vs, wp, hp } from '../../utils/responsive';
import { OTP_RESEND_COOLDOWN_SECONDS } from '../../constants/otp';

export function VerifyOtpScreen() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const { verifyOtp, requestOtp } = useAuth();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = typeof params.phone === 'string' ? params.phone : '';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendIn, setResendIn] = useState(OTP_RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const onVerify = async () => {
    if (!phone) {
      setError('Missing phone. Go back and try again.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await verifyOtp(phone, code);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.replace('/');
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    if (!phone || resendIn > 0) return;
    setError(null);
    setResendBusy(true);
    try {
      const res = await requestOtp(phone);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setResendIn(OTP_RESEND_COOLDOWN_SECONDS);
    } finally {
      setResendBusy(false);
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
          <Text style={styles.title}>Enter code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to your phone. In dev, check the API server console for the OTP.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Verification code</Text>
          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor={colors.text.muted}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            editable={!busy}
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: primaryColor },
              pressed && styles.pressed,
            ]}
            onPress={onVerify}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Verify"
          >
            <Text style={styles.primaryBtnText}>{busy ? '…' : 'Verify & continue'}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            onPress={onResend}
            disabled={busy || resendBusy || resendIn > 0}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.link,
                {
                  color:
                    resendIn > 0 || resendBusy ? colors.text.muted : primaryColor,
                },
              ]}
            >
              {resendIn > 0
                ? `Resend code in ${resendIn}s`
                : resendBusy
                  ? 'Sending…'
                  : 'Resend code'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            onPress={() => router.back()}
            disabled={busy}
          >
            <Text style={[styles.linkMuted]}>Back</Text>
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
    fontSize: ms(18),
    letterSpacing: ms(4),
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
  linkMuted: {
    fontFamily: 'Lato_400Regular',
    fontSize: ms(14),
    color: colors.text.muted,
  },
  pressed: { opacity: 0.85 },
});
