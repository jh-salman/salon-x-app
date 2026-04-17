import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { highlightColors } from '../theme';
import { wp, hp, RFValue } from '../utils/responsive';
import { ChevronIcon } from '../components/icons';
import { useSecurity } from '../context/SecurityContext';

const MASKED_PHONE = '(208) ***_**99';
const RESEND_COOLDOWN_SEC = 28;

const EyeIcon = ({ size = 22, color = '#888' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
      fill={color}
    />
  </Svg>
);

const EyeOffIcon = ({ size = 22, color = '#888' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l1.74 1.74c.57-.23 1.18-.36 1.83-.36zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
      fill={color}
    />
  </Svg>
);

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VerifyToDisableScreen() {
  const router = useRouter();
  const { setTwoStepEnabled } = useSecurity();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendSec, setResendSec] = useState(RESEND_COOLDOWN_SEC);

  const canSubmit = code.trim().length >= 4 && password.length > 0;
  const resendDisabled = resendSec > 0;

  useEffect(() => {
    if (resendSec <= 0) return;
    const t = setInterval(() => setResendSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  const handleResend = useCallback(() => {
    if (resendDisabled) return;
    setResendSec(RESEND_COOLDOWN_SEC);
  }, [resendDisabled]);

  const handleDisable = useCallback(() => {
    if (!canSubmit) return;
    setTwoStepEnabled(false);
    router.back();
  }, [canSubmit, router, setTwoStepEnabled]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={highlightColors.neonPink} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Verify to disable</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.instruction}>
          Verify phone number by entering the MFA code sent to {MASKED_PHONE}
        </Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="Verification code"
          placeholderTextColor="#666"
          keyboardType="number-pad"
          maxLength={8}
        />
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive the code?</Text>
          <Pressable
            onPress={handleResend}
            style={[styles.resendBtn, resendDisabled && styles.resendBtnDisabled]}
            disabled={resendDisabled}
          >
            <Text style={[styles.resendBtnText, resendDisabled && styles.resendBtnTextDisabled]}>
              {resendDisabled ? `Resend code in ${formatCountdown(resendSec)}` : 'Resend code'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.instruction}>Enter your account password</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry={!showPassword}
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
            {showPassword ? <EyeOffIcon size={22} /> : <EyeIcon size={22} />}
          </Pressable>
        </View>

        <TouchableOpacity
          style={[styles.disableBtn, canSubmit && styles.disableBtnActive]}
          onPress={handleDisable}
          activeOpacity={0.8}
          disabled={!canSubmit}
        >
          <Text style={[styles.disableBtnText, canSubmit && styles.disableBtnTextActive]}>Disable</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: RFValue(14), color: highlightColors.neonPink, fontWeight: '600' },
  title: { fontSize: RFValue(18), fontWeight: '700', color: '#FFFFFF' },
  headerSpacer: { width: 60 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(4), paddingTop: hp(3), paddingBottom: hp(6) },
  instruction: {
    fontSize: RFValue(14),
    color: '#FFFFFF',
    marginBottom: hp(1),
  },
  input: {
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: wp(4),
    fontSize: RFValue(15),
    color: '#FFFFFF',
    marginBottom: hp(2),
  },
  resendRow: { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginBottom: hp(3) },
  resendLabel: { fontSize: RFValue(13), color: '#999' },
  resendBtn: { paddingVertical: 4 },
  resendBtnDisabled: { opacity: 0.5 },
  resendBtnText: { fontSize: RFValue(13), color: highlightColors.neonPink, fontWeight: '600' },
  resendBtnTextDisabled: { color: '#666' },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingRight: wp(3),
    marginBottom: hp(4),
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: wp(4),
    fontSize: RFValue(15),
    color: '#FFFFFF',
  },
  eyeBtn: { padding: 8 },
  disableBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disableBtnActive: {
    backgroundColor: highlightColors.neonPink,
  },
  disableBtnText: { fontSize: RFValue(16), fontWeight: '600', color: '#666' },
  disableBtnTextActive: { color: '#FFFFFF' },
});
