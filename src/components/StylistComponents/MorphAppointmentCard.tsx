import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { RFValue } from '../../utils/responsive';
import Animated, {
  SharedValue,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { ms, vs } from '../../utils/responsive';
import { STYLIST_CONTENT_PADDING_LEFT } from './stylistConstants';
import { SetTimerButton } from './SetTimerButton';
import { buildCardPath, getRightEdgeXs } from './cardPathUtils';
import { getCountdownLabel } from './stylistCardUtils';
import type { AppointmentTimerBadge } from './AppointmentsSection';

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
  timerBadge?: AppointmentTimerBadge;
  onSetTimerPress?: (item: Appointment) => void;
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
  showProgressCircle = false,
  timerBadge,
  onSetTimerPress,
}: Props) {
  const { primaryColor } = useTheme();
  const [countdownLabel, setCountdownLabel] = useState(() => getCountdownLabel(item.time));
  const timerBlinkOpacity = useSharedValue(1);

  /** Progress 0..1 for circular timer (placeholder; no duration data yet). */
  const progressRing = 0.75;
  const timerSize = ms(44);
  const timerStroke = ms(4);

  useEffect(() => {
    const interval = setInterval(() => setCountdownLabel(getCountdownLabel(item.time)), 60_000);
    return () => clearInterval(interval);
  }, [item.time]);

  useEffect(() => {
    if (timerBadge?.status === 'done') {
      timerBlinkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.28, { duration: 320 }),
          withTiming(1, { duration: 320 })
        ),
        -1,
        false
      );
      return;
    }
    cancelAnimation(timerBlinkOpacity);
    timerBlinkOpacity.value = 1;
  }, [timerBadge?.status, timerBlinkOpacity]);
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

  const timerBlinkStyle = useAnimatedStyle(() => ({
    opacity: timerBlinkOpacity.value,
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
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={[styles.client, isWaitlist && styles.clientWaitlist]}
          >
            {item.client}
          </Text>
          {isWaitlist ? (
            <Text
              numberOfLines={2}
              style={[styles.service, isWaitlist && styles.serviceWaitlist]}
            >
              Need attention
            </Text>
          ) : (
            <View style={styles.serviceTimeRow}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={styles.serviceInline}
              >
                {item.service}
              </Text>
              <Text numberOfLines={1} style={styles.timeInline}>
                {item.time}
              </Text>
            </View>
          )}
        </View>

        {!isWaitlist && (
          <>
            <View style={styles.divider} />
            {/* Right: running timer badge, otherwise progress circle or Set timer button */}
            <View style={styles.timerWrap}>
              {timerBadge ? (
                <Animated.View style={timerBadge.status === 'done' ? timerBlinkStyle : undefined}>
                  <Pressable
                  style={[
                    styles.timerSquare,
                    timerBadge.status === 'running' ? [styles.timerSquareRunning, { borderColor: primaryColor }] : null,
                    timerBadge.status === 'done' ? [styles.timerSquareDone, { borderColor: primaryColor }] : null,
                    timerBadge.status === 'paused' || timerBadge.status === 'idle' ? styles.timerSquarePaused : null,
                  ]}
                  onPress={() => onSetTimerPress?.(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open timer for ${item.client}`}
                >
                  <Text numberOfLines={1} style={styles.timerSquareTime}>
                    {timerBadge.timeText}
                  </Text>
                  </Pressable>
                </Animated.View>
              ) : showProgressCircle ? (
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
                <SetTimerButton
                  onPress={() => onSetTimerPress?.(item)}
                  size={timerSize}
                />
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
    paddingRight: ms(4),
  },
  serviceTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minWidth: 0,
  },
  serviceInline: {
    flex: 1,
    minWidth: 0,
    color: '#bdbdbd',
    fontSize: RFValue(10),
    fontWeight: '400',
    marginRight: ms(4),
  },
  timeInline: {
    color: '#cfcfcf',
    fontSize: RFValue(9),
    flexShrink: 0,
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
    marginRight: ms(10),
  },
  timerSquare: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(8),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(2),
  },
  timerSquareRunning: {
    borderColor: '#00D9FF',
    backgroundColor: '#000000',
  },
  timerSquareDone: {
    borderColor: '#00D9FF',
    backgroundColor: '#000000',
  },
  timerSquarePaused: {
    borderColor: 'rgba(255,255,255,0.42)',
    backgroundColor: '#000000',
  },
  timerSquareTime: {
    color: '#FFFFFF',
    fontSize: RFValue(9),
    fontWeight: '700',
    letterSpacing: ms(0.5),
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  client: {
    color: '#FFFFFF',
    fontSize: RFValue(12),
    fontWeight: '700',
    marginBottom: vs(2),
  },
  clientWaitlist: {
    marginBottom: vs(1),
    fontSize: RFValue(11),
  },
  service: {
    color: '#bdbdbd',
    fontSize: RFValue(10),
    fontWeight: '400',
  },
  serviceWaitlist: {
    fontSize: RFValue(10),
  },
});
