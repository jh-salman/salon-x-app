import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { PreferencesSubScreen } from './PreferencesSubScreen';
import { highlightColors } from '../../theme';
import { wp, hp, RFValue } from '../../utils/responsive';

export function ReviewsScreen() {
  const [notifyReviews, setNotifyReviews] = useState(true);

  return (
    <PreferencesSubScreen title="Reviews">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notify Me of New Reviews</Text>
            <Switch
              value={notifyReviews}
              onValueChange={setNotifyReviews}
              trackColor={{ false: '#444', true: highlightColors.neonPink }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={styles.sectionDesc}>We'll notify you when you receive a new review from a client</Text>
        </View>
      </ScrollView>
    </PreferencesSubScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(4), paddingTop: hp(2), paddingBottom: hp(6) },
  section: { marginBottom: hp(3) },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  sectionTitle: { fontSize: RFValue(15), fontWeight: '600', color: '#FFFFFF', flex: 1, marginRight: wp(3) },
  sectionDesc: { fontSize: RFValue(13), color: '#999', lineHeight: RFValue(19) },
});
