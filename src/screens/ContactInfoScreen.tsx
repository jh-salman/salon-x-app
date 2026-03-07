import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { highlightColors } from '../theme';
import { wp, hp, ms } from '../utils/responsive';
import { ChevronIcon } from '../components/icons';

const PLATFORM_NAME = 'SalonX';

type FieldRowProps = {
  label: string;
  value: string;
  onPress?: () => void;
  isLast?: boolean;
};

function FieldRow({ label, value, onPress, isLast }: FieldRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.fieldRow, pressed && styles.fieldRowPressed, isLast && styles.fieldRowLast]}
      onPress={onPress ?? (() => {})}
    >
      <View style={styles.fieldLeft}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue} numberOfLines={1}>{value || ' '}</Text>
      </View>
      <View style={styles.chevronRight}>
        <ChevronIcon size={18} color="#888" />
      </View>
    </Pressable>
  );
}

export function ContactInfoScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('JOE');
  const [lastName, setLastName] = useState('RACER');
  const [email, setEmail] = useState('skirk727@gmail.com');
  const [phone, setPhone] = useState('+1 (208) 626-9799');
  const [licenseNo, setLicenseNo] = useState('');
  const [smsConsent, setSmsConsent] = useState(true);

  const openPrivacyPolicy = () => Linking.openURL('https://example.com/privacy');
  const openSmsTerms = () => Linking.openURL('https://example.com/sms-terms');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={highlightColors.neonPink} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Contact Info</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <FieldRow label="First Name" value={firstName} />
          <FieldRow label="Last Name" value={lastName} />
          <FieldRow label="Email" value={email} />
          <FieldRow label="Phone (verified)" value={phone} />
          <FieldRow label="License No." value={licenseNo} isLast />
        </View>

        <View style={styles.smsSection}>
          <View style={styles.smsRow}>
            <Text style={styles.smsLabel}>SMS Consent</Text>
            <Switch
              value={smsConsent}
              onValueChange={setSmsConsent}
              trackColor={{ false: '#444', true: highlightColors.neonPink }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={styles.consentText}>
            By turning on SMS Consent, you consent to receive SMS regarding the Services provided by {PLATFORM_NAME}, including through automated means. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe and HELP for support.{' '}
            <Text style={styles.link} onPress={openPrivacyPolicy}>Privacy Policy</Text>
            {' & '}
            <Text style={styles.link} onPress={openSmsTerms}>SMS Terms</Text>
          </Text>
        </View>
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
  backText: { fontSize: ms(14), color: highlightColors.neonPink, fontWeight: '600' },
  title: { fontSize: ms(20), fontWeight: '700', color: '#FFFFFF' },
  headerSpacer: { width: 60 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: hp(6), paddingHorizontal: wp(6), paddingTop: hp(2) },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: ms(12),
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  fieldRowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  fieldRowLast: { borderBottomWidth: 0 },
  fieldLeft: { flex: 1, marginRight: wp(3) },
  fieldLabel: { fontSize: ms(13), color: '#999', marginBottom: 2 },
  fieldValue: { fontSize: ms(15), color: '#FFFFFF', fontWeight: '500' },
  chevronRight: { transform: [{ rotate: '180deg' }] },
  smsSection: {
    marginTop: hp(3),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: ms(12),
    padding: wp(4),
  },
  smsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  smsLabel: { fontSize: ms(15), color: '#FFFFFF', fontWeight: '500' },
  consentText: {
    fontSize: ms(12),
    color: '#999',
    lineHeight: ms(18),
  },
  link: {
    color: highlightColors.neonPink,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});
