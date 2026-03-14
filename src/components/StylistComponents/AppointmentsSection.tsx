import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { MorphAppointmentCard } from './MorphAppointmentCard';
import { vs } from '../../utils/responsive';

export type Appointment = {
  id: string;
  client: string;
  service: string;
  time: string;
};

/** Appointment section — own layout (same values as waitlist but independent). */
const CARD_HEIGHT = vs(50);
const CARD_GAP = vs(3);
const CARD_LEFT = 10;
const CARD_WIDTH = 389;

/** Viewport height: exactly 4 cards visible; 4+ scroll. */
export const VIEWPORT_HEIGHT_FOR_4_CARDS = 4 * CARD_HEIGHT + 3 * CARD_GAP;

type Props = {
  appointments: Appointment[];
  /** Screen Y where the appointment viewport starts (below sub-branding). */
  viewportTop: number;
  /** Height of the visible clipped window (above waitlist header). */
  viewportHeight: number;
};

export function AppointmentsSection({
  appointments,
  viewportTop,
  viewportHeight,
}: Props) {
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const contentHeight =
    appointments.length * (CARD_HEIGHT + CARD_GAP) + vs(20);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.viewportShell,
        {
          top: viewportTop,
          height: viewportHeight,
        },
      ]}
    >
      <Animated.ScrollView
        style={styles.viewport}
        contentContainerStyle={{ minHeight: contentHeight }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        bounces={false}
      >
        <View style={{ height: contentHeight }}>
          {appointments.map((item, index) => {
            const y = index * (CARD_HEIGHT + CARD_GAP);

            return (
              <MorphAppointmentCard
                key={item.id}
                item={item}
                x={CARD_LEFT}
                y={y}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                scrollY={scrollY}
                railScreenOffsetY={viewportTop}
              />
            );
          })}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  viewportShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
});
