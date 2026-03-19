import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';
import { format, isSameDay } from 'date-fns';
import { useEvents } from '../context/EventsContext';
import type { Appointment } from '../components/StylistComponents/AppointmentsSection';
import { MuseButton } from '../components/MuseButton';
import { StylistLayout, StylistRailCurve } from '../components/StylistComponents/StylistLayout';
import { MainBrandingCard } from '../components/StylistComponents/MainBrandingCard';
import { StylistSubBranding } from '../components/StylistComponents/StylistSubBranding';
import {
  AppointmentsSection,
  VIEWPORT_HEIGHT_FOR_5_CARDS,
} from '../components/StylistComponents/AppointmentsSection';
import { WaitlistSection } from '../components/StylistComponents/WaitlistSection';
import {
  WaitlistTitleCard,
  WAITLIST_TITLE_HEIGHT,
} from '../components/StylistComponents/WaitlistTitleCard';
import { NotificationButtonsInline } from '../components/StylistComponents/NotificationButtonsRow';
import {
  STYLIST_CARD_LEFT,
  STYLIST_CARD_GAP,
  STYLIST_CARD_WIDTH,
  SUB_BRANDING_CARD_HEIGHT,
} from '../components/StylistComponents/stylistConstants';
import { vs } from '../utils/responsive';

const CONTAINER_BG = '#000';
const SHAPE_BG = '#1B1818';

/** Mask: white = visible, transparent/black = hidden. */
const SHAPE_VIEWBOX = '0 0 1284 2369';
const SHAPE_PATH_D =
  'M1004.5 274V0.5H0.5V2368.5H1282.5L1121.5 1851.5L1048 1330L1239 595.5L1004.5 274Z';

const waitlist = [
  { id: 'w1', client: 'Liam Wright', service: 'Hair Cut', time: '—' },
  { id: 'w2', client: 'Noah Davis', service: 'Color', time: '—' },
  { id: 'w3', client: 'James Wilson', service: 'Blow Dry', time: '—' },
  { id: 'w4', client: 'Oliver Brown', service: 'Styling', time: '—' },
  { id: 'w5', client: 'Elijah Taylor', service: 'Treatment', time: '—' },
];

/** Only buttons with count > 0 show. Right now only Waiting is shown (others 0). */
const notificationItems = [
  { label: 'Referrals', count: 0, color: '#e64cff' },
  { label: 'Reviews', count: 0, color: '#4fc7ea' },
  { label: 'Messages', count: 0, color: '#ff7f2a' },
];

const MAIN_BRANDING_HEIGHT = vs(110);
const MUSE_BUTTON_HEIGHT = vs(52);
/** Smaller gap above/below Muse button (tighter than card gap). */
const MUSE_BUTTON_GAP = vs(1);
/** Gap between Muse button and sub-branding card. */
const GAP_BELOW_MUSE = vs(2);
const GAP_ABOVE_MAIN_BRANDING = vs(35);
const MAIN_BRANDING_TOP = GAP_ABOVE_MAIN_BRANDING;
const MUSE_BUTTON_TOP = MAIN_BRANDING_TOP + MAIN_BRANDING_HEIGHT;
/** Nudge sub-branding card up (subtract from top). */
const SUB_BRANDING_UP_NUDGE = vs(25);
const SUB_BRANDING_TOP =
  MUSE_BUTTON_TOP + MUSE_BUTTON_GAP + MUSE_BUTTON_HEIGHT + GAP_BELOW_MUSE - SUB_BRANDING_UP_NUDGE;
const VIEWPORT_TOP = SUB_BRANDING_TOP + SUB_BRANDING_CARD_HEIGHT + STYLIST_CARD_GAP;
const VIEWPORT_HEIGHT = VIEWPORT_HEIGHT_FOR_5_CARDS;
/** Gap above title + title height + gap below title. */
const WAITLIST_HEADER_HEIGHT = STYLIST_CARD_GAP + WAITLIST_TITLE_HEIGHT + STYLIST_CARD_GAP;
const WAITLIST_VIEWPORT_TOP = VIEWPORT_TOP + VIEWPORT_HEIGHT + WAITLIST_HEADER_HEIGHT;

/** Map calendar events for today (timed, not parked, not waitlist) to Stylist appointment shape. */
function useTodayAppointments(): Appointment[] {
  const { events } = useEvents();
  return useMemo(() => {
    const today = new Date();
    const timed = events.filter(
      (e) =>
        isSameDay(e.start, today) &&
        !e.allDay &&
        !e.isParked &&
        e.waitlistAddedAt == null
    );
    const sorted = [...timed].sort((a, b) => a.start.getTime() - b.start.getTime());
    return sorted.map((e) => ({
      id: e.id,
      client: e.clientName ?? e.title ?? '—',
      service: e.service ?? '—',
      time: `${format(e.start, 'h:mm a')} – ${format(e.end, 'h:mm a')}`,
    }));
  }, [events]);
}

export default function StylistScreen() {
  const appointments = useTodayAppointments();

  return (
    <View style={styles.screen}>
      <MaskedView
        style={styles.maskedView}
        maskElement={
          <View style={styles.maskContainer}>
            <Svg
              width="100%"
              height="100%"
              viewBox={SHAPE_VIEWBOX}
              preserveAspectRatio="none"
            >
              <Path d={SHAPE_PATH_D} fill="white" />
            </Svg>
          </View>
        }
      >
        <View style={styles.shapeFill}>
          <StylistLayout />
          <MainBrandingCard top={MAIN_BRANDING_TOP} />
          <View style={[styles.museButtonWrap, { top: MUSE_BUTTON_TOP, left: STYLIST_CARD_LEFT }]}>
            <MuseButton onPress={() => {}} />
          </View>
          <StylistSubBranding top={SUB_BRANDING_TOP} />
          <AppointmentsSection
            appointments={appointments}
            viewportTop={VIEWPORT_TOP}
            viewportHeight={VIEWPORT_HEIGHT}
            />
          <WaitlistTitleCard
            top={VIEWPORT_TOP + VIEWPORT_HEIGHT + STYLIST_CARD_GAP}
            rightContent={
              <NotificationButtonsInline
                items={notificationItems}
                waitlistCount={waitlist.length}
              />
            }
          />
          <WaitlistSection
            items={waitlist}
            viewportTop={WAITLIST_VIEWPORT_TOP}
          />
        </View>
      </MaskedView>

      <StylistRailCurve />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CONTAINER_BG,
  },
  maskedView: {
    flex: 1,
  },
  maskContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  shapeFill: {
    flex: 1,
    backgroundColor: SHAPE_BG,
    paddingLeft: 0,
    paddingRight: 0,
  },
  museButtonWrap: {
    position: 'absolute',
    marginTop: MUSE_BUTTON_GAP,
    marginBottom: GAP_BELOW_MUSE,
  },
});
