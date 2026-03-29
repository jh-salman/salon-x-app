import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ms } from '../../utils/responsive';
import { RFValue } from '../../utils/responsive';

const TEXT = '#B9BDC5';
const BLACK_RING = '#050505';

type SetTimerButtonProps = {
  onPress?: () => void;
  /** Button size (width/height). Default fits card. */
  size?: number;
  /** When set (e.g. stopwatch), replaces "Set / Timer" label. */
  displayLabel?: string;
  /** Theme primary — used for border when stopwatch label is shown. */
  primaryColor?: string;
};

/** Matches MorphAppointmentCard `timerSquare` (service timer badge). */
const TIMER_CORNER = ms(8);

export function SetTimerButton({ onPress, size = ms(44), displayLabel, primaryColor }: SetTimerButtonProps) {
  const hasLabel = Boolean(displayLabel && displayLabel.trim().length > 0);
  const borderColor = hasLabel && primaryColor ? primaryColor : BLACK_RING;
  return (
    <Pressable
      style={[
        styles.button,
        hasLabel && styles.buttonStopwatchActive,
        {
          width: size,
          height: size,
          borderRadius: TIMER_CORNER,
          borderColor,
        },
      ]}
      onPress={onPress}
      accessibilityLabel={hasLabel ? `Stopwatch ${displayLabel}` : 'Set timer'}
    >
      {hasLabel ? (
        <Text
          style={[styles.textMono, styles.textMonoActive]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.55}
        >
          {displayLabel}
        </Text>
      ) : (
        <Text style={[styles.text, { color: TEXT }]} numberOfLines={2}>
          Set{'\n'}Timer
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16,16,18,0.32)',
    shadowColor: '#020202',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.38,
    shadowRadius: 4,
    elevation: 4,
  },
  /** Same fill as `timerSquareRunning` / `timerSquareDone` when stopwatch time is shown. */
  buttonStopwatchActive: {
    backgroundColor: '#000000',
  },
  text: {
    fontSize: RFValue(10),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: RFValue(12),
  },
  textMono: {
    fontSize: RFValue(9),
    fontWeight: '600',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  textMonoActive: {
    color: '#FFFFFF',
  },
});
