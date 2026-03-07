import React from 'react';
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
import { highlightColors } from '../theme';
import { wp, hp, RFValue } from '../utils/responsive';
import { ChevronIcon } from '../components/icons';
import { useWorkSchedule } from '../context/WorkScheduleContext';

const DAYS = [
  { id: 'mon', label: 'Monday' },
  { id: 'tue', label: 'Tuesday' },
  { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday' },
  { id: 'fri', label: 'Friday' },
  { id: 'sat', label: 'Saturday' },
  { id: 'sun', label: 'Sunday' },
] as const;

type ScheduleRowProps = {
  label: string;
  value: string;
  onPress?: () => void;
  isLast?: boolean;
};

function ScheduleRow({ label, value, onPress, isLast }: ScheduleRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, isLast && styles.rowLast]}
      onPress={onPress ?? (() => {})}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
      </View>
      <View style={styles.chevronRight}>
        <ChevronIcon size={18} color="#888" />
      </View>
    </Pressable>
  );
}

export function WorkScheduleScreen() {
  const router = useRouter();
  const { getDisplayValue } = useWorkSchedule();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={highlightColors.neonPink} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Work Schedule</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.helperText}>
          Set your regular working hours. Clients will see when you're available.
        </Text>

        <View style={styles.card}>
          {DAYS.map((day, index) => (
            <ScheduleRow
              key={day.id}
              label={day.label}
              value={getDisplayValue(day.id)}
              onPress={() => router.push(`/work-schedule/${day.id}`)}
              isLast={index === DAYS.length - 1}
            />
          ))}
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
  backText: { fontSize: RFValue(14), color: highlightColors.neonPink, fontWeight: '600' },
  title: { fontSize: RFValue(20), fontWeight: '700', color: '#FFFFFF' },
  headerSpacer: { width: 60 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: hp(6), paddingHorizontal: wp(6), paddingTop: hp(2) },
  helperText: {
    fontSize: RFValue(13),
    color: '#999',
    lineHeight: RFValue(18),
    marginBottom: hp(2),
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flex: 1, marginRight: wp(3) },
  rowLabel: { fontSize: RFValue(13), color: '#999', marginBottom: 2 },
  rowValue: { fontSize: RFValue(15), color: '#FFFFFF', fontWeight: '500' },
  chevronRight: { transform: [{ rotate: '180deg' }] },
});
