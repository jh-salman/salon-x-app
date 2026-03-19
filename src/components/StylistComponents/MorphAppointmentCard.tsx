import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { RFValue } from '../../utils/responsive';
import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { ms, vs } from '../../utils/responsive';
import { STYLIST_CONTENT_PADDING_LEFT } from './stylistConstants';
import { SetTimerButton } from './SetTimerButton';
import { buildCardPath, getRightEdgeXs } from './cardPathUtils';
import { getCountdownLabel } from './stylistCardUtils';

const TIMER_TRACK = '#666666';
const TIMER_ACTIVE = '#00d9ff';
const TIMER_INNER_BG = '#1b1b1d';

function CircularTimer({
  size = 74,
  strokeWidth = 7,
  progress = 0.33,
  activeColor = TIMER_ACTIVE,
  trackColor = TIMER_TRACK,
  innerColor = TIMER_INNER_BG,
  time = '60:00',
  label = 'remaining',
}: {
  size?: number;
  strokeWidth?: number;
  progress?: number;
  activeColor?: string;
  trackColor?: string;
  innerColor?: string;
  time?: string;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressLength = circumference * progress;
  const remainingLength = circumference - progressLength;
  const innerSize = size - strokeWidth * 2 - 4;

  return (
    <View style={[timerStyles.outer, { width: size, height: size }]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${progressLength} ${remainingLength}`}
          strokeLinecap="butt"
        />
      </Svg>
      <View
        style={[
          timerStyles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: innerColor,
          },
        ]}
      >
        <Text style={timerStyles.timerMinutes}>{time}</Text>
        <Text style={timerStyles.timerLabel}>{label}</Text>
      </View>
    </View>
  );
}

const timerStyles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerMinutes: {
    fontSize: RFValue(8),
    fontWeight: '700',
    color: '#d9d9d9',
    lineHeight: RFValue(10),
  },
  timerLabel: {
    fontSize: RFValue(5),
    color: '#9f9f9f',
    lineHeight: RFValue(6),
    marginTop: 0,
  },
});

/** Set to true to show green outline, yellow/cyan/magenta dots, and red guide line. */
const DEBUG_VISUALS = false;

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
  /** Left position inside viewport (use 0 when viewport is already at STYLIST_CARD_LEFT). */
  x: number;
  y: number;
  width: number;
  height: number;
  scrollY: SharedValue<number>;
  /** Screen Y where the appointment viewport starts (for rail alignment). */
  railScreenOffsetY: number;
  /** Screen X of card left edge for rail path; when set, card position uses x=0 for alignment. */
  screenLeft?: number;
  /** When true, show only client name and "Need attention" instead of service (waiting list card). */
  isWaitlist?: boolean;
  /** When false, show "Set timer" button instead of progress circle (first 3 cards have circle, rest have button). */
  showProgressCircle?: boolean;
};

export function MorphAppointmentCard({
  item,
  x,
  y,
  width,
  height,
  scrollY,
  railScreenOffsetY,
  screenLeft,
  isWaitlist = false,
  showProgressCircle = true,
}: Props) {
  const { primaryColor } = useTheme();
  const [countdownLabel, setCountdownLabel] = useState(() => getCountdownLabel(item.time));

  /** Progress 0..1 for circular timer (placeholder; no duration data yet). */
  const progressRing = 0.75;
  const timerSize = ms(44);
  const timerStroke = ms(4);

  useEffect(() => {
    const interval = setInterval(() => setCountdownLabel(getCountdownLabel(item.time)), 60_000);
    return () => clearInterval(interval);
  }, [item.time]);
  const cardLeft = screenLeft ?? x;
  const positionLeft = screenLeft != null ? 0 : x;
  const screenY = useDerivedValue(
    () => railScreenOffsetY + y - scrollY.value
  );

  const animatedProps = useAnimatedProps(() => {
    const topScreenY = screenY.value + 6;
    const midScreenY = screenY.value + height * 0.55;
    const bottomScreenY = screenY.value + height - 6;

    const { topRightX, midRightX, bottomRightX } = getRightEdgeXs({
      cardLeft,
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
      cardLeft,
      width,
      topScreenY: screenY.value + 6,
      midScreenY: screenY.value + height * 0.55,
      bottomScreenY: screenY.value + height - 6,
    });
    const r = 8;
    return {
      cx: topRightX,
      cy: r,
    };
  });

  const midDotProps = useAnimatedProps(() => {
    const { topRightX, midRightX, bottomRightX } = getRightEdgeXs({
      cardLeft,
      width,
      topScreenY: screenY.value + 6,
      midScreenY: screenY.value + height * 0.55,
      bottomScreenY: screenY.value + height - 6,
    });
    const t = 0.5;
    const u = 1 - t;
    const u3 = u * u * u;
    const u2t = u * u * t * 3;
    const ut2 = u * t * t * 3;
    const t3 = t * t * t;
    const midCurveX = u3 * topRightX + u2t * midRightX + ut2 * midRightX + t3 * bottomRightX;
    const midCurveY = height * (u3 * 0.22 + u2t * 0.35 + ut2 * 0.65 + t3 * 0.82);
    return {
      cx: midCurveX,
      cy: midCurveY,
    };
  });

  const bottomDotProps = useAnimatedProps(() => {
    const { bottomRightX } = getRightEdgeXs({
      cardLeft,
      width,
      topScreenY: screenY.value + 6,
      midScreenY: screenY.value + height * 0.55,
      bottomScreenY: screenY.value + height - 6,
    });
    const r = 8;
    return {
      cx: bottomRightX,
      cy: height - r,
    };
  });

  // No scale/opacity animation on scroll — keeps card outline and border fixed and smooth
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 }],
    opacity: 1,
  }));

  const cardContent = (
    <>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient
            id={`appointmentCardStroke-${item.id}`}
            x1={width * (159.793 / 394)}
            y1={height * (15.3859 / 78)}
            x2={width * (334.793 / 394)}
            y2={height * (25.3859 / 78)}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={primaryColor} />
            <Stop offset="1" stopColor="#1A1A1A" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <AnimatedPath
          animatedProps={animatedProps}
          fill="#1A1A1A"
          stroke={`url(#appointmentCardStroke-${item.id})`}
          strokeWidth={1.5}
        />

        {DEBUG_VISUALS && (
          <Path
            d={`M ${width - 2} 0 L ${width - 2} ${height}`}
            stroke="red"
            strokeWidth={1}
            opacity={0.9}
          />
        )}

        {DEBUG_VISUALS && (
          <AnimatedPath
            animatedProps={animatedProps}
            fill="transparent"
            stroke="lime"
            strokeWidth={1.5}
          />
        )}

        {DEBUG_VISUALS && (
          <>
            <AnimatedCircle animatedProps={topDotProps} r={3.5} fill="yellow" />
            <AnimatedCircle animatedProps={midDotProps} r={3.5} fill="cyan" />
            <AnimatedCircle animatedProps={bottomDotProps} r={3.5} fill="magenta" />
          </>
        )}
      </Svg>

      <View style={styles.content}>
        {/* Left: client name + service name (or "Need attention" for waitlist) */}
        <View style={styles.leftSection}>
          <Text
            numberOfLines={1}
            style={[styles.client, isWaitlist && styles.clientWaitlist]}
          >
            {item.client}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.service, isWaitlist && styles.serviceWaitlist]}
          >
            {isWaitlist ? 'Need attention' : item.service}
          </Text>
        </View>

        {!isWaitlist && (
          <>
            {/* Middle: time */}
            <View style={styles.timeWrap}>
              <Text numberOfLines={1} style={styles.time}>
                {item.time}
              </Text>
            </View>
            <View style={styles.divider} />
            {/* Right: progress circle (first 3) or Set timer button (rest) */}
            <View style={styles.timerWrap}>
              {showProgressCircle ? (
                <CircularTimer
                  size={timerSize}
                  strokeWidth={timerStroke}
                  progress={progressRing}
                  activeColor={primaryColor}
                  trackColor={TIMER_TRACK}
                  innerColor={TIMER_INNER_BG}
                  time="60:00"
                  label="remaining"
                />
              ) : (
                <SetTimerButton onPress={() => {}} size={timerSize} />
              )}
            </View>
          </>
        )}
      </View>
    </>
  );

  const wrapStyle = [
    styles.cardWrap,
    animatedStyle,
    { left: positionLeft, top: y, width, height },
  ];

  return <Animated.View style={wrapStyle}>{cardContent}</Animated.View>;
}

const styles = StyleSheet.create({
  cardWrap: {
    position: 'absolute',
    overflow: 'hidden',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    width: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: STYLIST_CONTENT_PADDING_LEFT,
    paddingRight: ms(8),
  },
  leftSection: {
    flex: 1,
    minWidth: 0,
    paddingRight: ms(8),
  },
  timeWrap: {
    paddingHorizontal: ms(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ms(10),
  },
  time: {
    fontSize: RFValue(12),
    color: '#cfcfcf',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: '#6C6C6C',
    marginRight: ms(4),
  },
  timerWrap: {
    width: ms(52),
    alignItems: 'center',
    justifyContent: 'center',
  },
  client: {
    color: '#FFFFFF',
    fontSize: RFValue(14),
    fontWeight: '700',
    marginBottom: vs(4),
  },
  clientWaitlist: {
    marginBottom: vs(1),
    fontSize: RFValue(11),
  },
  service: {
    color: '#bdbdbd',
    fontSize: RFValue(12),
    fontWeight: '400',
  },
  serviceWaitlist: {
    fontSize: RFValue(10),
  },
});
