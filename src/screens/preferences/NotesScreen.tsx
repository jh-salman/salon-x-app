import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { PreferencesSubScreen } from './PreferencesSubScreen';
import { highlightColors } from '../../theme';
import { wp, hp, RFValue } from '../../utils/responsive';

function ToggleSection({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#444', true: highlightColors.neonPink }}
          thumbColor="#FFFFFF"
        />
      </View>
      <Text style={styles.sectionDesc}>{description}</Text>
    </View>
  );
}

export function NotesScreen() {
  const [captureNotes, setCaptureNotes] = useState(true);
  const [sendNotes, setSendNotes] = useState(false);

  return (
    <PreferencesSubScreen title="Notes">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ToggleSection
          title="Capture Client Notes from Me"
          description="You will never forget to jot down client notes again! We will text you after an appointment to capture notes from you. You can respond to the text message with your client notes and they will be automatically saved down on that client."
          value={captureNotes}
          onValueChange={setCaptureNotes}
        />
        <ToggleSection
          title="Send Me Client Notes"
          description="You will always be on top of it and can show clients you care! We will text you with notes (if you have them) on your client before an appointment so your notes can always be fresh on your mind."
          value={sendNotes}
          onValueChange={setSendNotes}
        />
      </ScrollView>
    </PreferencesSubScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(4), paddingTop: hp(2), paddingBottom: hp(6) },
  section: {
    marginBottom: hp(3),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  sectionTitle: { fontSize: RFValue(15), fontWeight: '600', color: '#FFFFFF', flex: 1, marginRight: wp(3) },
  sectionDesc: { fontSize: RFValue(13), color: '#999', lineHeight: RFValue(19) },
});
