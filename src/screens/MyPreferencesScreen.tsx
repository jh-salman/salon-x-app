import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { highlightColors } from '../theme';
import { wp, hp, RFValue } from '../utils/responsive';
import { ChevronIcon } from '../components/icons';

type PrefRowProps = {
  label: string;
  onPress: () => void;
  isLast?: boolean;
  badge?: string;
};

function PrefRow({ label, onPress, isLast, badge }: PrefRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, isLast && styles.rowLast]}
      onPress={onPress}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      {badge ? (
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>{badge}</Text>
          <View style={styles.chevronRight}>
            <ChevronIcon size={18} color="#888" />
          </View>
        </View>
      ) : (
        <View style={styles.chevronRight}>
          <ChevronIcon size={18} color="#888" />
        </View>
      )}
    </Pressable>
  );
}

export function MyPreferencesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={highlightColors.neonPink} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Preferences</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <PrefRow
            label="My Appointments Notifications"
            onPress={() => router.push('/preferences/appointments')}
          />
          <PrefRow label="Client Notes" onPress={() => router.push('/preferences/notes')} />
          <PrefRow label="Review Notifications" onPress={() => router.push('/preferences/reviews')} />
          <PrefRow
            label="Waitlist Notifications"
            onPress={() => router.push('/preferences/waitlists')}
            badge="GOLD"
          />
          <PrefRow
            label="Two-Way Calendar Sync"
            onPress={() => router.push('/preferences/calendar-sync')}
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
  backText: { fontSize: RFValue(14), color: highlightColors.neonPink, fontWeight: '600' },
  title: { fontSize: RFValue(20), fontWeight: '700', color: '#FFFFFF' },
  headerSpacer: { width: 60 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(4), paddingTop: hp(2), paddingBottom: hp(4) },
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
  rowLabel: { fontSize: RFValue(15), color: '#FFFFFF', fontWeight: '500', flex: 1 },
  badgeWrap: { flexDirection: 'row', alignItems: 'center', gap: wp(2) },
  badgeText: {
    fontSize: RFValue(11),
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: '#D4AF37',
    paddingHorizontal: wp(2),
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  chevronRight: { transform: [{ rotate: '180deg' }] },
});
