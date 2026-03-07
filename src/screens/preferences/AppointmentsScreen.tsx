import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PreferencesSubScreen } from './PreferencesSubScreen';
import { highlightColors } from '../../theme';
import { wp, hp, RFValue } from '../../utils/responsive';
import { ChevronIcon } from '../../components/icons';

const InfoIcon = ({ size = 20, color = highlightColors.neonPink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
      fill={color}
    />
  </Svg>
);

function ToggleRow({
  title,
  description,
  value,
  onValueChange,
  isLast,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#444', true: highlightColors.neonPink }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export function AppointmentsScreen() {
  const [texts, setTexts] = useState(true);
  const [emails, setEmails] = useState(true);
  const [push, setPush] = useState(true);

  return (
    <PreferencesSubScreen title="Appointments">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.actionBanner} onPress={() => {}}>
          <View style={styles.actionBannerIcon}>
            <InfoIcon size={22} />
          </View>
          <Text style={styles.actionBannerText}>Action required! Update your info to resume payments</Text>
          <View style={styles.actionBannerChevron}>
            <ChevronIcon size={18} color="#888" />
          </View>
        </Pressable>

        <View style={styles.card}>
          <ToggleRow
            title="Send Me Appointment Texts"
            description="Text you with appointment-related notifications. Strongly Recommended."
            value={texts}
            onValueChange={setTexts}
          />
          <ToggleRow
            title="Send Me Appointment Emails"
            description="Email you with appointment-related notifications. Strongly Recommended."
            value={emails}
            onValueChange={setEmails}
          />
          <ToggleRow
            title="Send Me Appointment Push Notifications"
            description="Send you with appointment-related push notifications. Strongly Recommended."
            value={push}
            onValueChange={setPush}
            isLast
          />
        </View>
      </ScrollView>
    </PreferencesSubScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(4), paddingTop: hp(2), paddingBottom: hp(6) },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  actionBannerIcon: { marginRight: wp(3) },
  actionBannerText: { flex: 1, fontSize: RFValue(14), color: '#FFFFFF', fontWeight: '500' },
  actionBannerChevron: { transform: [{ rotate: '180deg' }] },
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
  rowLast: { borderBottomWidth: 0 },
  rowText: { flex: 1, marginRight: wp(3) },
  rowTitle: { fontSize: RFValue(15), fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  rowDesc: { fontSize: RFValue(13), color: '#999', lineHeight: RFValue(18) },
});
