import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { MorphAppointmentCard } from './MorphAppointmentCard';

export type Appointment = {
  id: string;
  client: string;
  service: string;
  time: string;
};

type Props = {
  appointments: Appointment[];
};

export function AnimatedCardsRail({ appointments }: Props) {
  const scrollY = useSharedValue(0);

  const CARD_HEIGHT = 62;
  const CARD_GAP = 12;
  const TOP_OFFSET = 240;
  const LEFT = 10;
  const WIDTH = 355;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const contentHeight =
    TOP_OFFSET + appointments.length * (CARD_HEIGHT + CARD_GAP) + 220;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{ height: contentHeight }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
      >
        <View style={{ height: contentHeight }}>
          {appointments.map((item, index) => {
            const y = TOP_OFFSET + index * (CARD_HEIGHT + CARD_GAP);

            return (
              <MorphAppointmentCard
                key={item.id}
                item={item}
                x={LEFT}
                y={y}
                width={WIDTH}
                height={CARD_HEIGHT}
                scrollY={scrollY}
                railScreenOffsetY={TOP_OFFSET}
              />
            );
          })}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
