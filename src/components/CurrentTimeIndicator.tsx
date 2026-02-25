import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface CurrentTimeIndicatorProps {
  time: string;
  top: number;
}

export function CurrentTimeIndicator({ time, top }: CurrentTimeIndicatorProps) {
  return (
    <View style={[styles.container, { top }]}>
      <View style={styles.badge}>
        <Text style={styles.timeText}>{time}</Text>
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 12,
  },
  badge: {
    backgroundColor: colors.indicator.badge,
    paddingHorizontal: 4.6,
    paddingVertical: 0.6,
    borderRadius: 4,
  },
  timeText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.04,
  },
  line: {
    position: 'absolute',
    left: 23,
    right: 12,
    height: 1,
    backgroundColor: colors.indicator.current,
  },
});
