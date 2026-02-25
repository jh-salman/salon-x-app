import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import { AlarmIcon } from './icons';
import { colors } from '../theme';

interface EventCardProps {
  title: string;
  subtitle?: string;
  start: Date;
  end: Date;
  color?: string;
  compact?: boolean;
}

export function EventCard({ title, subtitle, start, end, color = colors.event.purple }: EventCardProps) {
  const timeStr = `${dayjs(start).format('h:mm A')} - ${dayjs(end).format('h:mm A')}`;
  const gradientColors: [string, string, ...string[]] = color === colors.event.blue
    ? ['#305271', 'rgba(17, 17, 17, 0.07)']
    : color === colors.event.green
      ? ['#3a5e2f', 'rgba(17, 17, 17, 0.07)']
      : color === colors.event.gray
        ? ['rgb(108, 108, 108)', 'rgb(17, 17, 17)']
        : ['#592465', '#111'];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      <View style={[styles.indicator, { backgroundColor: color }]} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        )}
        <View style={styles.timeRow}>
          <AlarmIcon color={color} size={12} />
          <Text style={[styles.time, { color }]}>{timeStr.toUpperCase()}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 8,
    borderRadius: 4,
    minHeight: 48,
  },
  indicator: {
    width: 2.5,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '400',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 8,
    fontWeight: '500',
  },
});
