import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { highlightColors } from '../theme';
import { wp, hp, ms } from '../utils/responsive';
import { ChevronIcon, PersonIcon } from '../components/icons';

const CheckboxIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8.29 13.29a.996.996 0 01-1.41 0L5.71 12.7a.996.996 0 111.41-1.41L10 14.17l6.88-6.88a.996.996 0 111.41 1.41l-7.58 7.59z"
      fill="#FFFFFF"
    />
  </Svg>
);

type MenuRowProps = {
  label: string;
  onPress?: () => void;
  isLast?: boolean;
};

function MenuRow({ label, onPress, isLast }: MenuRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed, isLast && styles.menuRowLast]}
      onPress={onPress ?? (() => {})}
    >
      <Text style={styles.menuRowLabel}>{label}</Text>
      <View style={styles.chevronRight}>
        <ChevronIcon size={18} color="#888" />
      </View>
    </Pressable>
  );
}

export function PersonalInfoScreen() {
  const router = useRouter();
  const [displayName] = useState('JOE RACER');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={highlightColors.neonPink} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarPlaceholder}>
            <PersonIcon size={48} color="#666" />
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <TouchableOpacity style={styles.uploadRow} activeOpacity={0.7}>
            <Text style={styles.uploadText}>Upload picture</Text>
            <CheckboxIcon />
          </TouchableOpacity>
        </View>

        <View style={styles.menuCard}>
          <MenuRow label="Contact Information" onPress={() => router.push('/contact-info')} />
          <MenuRow label="About" onPress={() => router.push('/about')} />
          <MenuRow label="Social Accounts" onPress={() => router.push('/social')} isLast />
        </View>

        <TouchableOpacity style={styles.resetPasswordBtn} activeOpacity={0.8}>
          <Text style={styles.resetPasswordText}>Reset Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAccountWrap} activeOpacity={0.8}>
          <Text style={styles.deleteAccountText}>Delete Account & Business</Text>
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
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: ms(14), color: highlightColors.neonPink, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: hp(6), paddingHorizontal: wp(6) },
  profileSection: {
    alignItems: 'center',
    paddingTop: hp(4),
    paddingBottom: hp(3),
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  userName: {
    fontSize: ms(22),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: hp(1),
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploadText: {
    fontSize: ms(14),
    color: '#FFFFFF',
  },
  menuCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: ms(12),
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  menuRowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  menuRowLast: { borderBottomWidth: 0 },
  menuRowLabel: { fontSize: ms(15), color: '#FFFFFF', fontWeight: '500' },
  chevronRight: { transform: [{ rotate: '180deg' }] },
  resetPasswordBtn: {
    marginTop: hp(3),
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetPasswordText: { fontSize: ms(15), fontWeight: '600', color: '#FFFFFF' },
  deleteAccountWrap: {
    marginTop: hp(2),
    alignItems: 'center',
    paddingVertical: hp(1),
  },
  deleteAccountText: {
    fontSize: ms(14),
    color: highlightColors.neonPink,
    fontWeight: '600',
  },
});
