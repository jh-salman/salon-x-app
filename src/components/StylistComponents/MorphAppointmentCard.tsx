import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { buildCardPath, getRightEdgeXs } from './cardPathUtils';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Appointment = {
  id: string;
  client: string;
  service: string;
  time: string;
};

type Props = {
  item: Appointment;
  x: number;
  y: number;
  width: number;
  height: number;
  scrollY: SharedValue<number>;
  /** Screen Y where the appointment viewport starts (for rail alignment). */
  railScreenOffsetY: number;
};

export function MorphAppointmentCard({
  item,
  x,
  y,
  width,
  height,
  scrollY,
  railScreenOffsetY,
}: Props) {
  const screenY = useDerivedValue(
    () => railScreenOffsetY + y - scrollY.value
  );

  const animatedProps = useAnimatedProps(() => {
    const topScreenY = screenY.value + 6;
    const midScreenY = screenY.value + height * 0.55;
    const bottomScreenY = screenY.value + height - 6;

    const { topRightX, midRightX, bottomRightX } = getRightEdgeXs({
      cardLeft: x,
      width,
      topScreenY,
      midScreenY,
      bottomScreenY,
    });

    return {
      d: buildCardPath({
        width,
        height,
        radius: 8,
        topRightX,
        midRightX,
        bottomRightX,
      }),
    };
  });

  const topDotProps = useAnimatedProps(() => {
    const { topRightX } = getRightEdgeXs({
      cardLeft: x,
      width,
      topScreenY: screenY.value + 6,
      midScreenY: screenY.value + height * 0.55,
      bottomScreenY: screenY.value + height - 6,
    });

    return {
      cx: topRightX,
      cy: 8,
    };
  });

  const midDotProps = useAnimatedProps(() => {
    const { midRightX } = getRightEdgeXs({
      cardLeft: x,
      width,
      topScreenY: screenY.value + 6,
      midScreenY: screenY.value + height * 0.55,
      bottomScreenY: screenY.value + height - 6,
    });

    return {
      cx: midRightX,
      cy: height * 0.55,
    };
  });

  const bottomDotProps = useAnimatedProps(() => {
    const { bottomRightX } = getRightEdgeXs({
      cardLeft: x,
      width,
      topScreenY: screenY.value + 6,
      midScreenY: screenY.value + height * 0.55,
      bottomScreenY: screenY.value + height - 6,
    });

    return {
      cx: bottomRightX,
      cy: height - 8,
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    const cardCenter = screenY.value + height / 2;
    const distanceFromFocus = Math.abs(cardCenter - 420);

    const scale = interpolate(
      distanceFromFocus,
      [0, 120, 240],
      [1, 0.985, 0.97],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      distanceFromFocus,
      [0, 140, 260],
      [1, 0.92, 0.78],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        animatedStyle,
        {
          left: x,
          top: y,
          width,
          height,
        },
      ]}
    >
      <Svg width={width} height={height}>
        {/* actual card */}
        <AnimatedPath
          animatedProps={animatedProps}
          fill="#1A1A1A"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={1.2}
        />

        {/* debug: raw width boundary */}
        <Path
          d={`M ${width - 2} 0 L ${width - 2} ${height}`}
          stroke="red"
          strokeWidth={1}
          opacity={0.9}
        />

        {/* debug: actual morph edge outline */}
        <AnimatedPath
          animatedProps={animatedProps}
          fill="transparent"
          stroke="lime"
          strokeWidth={1.5}
        />

        {/* debug: right edge control dots */}
        <AnimatedCircle animatedProps={topDotProps} r={3.5} fill="yellow" />
        <AnimatedCircle animatedProps={midDotProps} r={3.5} fill="cyan" />
        <AnimatedCircle animatedProps={bottomDotProps} r={3.5} fill="magenta" />
      </Svg>

      <View style={styles.content}>
        <View>
          <Text numberOfLines={1} style={styles.client}>
            {item.client}
          </Text>
          <Text numberOfLines={1} style={styles.service}>
            {item.service}
          </Text>
        </View>

        <Text style={styles.time}>{item.time}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    position: 'absolute',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    paddingLeft: 16,
    paddingRight: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  client: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  service: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 2,
  },
  time: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});
