import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { StylistLayout } from '../components/StylistComponents/StylistLayout';
import { SubBrandingCard } from '../components/StylistComponents/SubBrandingCard';
import {
  AppointmentsSection,
  VIEWPORT_HEIGHT_FOR_4_CARDS,
} from '../components/StylistComponents/AppointmentsSection';
import { WaitlistSection } from '../components/StylistComponents/WaitlistSection';
import { WaitlistTitleCard } from '../components/StylistComponents/WaitlistTitleCard';
import { vs } from '../utils/responsive';

const appointments = [
  { id: '1', client: 'Ava Johnson', service: 'Hair Cut', time: '10:00 AM' },
  { id: '2', client: 'Sophia Lee', service: 'Hair Color', time: '11:30 AM' },
  { id: '3', client: 'Emma Brown', service: 'Blow Dry', time: '1:00 PM' },
  { id: '4', client: 'Mia Clark', service: 'Styling', time: '2:30 PM' },
  { id: '5', client: 'Olivia Hall', service: 'Treatment', time: '4:00 PM' },
  { id: '6', client: 'Charlotte King', service: 'Wash', time: '5:00 PM' },
];

const waitlist = [
  { id: 'w1', client: 'Liam Wright', service: 'Hair Cut', time: '—' },
  { id: 'w2', client: 'Noah Davis', service: 'Color', time: '—' },
  { id: 'w3', client: 'James Wilson', service: 'Blow Dry', time: '—' },
  { id: 'w4', client: 'Oliver Brown', service: 'Styling', time: '—' },
  { id: 'w5', client: 'Elijah Taylor', service: 'Treatment', time: '—' },
];

/** Fixed sub-branding card position. */
const SUB_BRANDING_TOP = vs(185);
const SUB_BRANDING_HEIGHT = vs(60);
const GAP_BELOW_SUB_BRANDING = vs(5);

/** Y where appointment viewport starts (below SubBrandingCard). */
const VIEWPORT_TOP = SUB_BRANDING_TOP + SUB_BRANDING_HEIGHT + GAP_BELOW_SUB_BRANDING;
/** Height so exactly 4 cards visible; 4+ scroll (same for appointments and waitlist). */
const VIEWPORT_HEIGHT = VIEWPORT_HEIGHT_FOR_4_CARDS;

const WAITLIST_HEADER_HEIGHT = vs(20);
/** Y where waitlist viewport starts (below "Waiting list" header). */
const WAITLIST_VIEWPORT_TOP = VIEWPORT_TOP + VIEWPORT_HEIGHT + WAITLIST_HEADER_HEIGHT;

export default function StylistScreen() {
  return (
    <View style={styles.container}>
      <StylistLayout />

      {/* Fixed: featured sub-branding card — same shape as appointment cards, rail-aligned */}
      <SubBrandingCard top={SUB_BRANDING_TOP} />

      {/* Clipped viewport: cards scroll inside, disappear under sub-branding card and above waitlist */}
      <AppointmentsSection
        appointments={appointments}
        viewportTop={VIEWPORT_TOP}
        viewportHeight={VIEWPORT_HEIGHT}
      />

      {/* Fixed: waiting list title card (SVG) — then same 4-card viewport as appointments */}
      <WaitlistTitleCard top={VIEWPORT_TOP + VIEWPORT_HEIGHT} />
      <View style={[styles.waitlistHeaderSpacer, { top: VIEWPORT_TOP + VIEWPORT_HEIGHT + vs(24) }]} />
      <WaitlistSection
        items={waitlist}
        viewportTop={WAITLIST_VIEWPORT_TOP}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  waitlistHeaderSpacer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: WAITLIST_HEADER_HEIGHT - vs(24),
  },
});
