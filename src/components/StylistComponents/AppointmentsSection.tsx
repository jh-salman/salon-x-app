import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { MorphAppointmentCard } from './MorphAppointmentCard';
import { vs } from '../../utils/responsive';
import {
  STYLIST_CARD_LEFT,
  STYLIST_CARD_WIDTH,
  STYLIST_CARD_GAP,
} from './stylistConstants';

export type Appointment = {
  id: string;
  client: string;
  service: string;
  time: string;
};

const CARD_HEIGHT = vs(50);

/** Viewport height: exactly 4 cards visible; 4+ scroll. */
export const VIEWPORT_HEIGHT_FOR_4_CARDS =
  4 * CARD_HEIGHT + 3 * STYLIST_CARD_GAP;

/** Viewport height: exactly 5 cards visible; 5+ scroll. */
export const VIEWPORT_HEIGHT_FOR_5_CARDS =
  5 * CARD_HEIGHT + 4 * STYLIST_CARD_GAP;

type Props = {
  appointments: Appointment[];
  viewportTop: number;
  viewportHeight: number;
};

/**
 * Appointments list in a fixed-width column at STYLIST_CARD_LEFT.
 * Cards use left: 0 inside this column so they align with branding & waitlist title.
 */
export function AppointmentsSection({
  appointments,
  viewportTop,
  viewportHeight,
}: Props) {
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const contentHeight =
    appointments.length * (CARD_HEIGHT + STYLIST_CARD_GAP) + STYLIST_CARD_GAP;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.column,
        {
          left: STYLIST_CARD_LEFT,
          top: viewportTop,
          width: STYLIST_CARD_WIDTH,
          height: viewportHeight,
        },
      ]}
    >
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        bounces={false}
      >
        <View style={[styles.contentWrap, { height: contentHeight }]}>
          {appointments.map((item, index) => (
            <MorphAppointmentCard
              key={item.id}
              item={item}
              x={0}
              y={index * (CARD_HEIGHT + STYLIST_CARD_GAP)}
              width={STYLIST_CARD_WIDTH}
              height={CARD_HEIGHT}
              scrollY={scrollY}
              railScreenOffsetY={viewportTop}
              screenLeft={STYLIST_CARD_LEFT}
              showProgressCircle={index < 3}
            />
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    position: 'absolute',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: STYLIST_CARD_GAP,
  },
  contentWrap: {
    width: '100%',
  },
});
