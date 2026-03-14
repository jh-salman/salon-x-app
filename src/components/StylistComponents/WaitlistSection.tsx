import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { MorphAppointmentCard } from './MorphAppointmentCard';
import { vs } from '../../utils/responsive';

export type WaitlistItem = {
  id: string;
  client: string;
  service: string;
  time: string;
};

/** Waitlist section — own layout (smaller card height than appointments). */
const CARD_HEIGHT = vs(30);
const CARD_GAP = vs(3);
const CARD_LEFT = 10;
const CARD_WIDTH = 392;

/** Viewport height: exactly 3 cards visible; 3+ scroll. */
const VIEWPORT_HEIGHT_FOR_3_CARDS = 3 * CARD_HEIGHT + 2 * CARD_GAP;

type Props = {
  items: WaitlistItem[];
  /** Screen Y where the waitlist viewport starts (below "Waiting list" header). */
  viewportTop: number;
};

export function WaitlistSection({ items, viewportTop }: Props) {
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const contentHeight = items.length * (CARD_HEIGHT + CARD_GAP) + vs(20);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.viewportShell,
        {
          top: viewportTop,
          height: VIEWPORT_HEIGHT_FOR_3_CARDS,
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
          {items.map((item, index) => {
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
