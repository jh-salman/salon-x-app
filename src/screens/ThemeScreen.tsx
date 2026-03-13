import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { wp, hp, ms, RFValue } from '../utils/responsive';
import { ChevronIcon } from '../components/icons';
import { useTheme } from '../context/ThemeContext';
import type { PrimaryTheme } from '../context/ThemeContext';
import { highlightColors } from '../theme/colors';

const OPTIONS: { value: PrimaryTheme; label: string; color: string }[] = [
  { value: 'pink', label: 'Pink', color: highlightColors.neonPink },
  { value: 'blue', label: 'Blue', color: highlightColors.neonBlue },
  { value: 'orange', label: 'Orange', color: highlightColors.neonOrange },
];

export function ThemeScreen() {
  const router = useRouter();
  const { primary, setPrimary, primaryColor } = useTheme();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={primaryColor} />
          <Text style={[styles.backText, { color: primaryColor }]}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Theme</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>PRIMARY COLOR</Text>
        <View style={styles.section}>
          {OPTIONS.map((opt, index) => (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
                index === OPTIONS.length - 1 && styles.rowLast,
              ]}
              onPress={() => setPrimary(opt.value)}
            >
              <View style={[styles.colorCircle, { backgroundColor: opt.color }]} />
              <Text style={styles.rowLabel}>{opt.label}</Text>
              {primary === opt.value ? (
                <View style={styles.checkMark}>
                  <Text style={styles.checkMarkText}>✓</Text>
                </View>
              ) : (
                <View style={styles.placeholder} />
              )}
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>Only the primary accent color changes across the app.</Text>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: ms(4) },
  backText: { fontSize: RFValue(14), fontWeight: '600' },
  title: { fontSize: RFValue(20), fontWeight: '700', color: '#FFFFFF' },
  headerSpacer: { width: 60 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(4), paddingTop: hp(2), paddingBottom: hp(6) },
  sectionTitle: {
    fontSize: RFValue(12),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
  rowLast: { borderBottomWidth: 0 },
  colorCircle: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    marginRight: wp(3),
  },
  rowLabel: { flex: 1, fontSize: RFValue(15), color: '#FFFFFF', fontWeight: '500' },
  checkMark: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: { color: '#FFFFFF', fontSize: RFValue(14), fontWeight: '700' },
  placeholder: { width: ms(24), height: ms(24) },
  hint: {
    fontSize: RFValue(12),
    color: '#888',
    marginTop: hp(1.5),
    paddingHorizontal: wp(1),
  },
});
