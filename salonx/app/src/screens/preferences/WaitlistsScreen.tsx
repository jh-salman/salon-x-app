import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { PreferencesSubScreen } from './PreferencesSubScreen';
import { highlightColors } from '../../theme';
import { wp, hp, RFValue } from '../../utils/responsive';

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

export function WaitlistsScreen() {
  const [texts, setTexts] = useState(true);
  const [emails, setEmails] = useState(true);
  const [push, setPush] = useState(true);

  return (
    <PreferencesSubScreen title="Waitlists">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ToggleRow
          title="Waitlist Signup Texts"
          description="We'll text you when a client joins your waitlist from your website."
          value={texts}
          onValueChange={setTexts}
        />
        <ToggleRow
          title="Waitlist Signup Emails"
          description="We'll email you when a client joins your waitlist from your website."
          value={emails}
          onValueChange={setEmails}
        />
        <ToggleRow
          title="Waitlist Signup Push Notifications"
          description="We'll send you push notifications when a client joins your waitlist from your website."
          value={push}
          onValueChange={setPush}
          isLast
        />
      </ScrollView>
    </PreferencesSubScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingTop: hp(2), paddingBottom: hp(6) },
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
