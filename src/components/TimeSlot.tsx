import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

interface TimeSlotProps {
  time: string;
  children?: React.ReactNode;
}

export function TimeSlot({ time, children }: TimeSlotProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.time}>{time}</Text>
      <View style={styles.lineArea}>
        <View style={styles.line} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 56,
    paddingLeft: 12,
    gap: 6,
  },
  time: {
    width: 29,
    fontSize: 11,
    color: colors.text.muted,
    fontWeight: '600',
  },
  lineArea: {
    flex: 1,
    position: 'relative',
    paddingTop: 7,
  },
  line: {
    height: 1,
    backgroundColor: colors.border.divider,
    opacity: 0.2,
  },
});
