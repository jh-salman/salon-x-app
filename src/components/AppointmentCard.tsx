import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { format } from 'date-fns';
import { ms } from '../utils/responsive';
import { colors as themeColors } from '../theme';

const VERTICAL_ACCENT_WIDTH = 3;

export interface Appointment {
  id: string;
  clientName: string;
  service: string;
  startTime: Date;
  endTime: Date;
  color: 'pink' | 'blue' | 'green' | 'gray';
  isParked?: boolean;
  hasAlarm?: boolean;
  processingTimeStart?: number;
  processingTimeEnd?: number;
}

export const appointmentColors = {
  pink: { gradient: ['#592465', '#111'], indicator: themeColors.highlight.neonPink, text: '#FFFFFF', serviceText: '#FFFFFF' },
  blue: { gradient: ['#305271', '#111'], indicator: themeColors.highlight.neonBlue, text: '#FFFFFF', serviceText: '#FFFFFF' },
  green: { gradient: ['#3a5e2f', 'rgba(17, 17, 17, 0.07)'], indicator: '#9de684', text: '#FFFFFF', serviceText: '#FFFFFF' },
  gray: { gradient: ['rgb(108, 108, 108)', 'rgb(17, 17, 17)'], indicator: 'white', text: '#FFFFFF', serviceText: '#FFFFFF' },
};

const SLOT_HEIGHT = 56;
const PIXELS_PER_MINUTE = SLOT_HEIGHT / 60;

const svgPaths = {
  alarm: 'M6.70319 6.5157L5.01819 5.51569V3.2507C5.01819 3.0507 4.85819 2.8907 4.65819 2.8907H4.62819C4.42819 2.8907 4.26819 3.0507 4.26819 3.2507V5.61069C4.26819 5.78569 4.35819 5.9507 4.51319 6.0407L6.33819 7.13569C6.50819 7.23569 6.72819 7.18569 6.82819 7.01569C6.93319 6.84069 6.87819 6.61569 6.70319 6.5157V6.5157ZM9.35819 1.3957L7.81819 0.115695C7.60819 -0.0593048 7.29319 -0.0343048 7.11319 0.180695C6.93819 0.390695 6.96819 0.705695 7.17819 0.885695L8.71319 2.1657C8.92319 2.3407 9.23819 2.3157 9.41819 2.1007C9.59819 1.8907 9.56819 1.5757 9.35819 1.3957V1.3957ZM0.818191 2.1657L2.35319 0.885695C2.56819 0.705695 2.59819 0.390695 2.41819 0.180695C2.24319 -0.0343048 1.92819 -0.0593048 1.71819 0.115695L0.178191 1.3957C-0.0318086 1.5757 -0.0618086 1.8907 0.118191 2.1007C0.293191 2.3157 0.608191 2.3407 0.818191 2.1657ZM4.76819 0.890695C2.28319 0.890695 0.268191 2.9057 0.268191 5.3907C0.268191 7.8757 2.28319 9.8907 4.76819 9.8907C7.25319 9.8907 9.26819 7.8757 9.26819 5.3907C9.26819 2.9057 7.25319 0.890695 4.76819 0.890695ZM4.76819 8.8907C2.83819 8.8907 1.26819 7.32069 1.26819 5.3907C1.26819 3.4607 2.83819 1.8907 4.76819 1.8907C6.69819 1.8907 8.26819 3.4607 8.26819 5.3907C6.69819 8.8907 8.26819 8.8907 4.76819 8.8907Z',
};

const AlarmIcon = ({ color }: { color: string }) => (
  <View style={styles.alarmIcon}>
    <View style={styles.alarmIconInner}>
      <Svg width={9.53638} height={9.8907} viewBox="0 0 9.53638 9.8907" fill="none">
        <Path d={svgPaths.alarm} fill={color} />
      </Svg>
    </View>
  </View>
);

type CardLayoutTier = 'compact' | 'medium' | 'full';

interface CardTierConfig {
  layout: CardLayoutTier;
  cardGap: number;
  paddingVertical: number;
  paddingHorizontal: number;
  indicatorSize: number;
  clientServiceFont: number;
  clientServiceLineHeight: number;
  timeFont: number;
  timeLineHeight: number;
  processTimeFont: number;
  gap: number;
  timeMarginBottom: number;
}

function getCardTierConfig(durationMinutes: number): CardTierConfig {
  if (durationMinutes <= 20) {
    return {
      layout: 'compact',
      cardGap: 2,
      paddingVertical: 1,
      paddingHorizontal: ms(3),
      indicatorSize: ms(3),
      clientServiceFont: ms(7),
      clientServiceLineHeight: ms(9),
      timeFont: ms(6),
      timeLineHeight: ms(8),
      processTimeFont: 0,
      gap: 0,
      timeMarginBottom: 0,
    };
  }
  if (durationMinutes <= 30) {
    return {
      layout: 'compact',
      cardGap: ms(3),
      paddingVertical: 2,
      paddingHorizontal: ms(4),
      indicatorSize: ms(4),
      clientServiceFont: ms(8),
      clientServiceLineHeight: ms(11),
      timeFont: ms(8),
      timeLineHeight: ms(10),
      processTimeFont: 0,
      gap: 0,
      timeMarginBottom: 0,
    };
  }
  if (durationMinutes <= 45) {
    return {
      layout: 'medium',
      cardGap: ms(4),
      paddingVertical: ms(2),
      paddingHorizontal: ms(6),
      indicatorSize: ms(4),
      clientServiceFont: ms(9),
      clientServiceLineHeight: ms(11),
      timeFont: ms(8),
      timeLineHeight: ms(10),
      processTimeFont: 0,
      gap: ms(3),
      timeMarginBottom: 2,
    };
  }
  if (durationMinutes <= 60) {
    return {
      layout: 'medium',
      cardGap: ms(5),
      paddingVertical: ms(3),
      paddingHorizontal: ms(6),
      indicatorSize: ms(5),
      clientServiceFont: ms(10),
      clientServiceLineHeight: ms(12),
      timeFont: ms(9),
      timeLineHeight: ms(11),
      processTimeFont: 0,
      gap: ms(4),
      timeMarginBottom: 2,
    };
  }
  if (durationMinutes <= 90) {
    return {
      layout: 'full',
      cardGap: ms(6),
      paddingVertical: ms(4),
      paddingHorizontal: ms(8),
      indicatorSize: ms(5),
      clientServiceFont: ms(11),
      clientServiceLineHeight: ms(13),
      timeFont: ms(9),
      timeLineHeight: ms(10),
      processTimeFont: ms(8),
      gap: ms(4),
      timeMarginBottom: 0,
    };
  }
  return {
    layout: 'full',
    cardGap: ms(6),
    paddingVertical: ms(4),
    paddingHorizontal: ms(8),
    indicatorSize: ms(5),
    clientServiceFont: ms(13),
    clientServiceLineHeight: ms(15),
    timeFont: ms(10),
    timeLineHeight: ms(12),
    processTimeFont: ms(9),
    gap: ms(6),
    timeMarginBottom: 0,
  };
}

export function AppointmentCard({ appointment, opacity }: { appointment: Appointment; opacity?: number }) {
  const colors = appointmentColors[appointment.color];
  const durationMinutes = (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60);
  const height = durationMinutes * PIXELS_PER_MINUTE;
  const cardOpacity = opacity ?? (appointment.isParked ? 0.9 : 1);
  const tier = getCardTierConfig(durationMinutes);
  const hasProcessTime =
    appointment.processingTimeStart != null &&
    appointment.processingTimeEnd != null &&
    appointment.processingTimeStart < appointment.processingTimeEnd;
  const processStartTime = hasProcessTime
    ? new Date(appointment.startTime.getTime() + appointment.processingTimeStart! * 60 * 1000)
    : null;
  const processEndTime = hasProcessTime
    ? new Date(appointment.startTime.getTime() + appointment.processingTimeEnd! * 60 * 1000)
    : null;

  if (tier.layout === 'compact') {
    return (
      <View
        style={[
          styles.appointmentCard,
          {
            height,
            opacity: cardOpacity,
            gap: tier.cardGap,
            paddingVertical: tier.paddingVertical,
            paddingLeft: ms(4),
            paddingRight: tier.paddingHorizontal,
          },
        ]}
      >
        <LinearGradient
          colors={colors.gradient as [string, string]}
          style={[StyleSheet.absoluteFill, styles.appointmentBackground]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={[styles.verticalAccent, { backgroundColor: colors.indicator }]} />
        <View
          style={[
            styles.appointmentIndicator,
            {
              width: tier.indicatorSize,
              height: tier.indicatorSize,
              borderRadius: tier.indicatorSize / 2,
              backgroundColor: colors.indicator,
            },
          ]}
        />
        <View style={styles.appointmentContentCompactRow}>
          <Text
            style={[
              styles.appointmentCompactLineBase,
              {
                color: colors.text,
                fontSize: tier.clientServiceFont,
                lineHeight: tier.clientServiceLineHeight,
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {appointment.clientName}
          </Text>
          <View style={styles.appointmentServiceMiddleWrap}>
            <Text
              style={[
                styles.appointmentServiceBase,
                {
                  color: colors.serviceText,
                  fontSize: tier.clientServiceFont,
                  lineHeight: tier.clientServiceLineHeight,
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {appointment.service}
            </Text>
          </View>
          <View style={styles.appointmentTimeRightWrap}>
            <Text
              style={[
                styles.appointmentTimeAtBottomBase,
                {
                  color: colors.serviceText,
                  fontSize: tier.timeFont,
                  lineHeight: tier.timeLineHeight,
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {format(appointment.startTime, 'h:mm')} – {format(appointment.endTime, 'h:mm a')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (tier.layout === 'medium') {
    return (
      <View
        style={[
          styles.appointmentCard,
          {
            height,
            opacity: cardOpacity,
            gap: tier.cardGap,
            paddingVertical: tier.paddingVertical,
            paddingLeft: ms(4),
            paddingRight: tier.paddingHorizontal,
          },
        ]}
      >
        <LinearGradient
          colors={colors.gradient as [string, string]}
          style={[StyleSheet.absoluteFill, styles.appointmentBackground]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={[styles.verticalAccent, { backgroundColor: colors.indicator }]} />
        <View
          style={[
            styles.appointmentIndicator,
            { width: tier.indicatorSize, height: tier.indicatorSize, borderRadius: tier.indicatorSize / 2, backgroundColor: colors.indicator },
          ]}
        />
        <View style={[styles.appointmentContentMedium, { gap: tier.gap }]}>
          <View style={[styles.appointmentDetailsRow, { gap: tier.cardGap }]}>
            <Text
              style={[styles.appointmentClientNameBase, { color: colors.text, fontSize: tier.clientServiceFont, lineHeight: tier.clientServiceLineHeight }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {appointment.clientName}
            </Text>
            <View style={styles.appointmentServiceRightWrap}>
              <Text
                style={[styles.appointmentServiceBase, { color: colors.serviceText, fontSize: tier.clientServiceFont, lineHeight: tier.clientServiceLineHeight }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {appointment.service}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.appointmentTimeAtBottomBase,
              {
                color: colors.serviceText,
                fontSize: tier.timeFont,
                lineHeight: tier.timeLineHeight,
                marginBottom: tier.timeMarginBottom,
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {format(appointment.startTime, 'h:mm')} – {format(appointment.endTime, 'h:mm a')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.appointmentCard,
        {
          height,
          opacity: cardOpacity,
          gap: tier.cardGap,
          paddingVertical: tier.paddingVertical,
          paddingLeft: ms(4),
          paddingRight: tier.paddingHorizontal,
        },
      ]}
    >
      <LinearGradient
        colors={colors.gradient as [string, string]}
        style={[StyleSheet.absoluteFill, styles.appointmentBackground]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={[styles.verticalAccent, { backgroundColor: colors.indicator }]} />
      <View
        style={[
          styles.appointmentIndicator,
          { width: tier.indicatorSize, height: tier.indicatorSize, borderRadius: tier.indicatorSize / 2, backgroundColor: colors.indicator },
        ]}
      />
      <View style={[styles.appointmentContent, { gap: tier.gap }]}>
        <View style={[styles.appointmentDetails, { gap: tier.gap }]}>
          <Text
            style={[styles.appointmentClientNameBase, { color: colors.text, fontSize: tier.clientServiceFont, lineHeight: tier.clientServiceLineHeight }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {appointment.clientName}
          </Text>
          <Text
            style={[styles.appointmentServiceBase, { color: colors.serviceText, fontSize: tier.clientServiceFont, lineHeight: tier.clientServiceLineHeight }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {appointment.service}
          </Text>
        </View>
        {appointment.hasAlarm && (
          <View style={[styles.appointmentTimeContainer, { marginBottom: tier.gap }]}>
            <AlarmIcon color={colors.indicator} />
            <Text
              style={[styles.appointmentTimeBase, { color: '#FFFFFF', fontSize: tier.timeFont, lineHeight: tier.timeLineHeight }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {format(appointment.startTime, 'h:mm')} - {format(appointment.endTime, 'h:mm a').toUpperCase()}
            </Text>
          </View>
        )}
        {hasProcessTime && processStartTime && processEndTime && (
          <Text
            style={[styles.appointmentProcessTimeBase, { color: colors.serviceText, fontSize: tier.processTimeFont }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Process {format(processStartTime, 'h:mm')}–{format(processEndTime, 'h:mm')}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appointmentCard: { flexDirection: 'row', gap: ms(6), borderRadius: ms(4), overflow: 'hidden', position: 'relative', width: '100%' },
  appointmentBackground: { borderRadius: ms(4) },
  verticalAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: VERTICAL_ACCENT_WIDTH,
    borderTopLeftRadius: ms(4),
    borderBottomLeftRadius: ms(4),
  },
  appointmentIndicator: { alignSelf: 'center' },
  appointmentContent: { flex: 1, minWidth: 0, overflow: 'hidden' },
  appointmentContentCompactRow: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0, overflow: 'hidden', gap: ms(3) },
  appointmentContentMedium: { flex: 1, justifyContent: 'space-between', minWidth: 0, overflow: 'hidden' },
  appointmentCompactLineBase: { fontFamily: 'Lato-SemiBold', flex: 1, minWidth: 0 },
  appointmentServiceMiddleWrap: { flex: 1, minWidth: 0, justifyContent: 'center', alignItems: 'center' },
  appointmentTimeRightWrap: { flexShrink: 0 },
  appointmentDetailsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, minWidth: 0, overflow: 'hidden' },
  appointmentServiceRightWrap: { flexShrink: 1, minWidth: 0, maxWidth: '48%', alignItems: 'flex-end' },
  appointmentTimeAtBottomBase: { fontFamily: 'Lato-Medium' },
  appointmentDetails: { flex: 1, minWidth: 0, overflow: 'hidden' },
  appointmentClientNameBase: { fontFamily: 'Lato-SemiBold', textTransform: 'capitalize' as const },
  appointmentServiceBase: { fontFamily: 'Lato-SemiBold' },
  appointmentTimeContainer: { flexDirection: 'row', alignItems: 'center', gap: ms(2) },
  appointmentTimeBase: { fontFamily: 'Lato-Medium', textTransform: 'uppercase' as const },
  appointmentProcessTimeBase: { fontFamily: 'Lato-Medium', opacity: 0.9 },
  alarmIcon: { width: ms(12), height: ms(12), overflow: 'hidden', position: 'relative' },
  alarmIconInner: { position: 'absolute', left: '10.27%', right: '10.26%', top: '9.24%', bottom: '8.33%' },
});
