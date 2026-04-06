import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { highlightColors } from '../theme';
import { wp, hp, RFValue } from '../utils/responsive';
import { ChevronIcon } from '../components/icons';
import { useSecurity } from '../context/SecurityContext';

const AlertIcon = ({ size = 22, color = '#B8860B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
      fill={color}
    />
  </Svg>
);

export function SecurityScreen() {
  const router = useRouter();
  const { twoStepEnabled, setTwoStepEnabled } = useSecurity();

  const handleTwoStepChange = (value: boolean) => {
    if (twoStepEnabled && !value) {
      router.push('/security/verify-disable');
      return;
    }
    setTwoStepEnabled(value);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={highlightColors.neonPink} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Security</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <AlertIcon size={24} />
          <Text style={styles.bannerText}>
            For your security, we strongly recommend enabling two-step authentication to avoid account take-overs.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Enable Two-Step Authentication</Text>
            <Switch
              value={twoStepEnabled}
              onValueChange={handleTwoStepChange}
              trackColor={{ false: '#444', true: highlightColors.neonPink }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={styles.sectionDesc}>
            Help protect your account from unauthorized access by requiring a second authentication method in addition to your password. <Text style={styles.bold}>Strongly recommended</Text>
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
  backText: { fontSize: RFValue(14), color: highlightColors.neonPink, fontWeight: '600' },
  title: { fontSize: RFValue(20), fontWeight: '700', color: '#FFFFFF' },
  headerSpacer: { width: 60 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(4), paddingTop: hp(2), paddingBottom: hp(6) },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(184, 134, 11, 0.2)',
    borderRadius: 12,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
    gap: wp(3),
  },
  bannerText: {
    flex: 1,
    fontSize: RFValue(13),
    color: '#E8E8E8',
    lineHeight: RFValue(19),
  },
  section: { marginBottom: hp(2) },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  toggleLabel: { fontSize: RFValue(15), fontWeight: '600', color: '#FFFFFF', flex: 1, marginRight: wp(3) },
  sectionDesc: { fontSize: RFValue(13), color: '#999', lineHeight: RFValue(19) },
  bold: { fontWeight: '700', color: '#FFFFFF' },
});
