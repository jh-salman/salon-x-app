import React, { useMemo, useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, PanResponder, Dimensions } from 'react-native';
import { haptics } from '../utils/haptics';
import { wp, hp, ms, vs } from '../utils/responsive';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import type { ParkZoneBounds, CalendarLayout } from './AllDaySection';
import { GlassConfirmModal } from './GlassConfirmModal';
import Svg, { Path, G, Circle, Ellipse, Defs, LinearGradient, Stop, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeComposite, FeBlend } from 'react-native-svg';
import { format } from 'date-fns';
import { colors as themeColors } from '../theme';

const ORB_SIZE = 24;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLACEMENT_LINE_MARGIN = wp(6);

export interface Appointment {
  id: string;
  clientName: string;
  service: string;
  startTime: Date;
  endTime: Date;
  color: 'pink' | 'blue' | 'green' | 'gray';
  isParked?: boolean;
  hasAlarm?: boolean;
  /** Minutes into service when processing begins */
  processingTimeStart?: number;
  /** Minutes into service when processing ends */
  processingTimeEnd?: number;
}

export interface AllDayAppointment {
  id: string;
  clientName: string;
  color: 'orange' | 'orange2';
}

interface CalendarMiddleSectionProps {
  selectedDate: Date;
  appointments?: Appointment[];
  allDayAppointments?: AllDayAppointment[];
  onAppointmentPress?: (appointment: Appointment) => void;
  onAppointmentDoubleTap?: (appointment: Appointment) => void;
  currentTime?: Date;
  showCurrentTimeIndicator?: boolean;
  parkZone?: ParkZoneBounds | null;
  onParkAppointment?: (id: string) => void;
  onMoveAppointment?: (id: string, newStart: Date, newEnd: Date) => void;
  onResizeAppointment?: (id: string, newStart: Date, newEnd: Date) => void;
  onNotifyClient?: (id: string) => void;
  onDragOverParkZone?: (isOver: boolean) => void;
  onCalendarLayoutChange?: (layout: CalendarLayout) => void;
  onEmptySlotPress?: (date: Date, hour: number) => void;
  /** Used in Week view: resolves drop screenX to target date for cross-day move */
  getTargetDateForDrop?: (screenX: number) => Date | null;
  /** Week view: single shared scroll, no time axis, grid full width */
  variant?: 'day' | 'week-column';
  /** Week view: vertical scroll offset from parent for drag/drop */
  parentScrollY?: number;
  /** Day view: horizontal swipe in middle calendar area */
  onHorizontalSwipe?: (direction: 'prev' | 'next') => void;
  /** Day view: finger move – content follows; parent updates translateX */
  onHorizontalSwipeMove?: (translationX: number) => void;
  /** Day view: released before half-width – snap back, no date change */
  onHorizontalSwipeCancel?: () => void;
}

export interface CalendarMiddleSectionRef {
  requestScrollWhenDragging: (screenY: number) => void;
  stopScrollWhenDragging: () => void;
}

const DRAG_EDGE_ZONE = 56;
const DRAG_SCROLL_STEP = 28;
const DRAG_SCROLL_INTERVAL_MS = 50;
/** Day view content height (6–23, 56px/hour); must match HOUR_SLOTS * SLOT_HEIGHT below */
const DAY_CONTENT_HEIGHT = (23 - 6 + 1) * 56;

const svgPaths = {
  alarm: 'M6.70319 6.5157L5.01819 5.51569V3.2507C5.01819 3.0507 4.85819 2.8907 4.65819 2.8907H4.62819C4.42819 2.8907 4.26819 3.0507 4.26819 3.2507V5.61069C4.26819 5.78569 4.35819 5.9507 4.51319 6.0407L6.33819 7.13569C6.50819 7.23569 6.72819 7.18569 6.82819 7.01569C6.93319 6.84069 6.87819 6.61569 6.70319 6.5157V6.5157ZM9.35819 1.3957L7.81819 0.115695C7.60819 -0.0593048 7.29319 -0.0343048 7.11319 0.180695C6.93819 0.390695 6.96819 0.705695 7.17819 0.885695L8.71319 2.1657C8.92319 2.3407 9.23819 2.3157 9.41819 2.1007C9.59819 1.8907 9.56819 1.5757 9.35819 1.3957V1.3957ZM0.818191 2.1657L2.35319 0.885695C2.56819 0.705695 2.59819 0.390695 2.41819 0.180695C2.24319 -0.0343048 1.92819 -0.0593048 1.71819 0.115695L0.178191 1.3957C-0.0318086 1.5757 -0.0618086 1.8907 0.118191 2.1007C0.293191 2.3157 0.608191 2.3407 0.818191 2.1657ZM4.76819 0.890695C2.28319 0.890695 0.268191 2.9057 0.268191 5.3907C0.268191 7.8757 2.28319 9.8907 4.76819 9.8907C7.25319 9.8907 9.26819 7.8757 9.26819 5.3907C9.26819 2.9057 7.25319 0.890695 4.76819 0.890695ZM4.76819 8.8907C2.83819 8.8907 1.26819 7.32069 1.26819 5.3907C1.26819 3.4607 2.83819 1.8907 4.76819 1.8907C6.69819 1.8907 8.26819 3.4607 8.26819 5.3907C6.69819 8.8907 8.26819 8.8907 4.76819 8.8907Z',
};

const appointmentColors = {
  pink: { gradient: ['#592465', '#111'], indicator: themeColors.highlight.neonPink, text: '#FFFFFF', serviceText: '#FFFFFF' },
  blue: { gradient: ['#305271', '#111'], indicator: themeColors.highlight.neonBlue, text: '#FFFFFF', serviceText: '#FFFFFF' },
  green: { gradient: ['#3a5e2f', 'rgba(17, 17, 17, 0.07)'], indicator: '#9de684', text: '#FFFFFF', serviceText: '#FFFFFF' },
  gray: { gradient: ['rgb(108, 108, 108)', 'rgb(17, 17, 17)'], indicator: 'white', text: '#FFFFFF', serviceText: '#FFFFFF' },
};

const allDayColors = {
  orange: { background: '#D27E00', backgroundOpacity: 0.24, border: '#FF7701', dotGradient: ['#F38B14', '#F93200'], dotBorderGradient: ['#D15913', '#E98963'] },
  orange2: { background: '#D27E00', backgroundOpacity: 0.24, border: '#FF7701', dotGradient: ['#F38B14', '#F93200'], dotBorderGradient: ['#D15913', '#E98963'] },
};

const AvatarDot = ({ color, uniqueId }: { color: 'orange' | 'orange2'; uniqueId: string }) => {
  const size = 8;
  const colors = allDayColors[color];
  return (
    <View style={{ width: size, height: size, marginRight: ms(11) }}>
      <Svg width={size * 6} height={size * 6} viewBox={`0 0 ${size * 6} ${size * 6}`} style={{ position: 'absolute', left: -size * 2.5, top: -size * 2.5 }}>
        <Defs>
          <Filter id={`filter_${uniqueId}`} x="0" y="0" width={size * 6} height={size * 6} filterUnits="userSpaceOnUse">
            <FeFlood floodOpacity="0" result="BackgroundImageFix" />
            <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <FeOffset dy="5.0918" />
            <FeGaussianBlur stdDeviation="10.1836" />
            <FeComposite in2="hardAlpha" operator="out" />
            <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.16 0" />
            <FeBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow" />
            <FeBlend in="SourceGraphic" in2="effect1_dropShadow" mode="normal" result="shape" />
          </Filter>
          <LinearGradient id={`grad1_${uniqueId}`} x1="1" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.dotGradient[0]} />
            <Stop offset="1" stopColor={colors.dotGradient[1]} />
          </LinearGradient>
          <LinearGradient id={`grad2_${uniqueId}`} x1="1" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.dotBorderGradient[0]} />
            <Stop offset="1" stopColor={colors.dotBorderGradient[1]} />
          </LinearGradient>
        </Defs>
        <G filter={`url(#filter_${uniqueId})`}>
          <Circle cx={size * 3} cy={size * 2.4} r={size / 2} fill={`url(#grad1_${uniqueId})`} stroke={`url(#grad2_${uniqueId})`} strokeWidth="0.5" />
        </G>
      </Svg>
    </View>
  );
};

const AllDayEvent = ({ appointment }: { appointment: AllDayAppointment }) => {
  const colors = allDayColors[appointment.color];
  const width = appointment.clientName.length > 10 ? 99 : 80;
  return (
    <View style={[styles.allDayEvent, { width }]}>
      <Svg width={width} height={19} viewBox={`0 0 ${width} 19`} style={StyleSheet.absoluteFill}>
        <Path
          d={`M8 0.5L${width - 8} 0.5C${width - 4}.1421 0.5 ${width - 0.5} 3.85786 ${width - 0.5} 8V11C${width - 0.5} 15.1421 ${width - 4}.1421 18.5 ${width - 8} 18.5H8C3.85787 18.5 0.5 15.1421 0.5 11L0.5 8C0.5 3.98724 3.65139 0.710536 7.61426 0.509766L8 0.5Z`}
          fill={colors.background}
          fillOpacity={colors.backgroundOpacity}
          stroke={colors.border}
        />
      </Svg>
      <View style={styles.allDayEventContent}>
        <AvatarDot color={appointment.color} uniqueId={appointment.id} />
        <Text style={styles.allDayEventText}>{appointment.clientName}</Text>
      </View>
    </View>
  );
};

const AllDaySection = ({ appointments }: { appointments: AllDayAppointment[] }) => (
  <View style={styles.allDayContainer}>
    <View style={styles.allDayContent}>
      {appointments.map((apt) => (
        <AllDayEvent key={apt.id} appointment={apt} />
      ))}
    </View>
    <View style={styles.allDayBorder} />
  </View>
);

const AlarmIcon = ({ color }: { color: string }) => (
  <View style={styles.alarmIcon}>
    <View style={styles.alarmIconInner}>
      <Svg width={9.53638} height={9.8907} viewBox="0 0 9.53638 9.8907" fill="none">
        <Path d={svgPaths.alarm} fill={color} />
      </Svg>
    </View>
  </View>
);

const SLOT_HEIGHT = 56;
const PIXELS_PER_MINUTE = SLOT_HEIGHT / 60;

const AppointmentCardInner = ({ appointment, opacity }: { appointment: Appointment; opacity?: number }) => {
  const colors = appointmentColors[appointment.color];
  const durationMinutes = (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60);
  const height = Math.max(durationMinutes * PIXELS_PER_MINUTE, 20);
  const cardOpacity = opacity ?? (appointment.isParked ? 0.9 : 1);
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

  return (
    <View style={[styles.appointmentCard, { height, opacity: cardOpacity }]}>
        <View style={[StyleSheet.absoluteFill, styles.appointmentBackground, { backgroundColor: colors.gradient[0] }]} />
        <View style={[styles.appointmentIndicator, { backgroundColor: colors.indicator }]} />
        <View style={styles.appointmentContent}>
          <View style={styles.appointmentDetails}>
            <Text style={[styles.appointmentClientName, { color: colors.text }]} numberOfLines={1}>{appointment.clientName}</Text>
            <Text style={[styles.appointmentService, { color: colors.serviceText }]} numberOfLines={1}>{appointment.service}</Text>
          </View>
          {appointment.hasAlarm && (
            <View style={styles.appointmentTimeContainer}>
              <AlarmIcon color={colors.indicator} />
              <Text style={[styles.appointmentTime, { color: '#FFFFFF' }]}>
                {format(appointment.startTime, 'h:mm')} - {format(appointment.endTime, 'h:mm a').toUpperCase()}
              </Text>
            </View>
          )}
          {hasProcessTime && processStartTime && processEndTime && (
            <Text style={[styles.appointmentProcessTime, { color: colors.serviceText }]} numberOfLines={1}>
              Process {format(processStartTime, 'h:mm')}–{format(processEndTime, 'h:mm')}
            </Text>
          )}
        </View>
      </View>
  );
};

const TimeLabel = ({ time }: { time: string }) => (
  <View style={styles.timeLabel}>
    <Text style={styles.timeLabelText}>{time}</Text>
  </View>
);

/** Placeholder for slot layout; time boundaries are drawn only by CalendarGridLines to avoid double lines */
const TimeLine = () => <View style={styles.timeLine} pointerEvents="none" />;

const CurrentTimeIndicator = ({ time }: { time: Date }) => (
  <View style={styles.currentTimeIndicator}>
    <View style={styles.currentTimeBadge}>
      <Text style={styles.currentTimeBadgeText}>{format(time, 'h:mm a')}</Text>
    </View>
    <View style={styles.currentTimeLine} />
  </View>
);

const COLUMN_GAP = 4;
const SLOT_MINUTE_GRANULARITY = 5;

function snapMinutesTo5(min: number): number {
  return Math.min(55, Math.round(min / SLOT_MINUTE_GRANULARITY) * SLOT_MINUTE_GRANULARITY);
}

interface PositionedAppointment {
  appointment: Appointment;
  columnIndex: number;
  totalColumns: number;
  top: number;
  usesFullWidth: boolean;
  overlapColIdx: number;
  numOverlapCols: number;
}

function layoutAppointmentsInSlot(appointments: Appointment[]): PositionedAppointment[] {
  if (appointments.length === 0) return [];

  const sorted = [...appointments].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const columns: Appointment[][] = [];

  for (const apt of sorted) {
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const hasOverlap = columns[i].some(
        (existing) =>
          apt.startTime.getTime() < existing.endTime.getTime() &&
          apt.endTime.getTime() > existing.startTime.getTime()
      );
      if (!hasOverlap) {
        columns[i].push(apt);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([apt]);
    }
  }

  const totalColumns = columns.length;
  const adjacentOnlyColumns = new Set<number>();
  columns.forEach((col, colIdx) => {
    const ordered = [...col].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const allAdjacent =
      ordered.length >= 2 &&
      ordered.every((apt, i) => (i === 0 ? true : apt.startTime.getTime() === ordered[i - 1].endTime.getTime()));
    if (allAdjacent) {
      adjacentOnlyColumns.add(colIdx);
    }
  });

  const overlapColumns = columns
    .map((_, i) => i)
    .filter((i) => !adjacentOnlyColumns.has(i));
  const numOverlapCols = overlapColumns.length;

  return sorted.map((apt) => {
    const colIndex = columns.findIndex((col) => col.includes(apt));
    const minutesOffset = apt.startTime.getMinutes() + apt.startTime.getSeconds() / 60;
    const top = minutesOffset * PIXELS_PER_MINUTE;
    const usesFullWidth = adjacentOnlyColumns.has(colIndex);
    const overlapColIdx = overlapColumns.indexOf(colIndex);
    return {
      appointment: apt,
      columnIndex: colIndex,
      totalColumns,
      top,
      usesFullWidth,
      overlapColIdx: usesFullWidth ? -1 : overlapColIdx,
      numOverlapCols,
    };
  });
}

const SLOT_VERTICAL_STEP = SLOT_HEIGHT; // 56px per hour, unified
const ROW_HEIGHT_15 = SLOT_HEIGHT / 4; // 14px per 15-min row
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 23;
const HOUR_SLOTS = DAY_END_HOUR - DAY_START_HOUR + 1; // 6 to 23 (6am to 11pm, scrollable to midnight)
const ROWS_15 = HOUR_SLOTS * 4;

/** Horizontal grid lines: 5-min (opacity 0.3), 15-min (0.6), hourly (1) */
const CalendarGridLines = ({ forWeekColumn }: { forWeekColumn?: boolean } = {}) => {
  const totalMinutes = HOUR_SLOTS * 60;
  const lines = [];
  for (let mins = 0; mins <= totalMinutes; mins += 5) {
    const top = mins * PIXELS_PER_MINUTE;
    const opacity = mins % 60 === 0 ? 0.5 : 0;
    lines.push(
      <View
        key={mins}
        style={[styles.gridLine, forWeekColumn && styles.gridLineWeekColumn, { top, opacity }]}
        pointerEvents="none"
      />
    );
  }
  return (
    <View style={styles.gridLinesContainer} pointerEvents="none">
      {lines}
    </View>
  );
};

/** Exported for week view: single shared time axis on the left */
export const WeekViewTimeAxis = () => (
  <View style={styles.timeAxisColumn} pointerEvents="none">
    {Array.from({ length: ROWS_15 }, (_, i) => {
      const totalMins = DAY_START_HOUR * 60 + i * 15;
      const hour24 = Math.floor(totalMins / 60);
      const hour12 = hour24 % 12 || 12;
      const ampm = hour24 < 12 ? 'am' : 'pm';
      const min = totalMins % 60;
      const isHourMark = min === 0;
      const top = i === 0 ? 0 : i * ROW_HEIGHT_15 - ROW_HEIGHT_15 / 2;
      return (
        <View key={i} style={[styles.timeAxisRow, { top }]}>
          {isHourMark ? (
            <Text style={styles.timeAxisLabel} numberOfLines={1}>{hour12}:00 {ampm}</Text>
          ) : (
            <View style={styles.timeAxisSpacer} />
          )}
          <View style={[styles.timeAxisDotContainer, isHourMark && { opacity: 0 }]}>
            <View style={styles.timeAxisDot} />
          </View>
        </View>
      );
    })}
  </View>
);

export const WEEK_VIEW_CONTENT_HEIGHT = HOUR_SLOTS * SLOT_HEIGHT;

/** Combined time axis: time labels at :00 with am/pm, dots at :15/:30/:45 aligned with 15-min grid lines */
const TimeAxisWithDots = () => (
  <View style={styles.timeAxisColumn} pointerEvents="none">
    {Array.from({ length: ROWS_15 }, (_, i) => {
      const totalMins = DAY_START_HOUR * 60 + i * 15;
      const hour24 = Math.floor(totalMins / 60);
      const hour12 = hour24 % 12 || 12;
      const ampm = hour24 < 12 ? 'am' : 'pm';
      const min = totalMins % 60;
      const isHourMark = min === 0;
      const top = i === 0 ? 0 : i * ROW_HEIGHT_15 - ROW_HEIGHT_15 / 2;
      return (
        <View key={i} style={[styles.timeAxisRow, { top }]}>
          {isHourMark ? (
            <Text style={styles.timeAxisLabel} numberOfLines={1}>{hour12}:00 {ampm}</Text>
          ) : (
            <View style={styles.timeAxisSpacer} />
          )}
          <View style={[styles.timeAxisDotContainer, isHourMark && { opacity: 0 }]}>
            <View style={styles.timeAxisDot} />
          </View>
        </View>
      );
    })}
  </View>
);

const MIN_RESIZE_DURATION_MINUTES = 15;
const MAX_RESIZE_DURATION_MINUTES = 120;

const ResizeHandle = ({
  edge,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  onResizeTerminate,
}: {
  edge: 'top' | 'bottom';
  onResizeStart?: () => void;
  onResizeMove?: (y: number) => void;
  onResizeEnd: (dropY: number) => void;
  onResizeTerminate?: () => void;
}) => {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        haptics.light();
        if (typeof onResizeStart === 'function') onResizeStart();
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (typeof onResizeMove === 'function') {
          onResizeMove(gestureState.moveY);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        onResizeEnd(gestureState.moveY);
      },
      onPanResponderTerminate: () => {
        if (typeof onResizeTerminate === 'function') onResizeTerminate();
      },
    })
  ).current;

  return (
    <View style={styles.resizeHandleTouchArea} {...panResponder.panHandlers}>
      <View style={styles.resizeGrabDot} />
    </View>
  );
};

const SINGLE_TAP_DELAY_MS = 300;
const DRAG_CANCEL_THRESHOLD = 10;

const DraggableAppointmentCard = ({
  appointment,
  onSingleTap,
  onDoubleTap,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  onResizeTerminate,
  isDragging,
}: {
  appointment: Appointment;
  onSingleTap?: () => void;
  onDoubleTap?: () => void;
  onDragStart: (apt: Appointment, fingerX: number, fingerY: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDragCancel?: () => void;
  onResizeStart?: () => void;
  onResizeMove?: (y: number, edge: 'top' | 'bottom') => void;
  onResizeEnd?: (y: number, edge: 'top' | 'bottom') => void;
  onResizeTerminate?: () => void;
  isDragging?: boolean;
}) => {
  const longPressFiredRef = useRef(false);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSingleTap = () => {
    singleTapTimeoutRef.current = setTimeout(() => {
      singleTapTimeoutRef.current = null;
      haptics.light();
      onSingleTap?.();
    }, SINGLE_TAP_DELAY_MS);
  };

  const handleDoubleTap = () => {
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }
    haptics.medium();
    onDoubleTap?.();
  };

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(handleSingleTap);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(handleDoubleTap);

  const tapCombo = Gesture.Simultaneous(singleTap, doubleTap);

  const longPress = Gesture.LongPress()
    .minDuration(2000)
    .onStart((e) => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      longPressFiredRef.current = true;
      haptics.softConfirm();
      onDragStart(appointment, e.absoluteX, e.absoluteY);
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (longPressFiredRef.current) {
        onDragMove(e.absoluteX, e.absoluteY);
      }
    })
    .onEnd((e) => {
      if (longPressFiredRef.current) {
        const moved = Math.abs(e.translationX) > DRAG_CANCEL_THRESHOLD || Math.abs(e.translationY) > DRAG_CANCEL_THRESHOLD;
        if (!moved) {
          onDragCancel?.();
        } else {
          haptics.medium();
          onDragEnd(e.absoluteX, e.absoluteY);
        }
        longPressFiredRef.current = false;
      }
    });

  const tapOrLongPress = Gesture.Exclusive(tapCombo, longPress);
  const composed = Gesture.Simultaneous(tapOrLongPress, pan);

  return (
    <View style={styles.appointmentWithResize}>
      <GestureDetector gesture={composed}>
        <View style={{ opacity: isDragging ? 0.4 : 1 }}>
          <AppointmentCardInner appointment={appointment} />
        </View>
      </GestureDetector>
      {onResizeEnd && (
        <View style={styles.resizeHandleWrap}>
          <ResizeHandle
            edge="bottom"
            onResizeStart={onResizeStart}
            onResizeMove={onResizeMove ? (y) => onResizeMove(y, 'bottom') : undefined}
            onResizeEnd={(y) => onResizeEnd(y, 'bottom')}
            onResizeTerminate={onResizeTerminate}
          />
        </View>
      )}
    </View>
  );
};

const NonDraggableAppointmentCard = ({
  appointment,
  onSingleTap,
  onDoubleTap,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  onResizeTerminate,
}: {
  appointment: Appointment;
  onSingleTap?: () => void;
  onDoubleTap?: () => void;
  onResizeStart?: () => void;
  onResizeMove?: (y: number) => void;
  onResizeEnd?: (y: number) => void;
  onResizeTerminate?: () => void;
}) => {
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSingleTap = () => {
    singleTapTimeoutRef.current = setTimeout(() => {
      singleTapTimeoutRef.current = null;
      haptics.light();
      onSingleTap?.();
    }, SINGLE_TAP_DELAY_MS);
  };

  const handleDoubleTap = () => {
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
    }
    haptics.medium();
    onDoubleTap?.();
  };

  const singleTap = Gesture.Tap().numberOfTaps(1).onEnd(handleSingleTap);
  const doubleTap = Gesture.Tap().numberOfTaps(2).onEnd(handleDoubleTap);
  const tapCombo = Gesture.Simultaneous(singleTap, doubleTap);

  return (
    <View style={styles.appointmentWithResize}>
      <GestureDetector gesture={tapCombo}>
        <View>
          <AppointmentCardInner appointment={appointment} />
        </View>
      </GestureDetector>
      {onResizeEnd && (
        <View style={styles.resizeHandleWrap}>
          <ResizeHandle
            edge="bottom"
            onResizeStart={onResizeStart ?? (() => {})}
            onResizeMove={onResizeMove}
            onResizeEnd={onResizeEnd}
            onResizeTerminate={onResizeTerminate}
          />
        </View>
      )}
    </View>
  );
};

const TimeSlot = ({
  hour,
  selectedDate,
  appointments,
  onAppointmentPress,
  onAppointmentDoubleTap,
  onAppointmentDragStart,
  onAppointmentDragMove,
  onAppointmentDragEnd,
  onAppointmentDragCancel,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  onResizeTerminate,
  onEmptySlotPress,
  draggedAppointmentId,
  showCurrentTime,
  hideLabel,
  currentTimePosition,
  showIndicator,
  currentTime,
}: {
  hour: number;
  selectedDate: Date;
  appointments: Appointment[];
  onAppointmentPress?: (appointment: Appointment) => void;
  onAppointmentDoubleTap?: (appointment: Appointment) => void;
  onAppointmentDragStart?: (apt: Appointment, fingerX: number, fingerY: number) => void;
  onAppointmentDragMove?: (x: number, y: number) => void;
  onAppointmentDragEnd?: (x: number, y: number) => void;
  onAppointmentDragCancel?: () => void;
  onResizeStart?: () => void;
  onResizeMove?: (apt: Appointment, y: number, edge: 'top' | 'bottom') => void;
  onResizeEnd?: (apt: Appointment, dropY: number, edge: 'top' | 'bottom') => void;
  onResizeTerminate?: () => void;
  onEmptySlotPress?: (date: Date, hour: number) => void;
  draggedAppointmentId?: string | null;
  showCurrentTime?: boolean;
  hideLabel?: boolean;
  currentTimePosition?: number;
  showIndicator?: boolean;
  currentTime?: Date;
}) => {
  const timeString = hour === 0 ? '12:00' : hour > 12 ? `${hour - 12}:00` : `${hour}:00`;
  const displayTime = hour < 10 ? `0${timeString}` : timeString;
  const isDraggable = Boolean(onAppointmentDragStart);

  const positionedAppointments = layoutAppointmentsInSlot(appointments);
  const toRender = positionedAppointments.filter((p) => p.appointment.startTime.getHours() === hour);
  const isOverbookedSlot = toRender.length > 0 && positionedAppointments.length > 0 && positionedAppointments[0].totalColumns > 1;

  return (
    <View style={[styles.timeSlot, isOverbookedSlot && styles.timeSlotOverbooked]}>
      {!hideLabel && (
      <View style={styles.timeLabelRow}>
        <TimeLabel time={displayTime} />
      </View>
      )}
      <View style={[styles.timeSlotContent, hideLabel && styles.timeSlotContentNoLabel]}>
        {onEmptySlotPress && (
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
            onPress={() => onEmptySlotPress(selectedDate, hour)}
          />
        )}
        <TimeLine />
        {toRender.map(({ appointment: apt, totalColumns, top, usesFullWidth, overlapColIdx, numOverlapCols }) => {
          const isOverbooked = totalColumns > 1 && !usesFullWidth;
          const hasAdjacentColumns = numOverlapCols < totalColumns;
          const OVERLAP_AREA_PERCENT = hasAdjacentColumns ? 50 : 100;
          const overlapGap = numOverlapCols > 1 ? 4 : 0;
          const overlapWidth = numOverlapCols > 0 ? (OVERLAP_AREA_PERCENT - overlapGap * (numOverlapCols - 1)) / numOverlapCols : 0;
          const leftPercent = usesFullWidth ? 0 : hasAdjacentColumns ? 50 + overlapColIdx * (overlapWidth + overlapGap) : overlapColIdx * (overlapWidth + overlapGap);
          const widthPercent = usesFullWidth ? 100 : overlapWidth;
          return (
            <View
              key={apt.id}
              style={[
                styles.appointmentWrapper,
                isOverbooked && !usesFullWidth && styles.appointmentWrapperOverbooked,
                {
                  top,
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  right: undefined,
                },
              ]}
            >
              {isDraggable ? (
                <DraggableAppointmentCard
                  appointment={apt}
                  onSingleTap={() => onAppointmentPress?.(apt)}
                  onDoubleTap={() => onAppointmentDoubleTap?.(apt)}
                  onDragStart={onAppointmentDragStart!}
                  onDragMove={onAppointmentDragMove!}
                  onDragEnd={onAppointmentDragEnd!}
                  onDragCancel={onAppointmentDragCancel}
                  onResizeStart={onResizeStart ?? (() => {})}
                  onResizeMove={onResizeMove ? (y, edge) => onResizeMove!(apt, y, edge) : undefined}
                  onResizeEnd={onResizeEnd ? (y, edge) => onResizeEnd(apt, y, edge) : undefined}
                  onResizeTerminate={onResizeTerminate}
                  isDragging={draggedAppointmentId === apt.id}
                />
              ) : (
                <NonDraggableAppointmentCard
                  appointment={apt}
                  onSingleTap={() => onAppointmentPress?.(apt)}
                  onDoubleTap={() => onAppointmentDoubleTap?.(apt)}
                  onResizeStart={onResizeStart ?? (() => {})}
                  onResizeMove={onResizeMove ? (y) => onResizeMove(apt, y, 'bottom') : undefined}
                  onResizeEnd={onResizeEnd ? (y) => onResizeEnd(apt, y, 'bottom') : undefined}
                  onResizeTerminate={onResizeTerminate}
                />
              )}
            </View>
          );
        })}
        {showIndicator && showCurrentTime && currentTimePosition !== undefined && currentTime && (
          <View style={[styles.currentTimeWrapper, { top: currentTimePosition }]}>
            <CurrentTimeIndicator time={currentTime} />
          </View>
        )}
      </View>
    </View>
  );
};

function CalendarMiddleSectionInner(
  {
    selectedDate,
    appointments = [],
    allDayAppointments = [],
    onAppointmentPress,
    onAppointmentDoubleTap,
    currentTime = new Date(),
    showCurrentTimeIndicator = true,
    parkZone,
    onParkAppointment,
    onMoveAppointment,
    onResizeAppointment,
    onNotifyClient,
    onDragOverParkZone,
    onCalendarLayoutChange,
    onEmptySlotPress,
    getTargetDateForDrop,
    variant = 'day',
    parentScrollY = 0,
    onHorizontalSwipe,
    onHorizontalSwipeMove,
    onHorizontalSwipeCancel,
  }: CalendarMiddleSectionProps,
  ref: React.Ref<CalendarMiddleSectionRef>
) {
  const scrollViewRef = useRef<ScrollView>(null);
  const isWeekColumn = variant === 'week-column';
  const scrollViewWrapperRef = useRef<View>(null);
  const contentRef = useRef<View>(null);
  const containerRef = useRef<View>(null);
  const calendarTopRef = useRef(0);
  const containerTopRef = useRef(0);
  const containerLeftRef = useRef(0);
  const scrollYRef = useRef(0);
  const scrollViewHeightRef = useRef(0);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [placementLineY, setPlacementLineY] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [calendarTop, setCalendarTop] = useState(0);
  const [dropPreview, setDropPreview] = useState<{ top: number; startTime: Date; endTime: Date } | null>(null);
  const [resizingState, setResizingState] = useState<{ id: string; previewEnd?: Date } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const lastResizePreviewRef = useRef<{ id: string; previewEnd: Date } | null>(null);
  const [confirmModal, setConfirmModal] = useState<
    | { type: 'move'; id: string; newStart: Date; newEnd: Date }
    | { type: 'resize'; id: string; newStart: Date; newEnd: Date; deltaMinutes: number }
    | { type: 'notify_client'; id: string; newStart: Date; newEnd: Date }
    | null
  >(null);
  const hasDragCallbacks = Boolean(onParkAppointment && onMoveAppointment);
  const horizontalSwipeThreshold = SCREEN_WIDTH / 2;

  const stopScrollWhenDragging = useMemo(
    () => () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    },
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      requestScrollWhenDragging(screenY: number) {
        if (isWeekColumn) return;
        const top = calendarTopRef.current;
        const height = scrollViewHeightRef.current;
        if (height <= 0) return;
        const bottom = top + height;
        const maxScrollY = Math.max(0, DAY_CONTENT_HEIGHT - height);

        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
          autoScrollIntervalRef.current = null;
        }

        if (screenY < top + DRAG_EDGE_ZONE) {
          autoScrollIntervalRef.current = setInterval(() => {
            const sy = scrollYRef.current;
            const next = Math.max(0, sy - DRAG_SCROLL_STEP);
            if (next <= 0) stopScrollWhenDragging();
            scrollYRef.current = next;
            scrollViewRef.current?.scrollTo({ y: next, animated: false });
          }, DRAG_SCROLL_INTERVAL_MS);
        } else if (screenY > bottom - DRAG_EDGE_ZONE) {
          autoScrollIntervalRef.current = setInterval(() => {
            const sy = scrollYRef.current;
            const next = Math.min(maxScrollY, sy + DRAG_SCROLL_STEP);
            if (next >= maxScrollY) stopScrollWhenDragging();
            scrollYRef.current = next;
            scrollViewRef.current?.scrollTo({ y: next, animated: false });
          }, DRAG_SCROLL_INTERVAL_MS);
        }
      },
      stopScrollWhenDragging,
    }),
    [isWeekColumn, stopScrollWhenDragging]
  );

  const horizontalSwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .enabled(!isWeekColumn && (!!onHorizontalSwipe || !!onHorizontalSwipeMove) && !isResizing && !draggedAppointment)
        .activeOffsetX([-ms(20), ms(20)])
        .failOffsetY([-ms(12), ms(12)])
        .onUpdate((e) => {
          onHorizontalSwipeMove?.(e.translationX);
        })
        .onEnd((e) => {
          if (e.translationX > horizontalSwipeThreshold) {
            onHorizontalSwipe?.('prev');
          } else if (e.translationX < -horizontalSwipeThreshold) {
            onHorizontalSwipe?.('next');
          } else {
            onHorizontalSwipeCancel?.();
          }
        }),
    [isWeekColumn, onHorizontalSwipe, onHorizontalSwipeMove, onHorizontalSwipeCancel, isResizing, draggedAppointment, horizontalSwipeThreshold]
  );

  const computeEndFromY = (dropY: number, startTime: Date): Date => {
    const top = calendarTopRef.current;
    const sy = scrollYRef.current;
    const parkBottom = parkZone?.bottom ?? 0;
    if (top <= 0 || dropY < Math.max(top - 20, parkBottom)) return startTime;
    const offsetFromTop = dropY - top + sy;
    const slotIndex = Math.max(0, Math.floor(offsetFromTop / SLOT_VERTICAL_STEP));
    const offsetInSlot = offsetFromTop - slotIndex * SLOT_VERTICAL_STEP;
    const minutesInSlot = (offsetInSlot / SLOT_HEIGHT) * 60;
    const hour = Math.min(DAY_END_HOUR, DAY_START_HOUR + slotIndex);
    const newEnd = new Date(selectedDate);
    newEnd.setHours(hour, snapMinutesTo5(minutesInSlot), 0, 0);
    const minEnd = new Date(startTime.getTime() + MIN_RESIZE_DURATION_MINUTES * 60 * 1000);
    const maxEnd = new Date(startTime.getTime() + MAX_RESIZE_DURATION_MINUTES * 60 * 1000);
    if (newEnd.getTime() < minEnd.getTime()) return minEnd;
    if (newEnd.getTime() > maxEnd.getTime()) return maxEnd;
    return newEnd;
  };

  const handleResizeStart = () => {
    measureCalendar();
    setIsResizing(true);
    scrollViewRef.current?.setNativeProps?.({ scrollEnabled: false });
  };

  const handleResizeMove = (apt: Appointment, y: number, edge: 'top' | 'bottom') => {
    if (edge !== 'bottom') return;
    const previewEnd = computeEndFromY(y, apt.startTime);
    lastResizePreviewRef.current = { id: apt.id, previewEnd };
    setResizingState({ id: apt.id, previewEnd });
  };

  const handleResizeTerminate = () => {
    setIsResizing(false);
    scrollViewRef.current?.setNativeProps?.({ scrollEnabled: true });
  };

  const handleResizeEnd = (apt: Appointment, dropY: number, edge: 'top' | 'bottom') => {
    setIsResizing(false);
    scrollViewRef.current?.setNativeProps?.({ scrollEnabled: true });
    const lastPreview = lastResizePreviewRef.current?.id === apt.id ? lastResizePreviewRef.current.previewEnd : null;
    lastResizePreviewRef.current = null;
    setResizingState(null);
    if (!onResizeAppointment || edge !== 'bottom') return;
    let clampedEnd = computeEndFromY(dropY, apt.startTime);
    if (lastPreview && clampedEnd.getTime() <= apt.startTime.getTime()) {
      clampedEnd = lastPreview;
    }
    const minEnd = new Date(apt.startTime.getTime() + MIN_RESIZE_DURATION_MINUTES * 60 * 1000);
    const maxEnd = new Date(apt.startTime.getTime() + MAX_RESIZE_DURATION_MINUTES * 60 * 1000);
    clampedEnd = new Date(Math.max(minEnd.getTime(), Math.min(maxEnd.getTime(), clampedEnd.getTime())));
    const originalDuration = (apt.endTime.getTime() - apt.startTime.getTime()) / (1000 * 60);
    const newDuration = (clampedEnd.getTime() - apt.startTime.getTime()) / (1000 * 60);
    const deltaMinutes = Math.round(newDuration - originalDuration);
    if (deltaMinutes === 0) return;
    haptics.medium();
    setConfirmModal({
      type: 'resize',
      id: apt.id,
      newStart: apt.startTime,
      newEnd: clampedEnd,
      deltaMinutes,
    });
  };

  const appointmentsByHour = useMemo(() => {
    const grouped: { [hour: number]: Appointment[] } = {};
    const hours = Array.from({ length: HOUR_SLOTS }, (_, i) => i + DAY_START_HOUR);
    hours.forEach((hour) => {
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(selectedDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      grouped[hour] = appointments.filter(
        (apt) =>
          apt.startTime.getTime() < slotEnd.getTime() &&
          apt.endTime.getTime() > slotStart.getTime()
      );
    });
    return grouped;
  }, [appointments, selectedDate]);

  const appointmentsByHourWithResize = useMemo(() => {
    if (!resizingState) return appointmentsByHour;
    const mergedAppointments = appointments.map((apt) => {
      if (apt.id !== resizingState.id) return apt;
      if (resizingState.previewEnd) return { ...apt, endTime: resizingState.previewEnd };
      return apt;
    });
    const grouped: { [hour: number]: Appointment[] } = {};
    const hours = Array.from({ length: HOUR_SLOTS }, (_, i) => i + DAY_START_HOUR);
    hours.forEach((hour) => {
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(selectedDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      grouped[hour] = mergedAppointments.filter(
        (apt) =>
          apt.startTime.getTime() < slotEnd.getTime() &&
          apt.endTime.getTime() > slotStart.getTime()
      );
    });
    return grouped;
  }, [appointments, resizingState, selectedDate]);

  const currentTimeInfo = useMemo(() => {
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const position = (minutes / 60) * 56;
    const clampedHour = Math.min(DAY_END_HOUR, Math.max(DAY_START_HOUR, hour));
    const clampedPosition = hour < DAY_START_HOUR ? 0 : hour > DAY_END_HOUR ? 56 : position;
    return { hour: clampedHour, position: clampedPosition };
  }, [currentTime]);

  useEffect(() => {
    if (isWeekColumn) {
      scrollYRef.current = parentScrollY;
      setScrollY(parentScrollY);
    }
  }, [isWeekColumn, parentScrollY]);

  useEffect(() => {
    if (!isWeekColumn && scrollViewRef.current && currentTimeInfo.hour >= DAY_START_HOUR) {
      const scrollPosition = (currentTimeInfo.hour - DAY_START_HOUR) * 56;
      setTimeout(() => scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: true }), 100);
    }
  }, [selectedDate, isWeekColumn]);

  const measureCalendar = () => {
    (scrollViewWrapperRef.current as View)?.measureInWindow((_x: number, y: number) => {
      calendarTopRef.current = y;
      setCalendarTop(y);
      onCalendarLayoutChange?.({ top: y, scrollY: scrollYRef.current });
    });
    containerRef.current?.measureInWindow((x, y) => {
      containerLeftRef.current = x;
      containerTopRef.current = y;
    });
  };

  const handleDragStart = (apt: Appointment, fingerX: number, fingerY: number) => {
    setDraggedAppointment(apt);
    setDragPosition({ x: fingerX, y: fingerY });
    measureCalendar();
    const hour = apt.startTime.getHours();
    const minutes = apt.startTime.getMinutes() + apt.startTime.getSeconds() / 60;
    const slotIndex = Math.max(0, hour - DAY_START_HOUR);
    const topInSlot = minutes * PIXELS_PER_MINUTE;
    const totalTop = slotIndex * SLOT_VERTICAL_STEP + topInSlot;
    setDropPreview({ top: totalTop, startTime: apt.startTime, endTime: apt.endTime });
    containerRef.current?.measureInWindow((containerX, containerY) => {
      containerLeftRef.current = containerX;
      containerTopRef.current = containerY;
      const lineScreenY = calendarTopRef.current - scrollYRef.current + totalTop;
      setPlacementLineY(lineScreenY - containerY);
    });
  };

  const handleDragMove = (x: number, y: number) => {
    setDragPosition({ x, y });
    const inParkZone = parkZone && y >= parkZone.top && y <= parkZone.bottom;
    onDragOverParkZone?.(!!inParkZone);

    if (inParkZone || !draggedAppointment) {
      setDropPreview(null);
      return;
    }
    const parkBottom = parkZone?.bottom ?? 0;
    const top = calendarTopRef.current;
    const sy = scrollYRef.current;
    if (top <= 0 || y < Math.max(top - 20, parkBottom)) {
      setDropPreview(null);
      return;
    }
    const offsetFromTop = y - top + sy;
    const slotIndex = Math.max(0, Math.floor(offsetFromTop / SLOT_VERTICAL_STEP));
    const offsetInSlot = offsetFromTop - slotIndex * SLOT_VERTICAL_STEP;
    const minutesInSlot = (offsetInSlot / SLOT_HEIGHT) * 60;
    const snappedMins = snapMinutesTo5(minutesInSlot);
    const hour = DAY_START_HOUR + slotIndex;
    const duration = (draggedAppointment.endTime.getTime() - draggedAppointment.startTime.getTime()) / (1000 * 60);
    const newStart = new Date(selectedDate);
    newStart.setHours(hour, snappedMins, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);
    const snappedTop = slotIndex * SLOT_VERTICAL_STEP + (snappedMins / 60) * SLOT_HEIGHT;
    setDropPreview({ top: snappedTop, startTime: newStart, endTime: newEnd });
    const lineScreenY = top - sy + snappedTop;
    setPlacementLineY(lineScreenY - containerTopRef.current);
  };

  const handleDragCancel = () => {
    setDraggedAppointment(null);
    setDropPreview(null);
    onDragOverParkZone?.(false);
  };

  const handleDragEnd = (dropX: number, dropY: number) => {
    const apt = draggedAppointment;
    setDraggedAppointment(null);
    setDropPreview(null);
    onDragOverParkZone?.(false);

    if (!apt || !onParkAppointment || !onMoveAppointment) return;

    const inParkZone = parkZone && dropY >= parkZone.top && dropY <= parkZone.bottom;

    if (inParkZone) {
      Alert.alert(
        'Park appointment',
        'Are you sure you want to park this appointment?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes', onPress: () => onParkAppointment(apt.id) },
        ]
      );
      return;
    }
    const parkBottom = parkZone?.bottom ?? 0;
    const top = calendarTopRef.current;
    const sy = scrollYRef.current;
    if (top > 0 && dropY >= Math.max(top - 20, parkBottom)) {
      const offsetFromTop = dropY - top + sy;
      const slotIndex = Math.max(0, Math.floor(offsetFromTop / SLOT_VERTICAL_STEP));
      const offsetInSlot = offsetFromTop - slotIndex * SLOT_VERTICAL_STEP;
      const minutesInSlot = (offsetInSlot / SLOT_HEIGHT) * 60;
      const hour = DAY_START_HOUR + slotIndex;
      const duration = (apt.endTime.getTime() - apt.startTime.getTime()) / (1000 * 60);
      const targetDate = getTargetDateForDrop?.(dropX) || selectedDate;
      const newStart = new Date(targetDate);
      newStart.setHours(hour, snapMinutesTo5(minutesInSlot), 0, 0);
      const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);
      haptics.medium();
      setConfirmModal({ type: 'move', id: apt.id, newStart, newEnd });
    }
  };

  const timeSlots = Array.from({ length: HOUR_SLOTS }, (_, i) => i + DAY_START_HOUR);

  const contentBlock = (
    <View ref={contentRef} onLayout={measureCalendar} style={[styles.contentRow, isWeekColumn && styles.contentRowWeekClip, isWeekColumn && { height: WEEK_VIEW_CONTENT_HEIGHT }]}>
      <CalendarGridLines forWeekColumn={isWeekColumn} />
      {!isWeekColumn && <TimeAxisWithDots />}
      <View style={[styles.slotsColumn, isWeekColumn && styles.slotsColumnWeek, isWeekColumn && styles.slotsColumnClip]}>
        {timeSlots.map((hour) => (
          <TimeSlot
            key={hour}
            hour={hour}
            selectedDate={selectedDate}
            appointments={appointmentsByHourWithResize[hour] || []}
            onAppointmentPress={onAppointmentPress}
            onAppointmentDoubleTap={onAppointmentDoubleTap}
            onAppointmentDragStart={hasDragCallbacks ? handleDragStart : undefined}
            onAppointmentDragMove={hasDragCallbacks ? handleDragMove : undefined}
            onAppointmentDragEnd={hasDragCallbacks ? handleDragEnd : undefined}
            onAppointmentDragCancel={hasDragCallbacks ? handleDragCancel : undefined}
            onResizeStart={onResizeAppointment ? handleResizeStart : () => {}}
            onResizeMove={onResizeAppointment ? handleResizeMove : undefined}
            onResizeEnd={onResizeAppointment ? handleResizeEnd : undefined}
            onResizeTerminate={onResizeAppointment ? handleResizeTerminate : undefined}
            onEmptySlotPress={onEmptySlotPress}
            draggedAppointmentId={draggedAppointment?.id ?? null}
            showCurrentTime={hour === currentTimeInfo.hour}
            currentTimePosition={currentTimeInfo.position}
            showIndicator={showCurrentTimeIndicator}
            currentTime={currentTime}
            hideLabel
          />
        ))}
      </View>
    </View>
  );

  return (
    <View ref={containerRef} style={styles.container}>
      {!isWeekColumn && allDayAppointments.length > 0 && <AllDaySection appointments={allDayAppointments} />}
      <View
        ref={scrollViewWrapperRef}
        style={styles.scrollView}
        onLayout={(e) => {
          scrollViewHeightRef.current = e.nativeEvent.layout.height;
        }}
      >
      {isWeekColumn ? (
        contentBlock
      ) : (
        <GestureDetector gesture={horizontalSwipeGesture}>
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              scrollEnabled={!isResizing}
              showsVerticalScrollIndicator={false}
              onScroll={(e) => {
                const sy = e.nativeEvent.contentOffset.y;
                scrollYRef.current = sy;
                setScrollY(sy);
                onCalendarLayoutChange?.({ top: calendarTopRef.current, scrollY: sy });
              }}
              scrollEventThrottle={16}
            >
              {contentBlock}
            </ScrollView>
          </View>
        </GestureDetector>
      )}
      </View>
      {draggedAppointment && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {dropPreview && (
            <View
              style={[
                styles.dragPlacementLine,
                {
                  top: placementLineY - 1,
                  left: PLACEMENT_LINE_MARGIN,
                  width: SCREEN_WIDTH - PLACEMENT_LINE_MARGIN * 2,
                },
              ]}
            />
          )}
          <View
            style={[
              styles.dragOrb,
              {
                left: dragPosition.x - containerLeftRef.current - ORB_SIZE / 2,
                top: dragPosition.y - containerTopRef.current - ORB_SIZE / 2,
                backgroundColor: appointmentColors[draggedAppointment.color].indicator,
              },
            ]}
          />
          {dropPreview && (
            <View
              style={[
                styles.dragTimeLabel,
                {
                  left: dragPosition.x - containerLeftRef.current + ORB_SIZE / 2 + 8,
                  top: dragPosition.y - containerTopRef.current - 10,
                },
              ]}
            >
              <Text style={styles.dragTimeLabelText}>
                {format(dropPreview.startTime, 'h:mm a')}
              </Text>
            </View>
          )}
        </View>
      )}

      <GlassConfirmModal
        visible={!!confirmModal}
        mode={
          confirmModal?.type === 'move'
            ? 'move'
            : confirmModal?.type === 'resize'
              ? 'resize'
              : 'notify_client'
        }
        primaryText={
          confirmModal?.type === 'move'
            ? format(confirmModal.newStart, 'h:mm a')
            : confirmModal?.type === 'resize'
              ? confirmModal.deltaMinutes > 0
                ? `Additional ${confirmModal.deltaMinutes} minutes added`
                : `${Math.abs(confirmModal.deltaMinutes)} minutes removed`
              : confirmModal?.type === 'notify_client'
                ? 'Notify client?'
                : ''
        }
        secondaryText={
          confirmModal?.type === 'move'
            ? 'Are you sure you want to move this appointment?'
            : confirmModal?.type === 'resize'
              ? `${format(confirmModal.newStart, 'h:mm a')} – ${format(confirmModal.newEnd, 'h:mm a')}`
              : undefined
        }
        onYes={() => {
          if (!confirmModal) return;
          if (confirmModal.type === 'move') {
            onMoveAppointment?.(confirmModal.id, confirmModal.newStart, confirmModal.newEnd);
            setConfirmModal({ type: 'notify_client', id: confirmModal.id, newStart: confirmModal.newStart, newEnd: confirmModal.newEnd });
          } else if (confirmModal.type === 'resize') {
            onResizeAppointment?.(confirmModal.id, confirmModal.newStart, confirmModal.newEnd);
            setConfirmModal({ type: 'notify_client', id: confirmModal.id, newStart: confirmModal.newStart, newEnd: confirmModal.newEnd });
          } else if (confirmModal.type === 'notify_client') {
            onNotifyClient?.(confirmModal.id);
            setConfirmModal(null);
          }
        }}
        onNo={() => {
          haptics.warning();
          setConfirmModal(null);
        }}
      />
    </View>
  );
}

const CalendarMiddleSection = forwardRef(CalendarMiddleSectionInner);
export default CalendarMiddleSection;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', width: '100%' },
  allDayContainer: { backgroundColor: 'rgba(17, 17, 17, 0.07)', height: vs(26), width: '100%', position: 'relative' },
  allDayContent: { flexDirection: 'row', alignItems: 'center', paddingLeft: wp(3), paddingRight: wp(2), gap: ms(8), height: '100%' },
  allDayBorder: { position: 'absolute', top: -0.5, bottom: -0.5, left: 0, right: 0, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#8e8e93', pointerEvents: 'none' as const },
  allDayEvent: { height: vs(19), position: 'relative' },
  allDayEventContent: { flexDirection: 'row', alignItems: 'center', paddingLeft: wp(3), height: '100%' },
  allDayEventText: { fontFamily: 'Lato-Bold', fontSize: ms(8), color: 'white', letterSpacing: 0.4826 },
  scrollView: { flex: 1 },
  timeSlot: { flexDirection: 'row', height: SLOT_HEIGHT, width: '100%', paddingLeft: 0, position: 'relative', overflow: 'visible' as const },
  timeSlotOverbooked: { backgroundColor: 'transparent' },
  timeLabelRow: { flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'stretch', width: ms(36), gap: ms(4), paddingTop: 0 },
  timeLabel: { alignItems: 'flex-start' },
  timeLabelText: { fontFamily: 'Lato-SemiBold', fontSize: ms(11), lineHeight: ms(13), color: '#FFFFFF', letterSpacing: 0.06 },
  timeSlotContent: { flex: 1, marginLeft: -ms(6), position: 'relative', overflow: 'visible' as const },
  timeSlotContentNoLabel: { marginLeft: -ms(6) },
  timeLine: { flex: 1, height: 7, minHeight: 1, minWidth: 1 },
  appointmentWrapper: { position: 'absolute' as const, overflow: 'visible' as const, zIndex: 1 },
  appointmentWithResize: { position: 'relative' as const, width: '100%' },
  resizeHandleWrap: {
    position: 'absolute' as const,
    bottom: -6,
    left: 0,
    right: 0,
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  resizeHandleTouchArea: {
    width: 36,
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  resizeGrabDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    marginBottom: 6,
  },
  appointmentWrapperOverbooked: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    borderRadius: 2,
  },
  appointmentCard: { flexDirection: 'row', gap: ms(6), paddingLeft: ms(4), paddingRight: ms(8), paddingVertical: ms(4), borderRadius: ms(4), overflow: 'hidden', position: 'relative', width: '100%' },
  appointmentBackground: { borderRadius: ms(4) },
  appointmentIndicator: { width: ms(5), height: ms(5), borderRadius: ms(2.5), alignSelf: 'center' },
  appointmentContent: { flex: 1, gap: ms(8) },
  appointmentDetails: { flex: 1, gap: ms(5) },
  appointmentClientName: { fontFamily: 'Lato-SemiBold', fontSize: ms(13), lineHeight: ms(13), textTransform: 'capitalize' as const },
  appointmentService: { fontFamily: 'Lato-SemiBold', fontSize: ms(13), lineHeight: ms(13) },
  appointmentTimeContainer: { flexDirection: 'row', alignItems: 'center', gap: ms(2), marginBottom: hp(1.2) },
  appointmentTime: { fontFamily: 'Lato-Medium', fontSize: ms(8), lineHeight: ms(8), textTransform: 'uppercase' as const },
  appointmentProcessTime: { fontFamily: 'Lato-Medium', fontSize: ms(8), lineHeight: ms(8), opacity: 0.9 },
  alarmIcon: { width: ms(12), height: ms(12), overflow: 'hidden', position: 'relative' },
  alarmIconInner: { position: 'absolute', left: '10.27%', right: '10.26%', top: '9.24%', bottom: '8.33%' },
  currentTimeWrapper: { position: 'absolute' as const, left: -(ms(28) + wp(3) + 12), right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', overflow: 'visible' as const },
  currentTimeIndicator: { flexDirection: 'row', alignItems: 'center', height: 24, flex: 1, minWidth: 0 },
  currentTimeBadge: {
    backgroundColor: '#151719',
    borderRadius: 999,
    paddingHorizontal: ms(8),
    // paddingVertical: 4,
    height: 24,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 24, 236, 0.9)',
    overflow: 'hidden',
    shadowColor: '#FF18EC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  currentTimeBadgeText: { fontFamily: 'Lato-SemiBold', fontSize: ms(12), lineHeight: ms(14), color: '#FFFFFF', fontWeight: '700' as const },
  currentTimeLine: { flex: 1, height: 2, minWidth: 200, marginLeft: ms(0), backgroundColor: '#FF18EC' },
  contentRow: { flexDirection: 'row', alignItems: 'flex-start', position: 'relative' as const, overflow: 'visible' as const },
  contentRowWeekClip: { overflow: 'hidden' as const },
  slotsColumn: { flex: 1, paddingLeft: -ms(4), overflow: 'visible' as const },
  slotsColumnWeek: { paddingLeft: ms(0) },
  slotsColumnClip: { overflow: 'hidden' as const },
  gridLinesContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: HOUR_SLOTS * SLOT_HEIGHT,
    zIndex: 0,
    pointerEvents: 'none' as const,
  },
  gridLine: {
    position: 'absolute' as const,
    left: ms(40),
    right: 0,
    height: 1,
    backgroundColor: '#C7C7CC',
  },
  gridLineWeekColumn: { left: 0 },
  timeAxisColumn: {
    width: ms(56),
    height: ROWS_15 * ROW_HEIGHT_15,
    position: 'relative' as const,
  },
  timeAxisRow: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT_15,
  },
  timeAxisLabel: {
    fontFamily: 'Lato-SemiBold',
    fontSize: ms(10),
    lineHeight: ms(12),
    color: '#FFFFFF',
    letterSpacing: 0.04,
    minWidth: ms(46),
  },
  timeAxisSpacer: { width: ms(36), height: 1 },
  timeAxisDotContainer: { width: 10, alignItems: 'center', justifyContent: 'center', marginLeft: -ms(4) },
  timeAxisDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  fifteenMinDotsColumn: {
    position: 'absolute',
    left: 35,
    width: 4,
    height: HOUR_SLOTS * SLOT_HEIGHT,
    zIndex: 0,
  },
  fifteenMinDot: {
    position: 'absolute',
    left: 0,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  dragPlacementLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#FFFFFF',
    zIndex: 9998,
  },
  dragOrb: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    zIndex: 10000,
  },
  dragTimeLabel: {
    position: 'absolute',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    zIndex: 10001,
  },
  dragTimeLabelText: {
    fontFamily: 'Lato-SemiBold',
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
