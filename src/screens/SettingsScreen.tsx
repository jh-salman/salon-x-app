import React from 'react';
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
import { colors, highlightColors } from '../theme';
import { wp, hp, ms } from '../utils/responsive';
import { ChevronIcon, PersonIcon, CalendarIcon, SettingsIcon } from '../components/icons';

const LockIcon = ({ size = 22, color = highlightColors.neonOrange }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"
      fill={color}
    />
  </Svg>
);

const InfoIcon = ({ size = 22, color = highlightColors.neonPink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
      fill={color}
    />
  </Svg>
);

type SettingRowProps = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
};

function SettingRow({ icon, label, onPress, isLast }: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, isLast && styles.rowLast]}
      onPress={onPress ?? (() => {})}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.chevronRight}>
        <ChevronIcon size={18} color="#888" />
      </View>
    </Pressable>
  );
}

export function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={highlightColors.neonPink} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search feature or setting"
          placeholderTextColor="#666"
          editable={false}
        />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>PERSONAL</Text>
        <View style={styles.section}>
          <SettingRow
            icon={<InfoIcon />}
            label="Personal & Contact Info"
            onPress={() => router.push('/personal-info')}
          />
          <SettingRow
            icon={<CalendarIcon size={22} color={highlightColors.neonPink} />}
            label="My Work Schedule"
            onPress={() => router.push('/work-schedule')}
          />
          <SettingRow
            icon={<CalendarIcon size={22} color={highlightColors.neonPink} />}
            label="My Assigned Services"
            onPress={() => router.push('/assigned-services')}
          />
          <SettingRow
            icon={<InfoIcon />}
            label="My Preferences"
            onPress={() => router.push('/preferences')}
          />
          <SettingRow
            icon={<LockIcon />}
            label="Security"
            onPress={() => router.push('/security')}
            isLast
          />
        </View>

        <Text style={styles.sectionTitle}>MY TEAM</Text>
        <View style={styles.section}>
          <SettingRow
            icon={<SettingsIcon size={22} color={highlightColors.neonPink} />}
            label="Manage Team"
            onPress={() => {}}
            isLast
          />
        </View>

        <Text style={styles.sectionTitle}>MY BUSINESS</Text>
        <View style={styles.section}>
          <SettingRow
            icon={<SettingsIcon size={22} color={highlightColors.neonPink} />}
            label="Business Details"
            onPress={() => {}}
          />
          <SettingRow
            icon={<SettingsIcon size={22} color={highlightColors.neonPink} />}
            label="Website"
            onPress={() => {}}
            isLast
          />
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
  searchWrap: { paddingHorizontal: wp(4), paddingTop: hp(1.5), paddingBottom: hp(0.5) },
  searchInput: {
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: ms(10),
    paddingHorizontal: wp(4),
    fontSize: ms(14),
    color: '#FFFFFF',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: hp(4), paddingHorizontal: wp(4) },
  sectionTitle: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: ms(12),
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { width: 28, alignItems: 'center', marginRight: wp(3) },
  rowLabel: { flex: 1, fontSize: ms(15), color: '#FFFFFF', fontWeight: '500' },
  chevronRight: { transform: [{ rotate: '180deg' }] },
});
