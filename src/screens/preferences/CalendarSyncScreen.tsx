import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { PreferencesSubScreen } from './PreferencesSubScreen';
import { highlightColors } from '../../theme';
import { wp, hp, RFValue } from '../../utils/responsive';

const CALENDAR_LINK = 'm/calendar-sync/bjylF0No60sCHgPJc4gsaP';

const ClearIcon = ({ size = 18, color = '#888' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill={color} />
  </Svg>
);

export function CalendarSyncScreen() {
  const [syncPhone, setSyncPhone] = useState(false);
  const [link] = useState(CALENDAR_LINK);

  return (
    <PreferencesSubScreen title="Calendar Sync">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>SYNC FROM MY PHONE'S CALENDAR</Text>
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Sync Phone Calendar Events</Text>
            <Switch
              value={syncPhone}
              onValueChange={setSyncPhone}
              trackColor={{ false: '#444', true: highlightColors.neonPink }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={styles.sectionDesc}>
            This will sync all events from your phone's calendar. Synced events will appear in your calendar as light pink and you can tap them to convert them to a time block.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>SYNC TO ANOTHER CALENDAR</Text>
        <View style={styles.section}>
          <View style={styles.linkField}>
            <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
            <Pressable style={styles.clearBtn} onPress={() => {}}>
              <ClearIcon size={18} />
            </Pressable>
          </View>
          <Text style={styles.sectionDesc}>
            This will allow you to sync your SalonX calendar with another calendar like the Apple Calendar, Outlook, or Google Calendar.
          </Text>
          <TouchableOpacity style={styles.copyBtn} activeOpacity={0.8}>
            <Text style={styles.copyBtnText}>COPY CALENDAR LINK</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient
              colors={[highlightColors.neonPink, '#FF7701']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emailBtn}
            >
              <Text style={styles.emailBtnText}>EMAIL ME INSTRUCTIONS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </PreferencesSubScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(4), paddingTop: hp(2), paddingBottom: hp(6) },
  sectionTitle: {
    fontSize: RFValue(11),
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.5,
    marginBottom: hp(1),
    marginTop: hp(1),
  },
  section: { marginBottom: hp(2) },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  toggleLabel: { fontSize: RFValue(15), fontWeight: '600', color: '#FFFFFF', flex: 1, marginRight: wp(3) },
  sectionDesc: { fontSize: RFValue(13), color: '#999', lineHeight: RFValue(19), marginBottom: hp(2) },
  linkField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    marginBottom: hp(1),
  },
  linkText: { flex: 1, fontSize: RFValue(13), color: '#FFFFFF' },
  clearBtn: { padding: 4 },
  copyBtn: {
    alignSelf: 'flex-start',
    paddingVertical: hp(1),
    marginBottom: hp(1.5),
  },
  copyBtnText: { fontSize: RFValue(14), fontWeight: '600', color: '#FFFFFF' },
  emailBtn: {
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(6),
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  emailBtnText: {
    fontSize: RFValue(14),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
