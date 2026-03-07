import React, { useMemo, useRef, useCallback, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ms } from '../utils/responsive';
import { format, addDays, isSameDay, isToday } from 'date-fns';
import type { Appointment } from './CalendarMiddleSection';
import CalendarMiddleSection, { WeekViewTimeAxis, WEEK_VIEW_CONTENT_HEIGHT } from './CalendarMiddleSection';
import type { ParkZoneBounds, CalendarLayout } from './AllDaySection';

const TIME_AXIS_WIDTH = ms(40);
/** No duplicate date row in week view — single date row is in CalendarHeaderDynamic */
const WEEK_VIEW_HEADER_HEIGHT = 0;
const SLOT_HEIGHT = 56;
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 23;

interface CalendarWeekViewProps {
  selectedDate: Date;
  appointmentsByDay: Record<string, Appointment[]>;
  allDayByDay: Record<string, { id: string; clientName: string; color: 'orange' | 'orange2' }[]>;
  currentTime: Date;
  showCurrentTimeIndicator: boolean;
  parkZone: ParkZoneBounds | null;
  onDateSelect?: (date: Date) => void;
  onAppointmentPress?: (appointment: Appointment) => void;
  onAppointmentDoubleTap?: (appointment: Appointment) => void;
  onParkAppointment?: (id: string) => void;
  onMoveAppointment?: (id: string, newStart: Date, newEnd: Date) => void;
  onResizeAppointment?: (id: string, newStart: Date, newEnd: Date) => void;
  onNotifyClient?: (id: string) => void;
  onDragOverParkZone?: (isOver: boolean) => void;
  onEmptySlotPress?: (date: Date, hour: number) => void;
  /** Date strings (yyyy-MM-dd) for days that have someone on waitlist; show orange/green indicator */
  waitlistDays?: string[];
  /** Called when user taps the waitlist indicator; show "Choose a day to drop an appointment by clicking on it" */
  onWaitlistPress?: () => void;
  /** 5-day view: horizontal swipe – content follows finger; half screen width to commit */
  onHorizontalSwipeMove?: (translationX: number) => void;
  onHorizontalSwipeCancel?: () => void;
  onHorizontalSwipe?: (direction: 'prev' | 'next') => void;
  /** Report week grid layout for unpark drop target (top + scrollY) */
  onWeekCalendarLayoutChange?: (layout: CalendarLayout) => void;
}

export interface CalendarWeekViewRef {
  requestScrollWhenDragging: (screenY: number) => void;
  stopScrollWhenDragging: () => void;
}

const DRAG_EDGE_ZONE = 56;
const DRAG_SCROLL_STEP = 28;
const DRAG_SCROLL_INTERVAL_MS = 50;

/** Show 5 days at a glance; column width = (screen - time axis - padding) / 5 */
const DAYS_VISIBLE_AT_GLANCE = 5;
const HORIZONTAL_PADDING = ms(16);

function CalendarWeekViewInner(
  {
    selectedDate,
    appointmentsByDay,
    allDayByDay,
    currentTime,
    showCurrentTimeIndicator,
    parkZone,
    onDateSelect,
    onAppointmentPress,
    onAppointmentDoubleTap,
    onParkAppointment,
    onMoveAppointment,
    onResizeAppointment,
    onNotifyClient,
    onDragOverParkZone,
    onEmptySlotPress,
    waitlistDays = [],
    onWaitlistPress,
    onHorizontalSwipeMove,
    onHorizontalSwipeCancel,
    onHorizontalSwipe,
    onWeekCalendarLayoutChange,
  }: CalendarWeekViewProps,
  ref: React.Ref<CalendarWeekViewRef>
) {
  const { width: screenWidth } = useWindowDimensions();
  const swipeThreshold = screenWidth / 2;
  const weekGridRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollViewHeightRef = useRef(0);
  const scrollYRef = useRef(0);
  const weekGridTopRef = useRef(0);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [weekGridTop, setWeekGridTop] = useState(0);

  const reportWeekLayout = useCallback(
    (top: number, scrollYVal: number) => {
      onWeekCalendarLayoutChange?.({ top, scrollY: scrollYVal });
    },
    [onWeekCalendarLayoutChange]
  );

  const measureWeekGrid = useCallback(() => {
    weekGridRef.current?.measureInWindow((_x, y) => {
      weekGridTopRef.current = y;
      setWeekGridTop(y);
    });
  }, []);

  const horizontalSwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .enabled(!!(onHorizontalSwipeMove || onHorizontalSwipe))
        .activeOffsetX([-ms(20), ms(20)])
        .failOffsetY([-ms(12), ms(12)])
        .onUpdate((e) => {
          onHorizontalSwipeMove?.(e.translationX);
        })
        .onEnd((e) => {
          if (e.translationX > swipeThreshold) {
            onHorizontalSwipe?.('prev');
          } else if (e.translationX < -swipeThreshold) {
            onHorizontalSwipe?.('next');
          } else {
            onHorizontalSwipeCancel?.();
          }
        }),
    [onHorizontalSwipeMove, onHorizontalSwipe, onHorizontalSwipeCancel, swipeThreshold]
  );
  const columnRefs = useRef<(View | null)[]>([]);
  const columnBoundsRef = useRef<{ left: number; width: number; date: Date }[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const weekDays = useMemo(() => Array.from({ length: DAYS_VISIBLE_AT_GLANCE }, (_, i) => addDays(selectedDate, i)), [selectedDate]);

  const columnWidth = useMemo(() => {
    const available = screenWidth - TIME_AXIS_WIDTH - HORIZONTAL_PADDING;
    return available / DAYS_VISIBLE_AT_GLANCE;
  }, [screenWidth]);

  const updateColumnBounds = useCallback(() => {
    columnRefs.current.forEach((col, i) => {
      col?.measureInWindow((x, _y, width) => {
        columnBoundsRef.current[i] = { left: x, width, date: weekDays[i] };
      });
    });
  }, [weekDays]);

  const getTargetDateForDrop = useCallback(
    (screenX: number): Date | null => {
      const bounds = columnBoundsRef.current;
      for (let i = 0; i < bounds.length; i++) {
        const b = bounds[i];
        if (b && screenX >= b.left && screenX < b.left + b.width) {
          return b.date;
        }
      }
      return bounds[0]?.date ?? null;
    },
    []
  );

  const handleDateSelect = (date: Date) => {
    onDateSelect?.(date);
  };

  useEffect(() => {
    const t = setTimeout(updateColumnBounds, 100);
    return () => clearTimeout(t);
  }, [updateColumnBounds, weekDays]);

  useEffect(() => {
    if (onWeekCalendarLayoutChange) reportWeekLayout(weekGridTop, scrollY);
  }, [weekGridTop, scrollY, onWeekCalendarLayoutChange, reportWeekLayout]);

  const totalRowHeight = WEEK_VIEW_HEADER_HEIGHT + WEEK_VIEW_CONTENT_HEIGHT;

  const stopScrollWhenDragging = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      requestScrollWhenDragging(screenY: number) {
        const top = weekGridTopRef.current;
        const height = scrollViewHeightRef.current;
        if (height <= 0) return;
        const bottom = top + height;
        const maxScrollY = Math.max(0, totalRowHeight - height);

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
    [totalRowHeight, stopScrollWhenDragging]
  );

  const fullScreenTimePosition = useMemo(() => {
    if (!showCurrentTimeIndicator) return null;
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const clampedHour = Math.min(DAY_END_HOUR, Math.max(DAY_START_HOUR, hour));
    const positionInSlot = hour < DAY_START_HOUR ? 0 : hour > DAY_END_HOUR ? SLOT_HEIGHT : (minutes / 60) * SLOT_HEIGHT;
    const slotIndex = clampedHour - DAY_START_HOUR;
    const top = WEEK_VIEW_HEADER_HEIGHT + slotIndex * SLOT_HEIGHT + positionInSlot;
    return top;
  }, [showCurrentTimeIndicator, currentTime]);

  return (
    <GestureDetector gesture={horizontalSwipeGesture}>
      <View
        ref={weekGridRef}
        onLayout={(e) => {
          measureWeekGrid();
          scrollViewHeightRef.current = e.nativeEvent.layout.height;
        }}
        collapsable={false}
        style={styles.weekGridWrapper}
      >
      <ScrollView
        ref={scrollViewRef}
        style={styles.verticalScroll}
        contentContainerStyle={{ minHeight: totalRowHeight }}
        showsVerticalScrollIndicator={true}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          scrollYRef.current = y;
          setScrollY(y);
          updateColumnBounds();
        }}
        scrollEventThrottle={16}
      >
        <View style={[styles.weekRow, { height: totalRowHeight }]}>
        {fullScreenTimePosition != null && (
          <View
            style={[
              styles.fullScreenTimeIndicator,
              { top: fullScreenTimePosition - 12 },
            ]}
            pointerEvents="none"
          >
            <View style={styles.fullScreenTimeBadge}>
              <Text style={styles.fullScreenTimeBadgeText}>{format(currentTime, 'h:mm a')}</Text>
            </View>
            <View style={styles.fullScreenTimeLine} />
          </View>
        )}
        {/* Left: single time axis (y-axis) — scrolls with content */}
        <View style={[styles.timeAxisSticky, { width: TIME_AXIS_WIDTH, height: totalRowHeight }]}>
          <View style={styles.timeAxisSpacer} />
          <View style={[styles.timeAxisContent, { height: WEEK_VIEW_CONTENT_HEIGHT }]}>
            <WeekViewTimeAxis />
          </View>
        </View>
        {/* Right: fixed 5 day columns (no horizontal scroll) */}
        <View
          style={styles.dayColumnsRow}
          onLayout={() => updateColumnBounds()}
        >
          {weekDays.map((date, index) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayApps = appointmentsByDay[dateStr] || [];
            const dayAllDay = allDayByDay[dateStr] || [];
            const isSelected = isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);

            return (
              <View
                key={dateStr}
                ref={(r) => { columnRefs.current[index] = r; }}
                style={[styles.dayColumn, isSelected && styles.dayColumnSelected, { width: columnWidth, minWidth: columnWidth }]}
                onLayout={() => updateColumnBounds()}
              >
                {WEEK_VIEW_HEADER_HEIGHT > 0 && (
                  <Pressable style={styles.dayHeader} onPress={() => handleDateSelect(date)}>
                    <View style={styles.dayHeaderTop}>
                      <Text style={[styles.dayLabel, isTodayDate && styles.dayLabelToday]}>{format(date, 'EEE')}</Text>
                      {waitlistDays.includes(dateStr) && onWaitlistPress && (
                        <TouchableOpacity
                          hitSlop={8}
                          style={styles.waitlistIndicator}
                          onPress={(e) => {
                            e.stopPropagation();
                            onWaitlistPress();
                          }}
                        />
                      )}
                    </View>
                    <Text style={[styles.dateNum, isSelected && styles.dateNumSelected, isTodayDate && !isSelected && styles.dateNumToday]}>
                      {format(date, 'd')}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.dayContent, styles.dayContentClip, { height: WEEK_VIEW_CONTENT_HEIGHT }]}
                  onPress={() => handleDateSelect(date)}
                >
                  <CalendarMiddleSection
                    variant="week-column"
                    parentScrollY={scrollY}
                    selectedDate={date}
                    appointments={dayApps}
                    allDayAppointments={dayAllDay}
                    currentTime={currentTime}
                    showCurrentTimeIndicator={false}
                    onAppointmentPress={onAppointmentPress}
                    onAppointmentDoubleTap={onAppointmentDoubleTap}
                    onNotifyClient={onNotifyClient}
                    onEmptySlotPress={onEmptySlotPress}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
      </View>
    </GestureDetector>
  );
}

const CalendarWeekView = forwardRef(CalendarWeekViewInner);
export default CalendarWeekView;

const styles = StyleSheet.create({
  weekGridWrapper: { flex: 1 },
  verticalScroll: { flex: 1 },
  weekRow: { flexDirection: 'row', position: 'relative' as const },
  fullScreenTimeIndicator: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
  },
  fullScreenTimeBadge: {
    width: TIME_AXIS_WIDTH,
    height: 20,
    backgroundColor: '#151719',
    borderRadius: 999,
    marginLeft: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 24, 236, 0.9)',
    overflow: 'hidden',
  },
  fullScreenTimeBadgeText: { fontFamily: 'Lato-SemiBold', fontSize: ms(10), color: '#FFFFFF', fontWeight: '700' as const },
  fullScreenTimeLine: { flex: 1, height: 2, backgroundColor: '#FF18EC', minWidth: 0 },
  timeAxisSticky: { backgroundColor: '#000' },
  timeAxisSpacer: { height: WEEK_VIEW_HEADER_HEIGHT },
  timeAxisContent: { overflow: 'hidden' },
  dayColumnsRow: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: HORIZONTAL_PADDING,
  },
  dayColumn: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(142, 142, 147, 0.2)',
  },
  dayColumnSelected: { backgroundColor: 'rgba(37, 175, 255, 0.06)' },
  dayHeader: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#111', alignItems: 'center', height: WEEK_VIEW_HEADER_HEIGHT },
  dayHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dayLabel: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },
  waitlistIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9DE684' },
  dayLabelToday: { color: '#25afff' },
  dateNum: { fontSize: 18, color: 'white', fontWeight: '600', marginTop: 2 },
  dateNumSelected: { color: '#25afff' },
  dateNumToday: { fontWeight: '700' },
  dayContent: {},
  dayContentClip: { overflow: 'hidden' as const },
});
