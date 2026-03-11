import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Modal, Text, Pressable, ScrollView, Animated, Easing, useWindowDimensions, Alert } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { isSameDay, format, addDays, subDays, addWeeks } from 'date-fns';
import CalendarHeaderDynamic, { type ViewMode } from '../components/CalendarHeaderDynamic';
import { RightDecoration } from '../components/RightDecoration';
import { LeftDecoration } from '../components/LeftDecoration';
import { AllDaySection, type ParkZoneBounds, type CalendarLayout, type UnparkDragGhost } from '../components/AllDaySection';
import CalendarMiddleSection, { type Appointment, type AllDayAppointment, type CalendarMiddleSectionRef } from '../components/CalendarMiddleSection';
import CalendarWeekView, { type CalendarWeekViewRef } from '../components/CalendarWeekView';
import CalendarMonthView from '../components/CalendarMonthView';
import { EmptySlotActionModal } from '../components/EmptySlotActionModal';
import { AppointmentOptionsModal } from '../components/AppointmentOptionsModal';
import { GlassConfirmModal } from '../components/GlassConfirmModal';
import { useEvents } from '../context/EventsContext';
import type { CalendarEvent } from '../data/events';
import { wouldCauseThirdOverlap } from '../utils/overbookCheck';
import { ms, vs } from '../utils/responsive';
import { haptics } from '../utils/haptics';

function hexToColorCategory(hex?: string): 'pink' | 'blue' | 'green' | 'gray' {
  if (!hex) return 'gray';
  const h = hex.toLowerCase();
  if (h.includes('fa1bfe') || h.includes('ff18ec')) return 'pink';
  if (h.includes('25afff')) return 'blue';
  if (h.includes('9de684')) return 'green';
  return 'gray';
}

interface PlannedOccurrence {
  start: Date;
  end: Date;
}

interface ConflictResolutionState {
  appointmentId: string;
  occurrences: PlannedOccurrence[];
  currentIndex: number;
  options: Date[];
}

const FIVE_DAY_COUNT = 5;
const MAX_RESCHEDULE_WEEKS = 10;
const MAX_REPEAT_APPOINTMENTS = 10;
const BOOK_BUTTON_COLOR = '#FA1BFE';

export function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { events, setEvents } = useEvents();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [liveTime, setLiveTime] = useState(() => dayjs());
  const [parkZone, setParkZone] = useState<ParkZoneBounds | null>(null);
  const [calendarLayout, setCalendarLayout] = useState<CalendarLayout | null>(null);
  const [weekCalendarLayout, setWeekCalendarLayout] = useState<CalendarLayout | null>(null);
  const [isOverParkZone, setIsOverParkZone] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [emptySlotModal, setEmptySlotModal] = useState<{ date: Date; hour: number } | null>(null);
  const [appointmentOptionsModal, setAppointmentOptionsModal] = useState<Appointment | null>(null);
  const [parkConfirmAppointment, setParkConfirmAppointment] = useState<Appointment | null>(null);
  const [modifyConfirmAppointment, setModifyConfirmAppointment] = useState<Appointment | null>(null);
  const [cancelConfirmAppointment, setCancelConfirmAppointment] = useState<Appointment | null>(null);
  const [waitlistModalVisible, setWaitlistModalVisible] = useState(false);
  const [rescheduleModalAppointment, setRescheduleModalAppointment] = useState<Appointment | null>(null);
  const [selectedRescheduleWeeks, setSelectedRescheduleWeeks] = useState(1);
  const [repeatAppointments, setRepeatAppointments] = useState(1);
  const [conflictResolution, setConflictResolution] = useState<ConflictResolutionState | null>(null);
  const [unparkDragGhost, setUnparkDragGhost] = useState<UnparkDragGhost | null>(null);

  const swipeSlideAnim = useRef(new Animated.Value(0)).current;
  const weekSlideAnim = useRef(new Animated.Value(0)).current;
  const dayCalendarRef = useRef<CalendarMiddleSectionRef>(null);
  const weekCalendarRef = useRef<CalendarWeekViewRef>(null);
  const SWIPE_SLIDE_OFFSET = ms(56);
  const SWIPE_ANIM_DURATION = 220;

  const isToday = dayjs(currentDate).isSame(dayjs(), 'day');

  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => setLiveTime(dayjs()), 30000);
    return () => clearInterval(interval);
  }, [isToday]);

  const appointments = useMemo((): Appointment[] => {
    return events
      .filter((e) => isSameDay(e.start, currentDate) && !e.allDay && !e.isParked && e.waitlistAddedAt == null)
      .map((e) => ({
        id: e.id,
        clientName: e.title,
        service: e.clientName || e.service || '',
        startTime: e.start,
        endTime: e.end,
        color: hexToColorCategory(e.color),
        hasAlarm: true,
        processingTimeStart: e.processingTimeStart,
        processingTimeEnd: e.processingTimeEnd,
      }));
  }, [events, currentDate]);

  /** Global toolbar: all parked appointments (same in Day + Week; hidden in Month) */
  const parkedEvents = useMemo(
    () =>
      events
        .filter((e) => e.isParked === true)
        .map((e) => ({
          id: e.id,
          title: e.title,
          color: e.color,
          isParked: true,
          waitlistAddedAt: e.waitlistAddedAt,
          service: e.service || e.clientName || undefined,
          start: e.start,
          end: e.end,
        })),
    [events]
  );

  /** Day view toolbar: global parked + this day's all-day (non-parked) + this day's waitlist */
  const allDayEvents = useMemo(
    () =>
      events
        .filter((e) => isSameDay(e.start, currentDate) && (e.allDay === true || e.isParked === true || e.waitlistAddedAt != null))
        .map((e) => ({
          id: e.id,
          title: e.title,
          color: e.color,
          isParked: e.isParked,
          waitlistAddedAt: e.waitlistAddedAt,
          service: e.service || e.clientName || undefined,
        })),
    [events, currentDate]
  );

  /** Fixed toolbar for day view: all parked + all waitlist (any date); user can park/unpark from/to any date */
  const dayToolbarEvents = useMemo(() => {
    const waitlist = events
      .filter((e) => !e.isParked && (e.allDay === true || e.waitlistAddedAt != null))
      .sort((a, b) => {
        const ta = a.waitlistAddedAt == null ? 0 : typeof a.waitlistAddedAt === 'number' ? a.waitlistAddedAt : a.waitlistAddedAt.getTime();
        const tb = b.waitlistAddedAt == null ? 0 : typeof b.waitlistAddedAt === 'number' ? b.waitlistAddedAt : b.waitlistAddedAt.getTime();
        return ta - tb;
      })
      .map((e) => ({
        id: e.id,
        title: e.title,
        color: e.color,
        isParked: false,
        waitlistAddedAt: e.waitlistAddedAt,
        service: e.service || e.clientName || undefined,
        start: e.start,
        end: e.end,
      }));
    return [...parkedEvents, ...waitlist];
  }, [events, parkedEvents]);

  const currentTime = isToday ? liveTime.toDate() : dayjs(currentDate).toDate();

  const weekDates = useMemo(() => Array.from({ length: FIVE_DAY_COUNT }, (_, i) => addDays(currentDate, i)), [currentDate]);
  const weekContainsToday = useMemo(() => weekDates.some((d) => isSameDay(d, new Date())), [weekDates]);

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    weekDates.forEach((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      map[dateStr] = events
        .filter((e) => isSameDay(e.start, date) && !e.allDay && !e.isParked && e.waitlistAddedAt == null)
        .map((e) => ({
          id: e.id,
          clientName: e.title,
          service: e.clientName || e.service || '',
          startTime: e.start,
          endTime: e.end,
          color: hexToColorCategory(e.color),
          hasAlarm: true,
          processingTimeStart: e.processingTimeStart,
          processingTimeEnd: e.processingTimeEnd,
        }));
    });
    return map;
  }, [events, weekDates]);

  /** Week grid columns: per-day all-day + waitlist only (parked show in global toolbar above) */
  const allDayByDay = useMemo(() => {
    const map: Record<string, AllDayAppointment[]> = {};
    weekDates.forEach((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      map[dateStr] = events
        .filter((e) => isSameDay(e.start, date) && !e.isParked && (e.allDay === true || e.waitlistAddedAt != null))
        .map((e) => ({ id: e.id, clientName: e.title, color: 'orange' as const }));
    });
    return map;
  }, [events, weekDates]);

  const selectedDayEvents = useMemo(
    () => events.filter((e) => isSameDay(e.start, currentDate)),
    [events, currentDate]
  );

  const weekOptions = useMemo(() => Array.from({ length: MAX_RESCHEDULE_WEEKS }, (_, i) => i + 1), []);
  const repeatOptions = useMemo(() => Array.from({ length: MAX_REPEAT_APPOINTMENTS }, (_, i) => i + 1), []);

  const hasTimedConflict = (
    start: Date,
    end: Date,
    ignoreId: string,
    planned: PlannedOccurrence[] = [],
    plannedIgnoreIndex = -1
  ) => {
    const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && aEnd > bStart;
    const conflictWithEvents = events.some((e) => {
      if (e.id === ignoreId || e.allDay) return false;
      return overlaps(start, end, e.start, e.end);
    });
    if (conflictWithEvents) return true;
    return planned.some((p, idx) => {
      if (idx === plannedIgnoreIndex) return false;
      return overlaps(start, end, p.start, p.end);
    });
  };

  const getCandidateTimes = (targetDate: Date, durationMs: number, ignoreId: string, planned: PlannedOccurrence[], index: number) => {
    const dayStart = new Date(targetDate);
    dayStart.setHours(6, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);
    const options: Date[] = [];
    const cursor = new Date(dayStart);
    while (cursor <= dayEnd && options.length < 6) {
      const end = new Date(cursor.getTime() + durationMs);
      if (end <= dayEnd && !hasTimedConflict(cursor, end, ignoreId, planned, index)) {
        options.push(new Date(cursor));
      }
      cursor.setMinutes(cursor.getMinutes() + 15);
    }
    return options;
  };

  const applyResolvedOccurrences = (appointmentId: string, occurrences: PlannedOccurrence[]) => {
    setEvents((prev) => {
      const source = prev.find((e) => e.id === appointmentId);
      if (!source || occurrences.length === 0) return prev;

      const updated = prev.map((e) =>
        e.id === appointmentId
          ? {
              ...e,
              start: occurrences[0].start,
              end: occurrences[0].end,
              allDay: false,
              isParked: false,
              waitlistAddedAt: undefined,
            }
          : e
      );

      const baseTs = Date.now();
      const repeats = occurrences.slice(1).map((occ, idx) => ({
        ...source,
        id: `ev-${baseTs}-${idx}`,
        start: occ.start,
        end: occ.end,
        allDay: false,
        isParked: false,
        waitlistAddedAt: undefined,
      }));

      return [...updated, ...repeats];
    });
  };

  const proceedConflictResolution = (state: ConflictResolutionState) => {
    const durationMs = Math.max(0, state.occurrences[0].end.getTime() - state.occurrences[0].start.getTime());
    for (let i = state.currentIndex; i < state.occurrences.length; i++) {
      const occ = state.occurrences[i];
      const conflict = hasTimedConflict(occ.start, occ.end, state.appointmentId, state.occurrences, i);
      if (conflict) {
        const options = getCandidateTimes(occ.start, durationMs, state.appointmentId, state.occurrences, i);
        setConflictResolution({ ...state, currentIndex: i, options });
        return;
      }
    }
    setConflictResolution(null);
    applyResolvedOccurrences(state.appointmentId, state.occurrences);
  };

  const handleParkAppointment = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              allDay: true,
              isParked: true,
              /* keep start/end so unpark to another day preserves service duration */
            }
          : e
      )
    );
  };

  const handleMoveAppointment = (id: string, newStart: Date, newEnd: Date) => {
    setEvents((prev) => {
      if (wouldCauseThirdOverlap(prev, newStart, newEnd, id)) {
        setTimeout(
          () =>
            Alert.alert(
              'Cannot overbook',
              'This slot cannot be overbooked again. Maximum two appointments can overlap.'
            ),
          0
        );
        return prev;
      }
      const moved = prev.find((e) => e.id === id);
      if (!moved) return prev;
      const seriesId = moved.seriesId;
      const deltaMs = newStart.getTime() - moved.start.getTime();
      if (seriesId) {
        return prev.map((e) => {
          if (e.id === id) {
            return { ...e, start: newStart, end: newEnd, allDay: false, isParked: false, waitlistAddedAt: undefined };
          }
          if (e.seriesId === seriesId) {
            const start = new Date(e.start.getTime() + deltaMs);
            const end = new Date(e.end.getTime() + deltaMs);
            return { ...e, start, end, allDay: false, isParked: false, waitlistAddedAt: undefined };
          }
          return e;
        });
      }
      return prev.map((e) =>
        e.id === id
          ? { ...e, start: newStart, end: newEnd, allDay: false, isParked: false, waitlistAddedAt: undefined }
          : e
      );
    });
  };

  const handleResizeAppointment = (id: string, newStart: Date, newEnd: Date) => {
    setEvents((prev) => {
      if (wouldCauseThirdOverlap(prev, newStart, newEnd, id)) {
        setTimeout(
          () =>
            Alert.alert(
              'Cannot overbook',
              'This slot cannot be overbooked again. Maximum two appointments can overlap.'
            ),
          0
        );
        return prev;
      }
      return prev.map((e) => (e.id === id ? { ...e, start: newStart, end: newEnd } : e));
    });
  };

  const handleNotifyClient = (id: string) => {
    // TODO: Send notification to client about appointment time change
  };

  const openRescheduleModal = (appointment: Appointment) => {
    setSelectedRescheduleWeeks(1);
    setRepeatAppointments(1);
    setRescheduleModalAppointment(appointment);
  };

  const handleBookReschedule = () => {
    if (!rescheduleModalAppointment) return;

    const durationMs = Math.max(0, rescheduleModalAppointment.endTime.getTime() - rescheduleModalAppointment.startTime.getTime());
    const occurrences: PlannedOccurrence[] = Array.from({ length: repeatAppointments }, (_, idx) => {
      const start = addWeeks(rescheduleModalAppointment.startTime, selectedRescheduleWeeks * (idx + 1));
      const end = new Date(start.getTime() + durationMs);
      return { start, end };
    });

    setRescheduleModalAppointment(null);
    proceedConflictResolution({
      appointmentId: rescheduleModalAppointment.id,
      occurrences,
      currentIndex: 0,
      options: [],
    });
  };

  const handleEmptySlotPress = (date: Date, hour: number) => {
    setEmptySlotModal({ date, hour });
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    router.push({ pathname: '/client/[id]', params: { id: `appointment-${appointment.id}` } });
  };

  const handleAppointmentDoubleTap = (appointment: Appointment) => {
    setAppointmentOptionsModal(appointment);
  };

  const SWIPE_THRESHOLD = screenWidth / 2;
  const swipeGesture = Gesture.Pan().enabled(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <GestureDetector gesture={swipeGesture}>
        <View style={styles.mainWrap}>
          <CalendarHeaderDynamic
          initialDate={currentDate}
          onDateChange={setCurrentDate}
          onViewModeChange={setViewMode}
          viewMode={viewMode}
        />
        <LeftDecoration />
        <RightDecoration date={currentDate} />
        {viewMode === 'day' && (
          <>
            <AllDaySection
              events={dayToolbarEvents}
              selectedDate={currentDate}
              onParkZoneMeasured={setParkZone}
              highlighted={isOverParkZone}
              parkZone={parkZone}
              calendarLayout={calendarLayout}
              onUnparkToSlot={handleMoveAppointment}
              onUnparkDragPosition={(y) => dayCalendarRef.current?.requestScrollWhenDragging(y)}
              onUnparkDragEnd={() => dayCalendarRef.current?.stopScrollWhenDragging()}
              onUnparkDragGhost={setUnparkDragGhost}
            />
            <Animated.View style={[styles.dayViewWrap, { transform: [{ translateX: swipeSlideAnim }] }]}>
            <CalendarMiddleSection
              ref={dayCalendarRef}
              onCalendarLayoutChange={setCalendarLayout}
              externalUnparkDrag={unparkDragGhost}
              selectedDate={currentDate}
              appointments={appointments}
              allDayAppointments={[]}
              currentTime={liveTime.toDate()}
              showCurrentTimeIndicator={true}
              parkZone={parkZone}
              onAppointmentPress={handleAppointmentPress}
              onAppointmentDoubleTap={handleAppointmentDoubleTap}
              onParkAppointment={handleParkAppointment}
              onMoveAppointment={handleMoveAppointment}
              onResizeAppointment={handleResizeAppointment}
              onNotifyClient={handleNotifyClient}
              onDragOverParkZone={setIsOverParkZone}
              onEmptySlotPress={handleEmptySlotPress}
              onHorizontalSwipeMove={(translationX) => {
                swipeSlideAnim.setValue(translationX);
              }}
              onHorizontalSwipeCancel={() => {
                Animated.spring(swipeSlideAnim, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 80,
                  friction: 14,
                }).start();
              }}
              onHorizontalSwipe={(direction) => {
                haptics.light();
                setCurrentDate((prev) => (direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1)));
                const fromX = direction === 'next' ? -SWIPE_SLIDE_OFFSET : SWIPE_SLIDE_OFFSET;
                swipeSlideAnim.setValue(fromX);
                Animated.timing(swipeSlideAnim, {
                  toValue: 0,
                  duration: SWIPE_ANIM_DURATION,
                  useNativeDriver: true,
                  easing: Easing.out(Easing.cubic),
                }).start();
              }}
            />
            </Animated.View>
          </>
        )}
        {viewMode === 'week' && (
          <>
            <AllDaySection
              events={dayToolbarEvents}
              selectedDate={currentDate}
              onParkZoneMeasured={setParkZone}
              highlighted={false}
              parkZone={parkZone}
              calendarLayout={weekCalendarLayout}
              onUnparkToSlot={handleMoveAppointment}
              onUnparkDragPosition={(y) => weekCalendarRef.current?.requestScrollWhenDragging(y)}
              onUnparkDragEnd={() => weekCalendarRef.current?.stopScrollWhenDragging()}
            />
            <Animated.View style={[styles.dayViewWrap, { transform: [{ translateX: weekSlideAnim }] }]}>
            <CalendarWeekView
              ref={weekCalendarRef}
              selectedDate={currentDate}
              onWeekCalendarLayoutChange={setWeekCalendarLayout}
              appointmentsByDay={appointmentsByDay}
              allDayByDay={allDayByDay}
              currentTime={weekContainsToday ? liveTime.toDate() : currentTime}
              showCurrentTimeIndicator={weekContainsToday}
              parkZone={parkZone}
              onHorizontalSwipeMove={(translationX) => {
                weekSlideAnim.setValue(translationX);
              }}
              onHorizontalSwipeCancel={() => {
                Animated.spring(weekSlideAnim, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 80,
                  friction: 14,
                }).start();
              }}
              onHorizontalSwipe={(direction) => {
                haptics.light();
                const newDate = direction === 'prev' ? subDays(currentDate, FIVE_DAY_COUNT) : addDays(currentDate, FIVE_DAY_COUNT);
                setCurrentDate(newDate);
                const fromX = direction === 'next' ? -SWIPE_SLIDE_OFFSET : SWIPE_SLIDE_OFFSET;
                weekSlideAnim.setValue(fromX);
                Animated.timing(weekSlideAnim, {
                  toValue: 0,
                  duration: SWIPE_ANIM_DURATION,
                  useNativeDriver: true,
                  easing: Easing.out(Easing.cubic),
                }).start();
              }}
              onDateSelect={(date) => {
                setCurrentDate(date);
                setViewMode('day');
              }}
              onAppointmentPress={handleAppointmentPress}
              onAppointmentDoubleTap={handleAppointmentDoubleTap}
              onEmptySlotPress={(date) => {
                setCurrentDate(date);
                setViewMode('day');
              }}
              waitlistDays={[]}
              onWaitlistPress={() => setWaitlistModalVisible(true)}
            />
            </Animated.View>
          </>
        )}
        <EmptySlotActionModal
          visible={emptySlotModal !== null}
          date={emptySlotModal?.date ?? new Date()}
          hour={emptySlotModal?.hour ?? 8}
          onClose={() => setEmptySlotModal(null)}
          onNewAppointment={(date, hour) => router.push({ pathname: '/new-appointment', params: { date: date.toISOString(), hour: String(hour) } })}
          onPersonalTask={() => {}}
          onEditWorkingHours={() => {}}
        />
        <AppointmentOptionsModal
          visible={appointmentOptionsModal !== null}
          appointment={appointmentOptionsModal}
          onClose={() => setAppointmentOptionsModal(null)}
          onEdit={(apt) => {
            setAppointmentOptionsModal(null);
            setModifyConfirmAppointment(apt);
          }}
          onReschedule={(apt) => {
            setAppointmentOptionsModal(null);
            openRescheduleModal(apt);
          }}
          onCancel={(apt) => {
            setAppointmentOptionsModal(null);
            setCancelConfirmAppointment(apt);
          }}
        />
        <Modal visible={rescheduleModalAppointment !== null} transparent animationType="fade">
          <Pressable style={styles.rescheduleOverlay} onPress={() => setRescheduleModalAppointment(null)}>
            <Pressable style={styles.rescheduleCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.rescheduleTitle}>Reschedule Appointment</Text>
              <Text style={styles.rescheduleSubtitle}>
                {rescheduleModalAppointment
                  ? `${rescheduleModalAppointment.clientName} • ${format(rescheduleModalAppointment.startTime, 'EEE, MMM d h:mm a')}`
                  : ''}
              </Text>

              <Text style={styles.selectorLabel}>Reschedule in weeks</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
                {weekOptions.map((week) => (
                  <Pressable
                    key={`week-${week}`}
                    style={[styles.selectorChip, selectedRescheduleWeeks === week && styles.selectorChipActive]}
                    onPress={() => setSelectedRescheduleWeeks(week)}
                  >
                    <Text style={[styles.selectorChipText, selectedRescheduleWeeks === week && styles.selectorChipTextActive]}>{week}w</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.selectorLabel}>Repeat appointments</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
                {repeatOptions.map((count) => (
                  <Pressable
                    key={`repeat-${count}`}
                    style={[styles.selectorChip, repeatAppointments === count && styles.selectorChipActive]}
                    onPress={() => setRepeatAppointments(count)}
                  >
                    <Text style={[styles.selectorChipText, repeatAppointments === count && styles.selectorChipTextActive]}>{count}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.helperText}>
                BOOK will schedule {repeatAppointments} appointment{repeatAppointments > 1 ? 's' : ''} every {selectedRescheduleWeeks} week{selectedRescheduleWeeks > 1 ? 's' : ''}.
              </Text>

              <View style={styles.rescheduleActions}>
                <Pressable style={styles.cancelButton} onPress={() => setRescheduleModalAppointment(null)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.bookButton} onPress={handleBookReschedule}>
                  <Text style={styles.bookButtonText}>BOOK</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
        <Modal visible={conflictResolution !== null} transparent animationType="fade">
          <Pressable style={styles.rescheduleOverlay} onPress={() => setConflictResolution(null)}>
            <Pressable style={styles.rescheduleCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.rescheduleTitle}>Time Conflict</Text>
              <Text style={styles.rescheduleSubtitle}>
                This slot is already booked. Pick a custom time for appointment {conflictResolution ? conflictResolution.currentIndex + 1 : 1}.
              </Text>
              {conflictResolution && conflictResolution.options.length > 0 ? (
                <View style={styles.conflictOptions}>
                  {conflictResolution.options.map((option, idx) => (
                    <Pressable
                      key={`opt-${idx}`}
                      style={styles.conflictOptionButton}
                      onPress={() => {
                        if (!conflictResolution) return;
                        const durationMs =
                          conflictResolution.occurrences[conflictResolution.currentIndex].end.getTime() -
                          conflictResolution.occurrences[conflictResolution.currentIndex].start.getTime();
                        const next = [...conflictResolution.occurrences];
                        next[conflictResolution.currentIndex] = {
                          start: option,
                          end: new Date(option.getTime() + durationMs),
                        };
                        proceedConflictResolution({
                          ...conflictResolution,
                          occurrences: next,
                          currentIndex: conflictResolution.currentIndex + 1,
                          options: [],
                        });
                      }}
                    >
                      <Text style={styles.conflictOptionText}>{format(option, 'EEE, MMM d • h:mm a')}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.helperText}>No free slots found for this day. Move to another day and try again.</Text>
              )}
              <Pressable style={styles.cancelButton} onPress={() => setConflictResolution(null)}>
                <Text style={styles.cancelButtonText}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
        <GlassConfirmModal
          visible={parkConfirmAppointment !== null}
          mode="cancel_appointment"
          primaryText="Are you sure you want to park this appointment?"
          onYes={() => {
            if (parkConfirmAppointment) {
              handleParkAppointment(parkConfirmAppointment.id);
            }
            setParkConfirmAppointment(null);
          }}
          onNo={() => setParkConfirmAppointment(null)}
        />
        <GlassConfirmModal
          visible={modifyConfirmAppointment !== null}
          mode="cancel_appointment"
          primaryText="Are you sure you want to modify this appointment?"
          onYes={() => {
            if (modifyConfirmAppointment) {
              router.push({
                pathname: '/new-appointment',
                params: { appointmentId: modifyConfirmAppointment.id, date: modifyConfirmAppointment.startTime.toISOString(), hour: String(modifyConfirmAppointment.startTime.getHours()) },
              });
            }
            setModifyConfirmAppointment(null);
          }}
          onNo={() => setModifyConfirmAppointment(null)}
        />
        <GlassConfirmModal
          visible={cancelConfirmAppointment !== null}
          mode="cancel_appointment"
          primaryText="Are you sure you want to cancel this appointment?"
          onYes={() => {
            if (cancelConfirmAppointment) {
              setEvents((prev) => prev.filter((e) => e.id !== cancelConfirmAppointment.id));
            }
            setCancelConfirmAppointment(null);
          }}
          onNo={() => setCancelConfirmAppointment(null)}
        />
        <Modal visible={waitlistModalVisible} transparent animationType="fade">
          <Pressable style={styles.waitlistModalOverlay} onPress={() => setWaitlistModalVisible(false)}>
            <Pressable style={styles.waitlistModalBox} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.waitlistModalText}>Choose a day to drop an appointment by clicking on it.</Text>
              <Pressable style={styles.waitlistModalButton} onPress={() => setWaitlistModalVisible(false)}>
                <Text style={styles.waitlistModalButtonText}>OK</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
        {viewMode === 'month' && (
          <CalendarMonthView
            selectedDate={currentDate}
            events={events}
            onDateSelect={(date) => {
              setCurrentDate(date);
              setViewMode('week');
            }}
            selectedDayEvents={selectedDayEvents}
          />
        )}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  mainWrap: {
    flex: 1,
    position: 'relative',
  },
  dayViewWrap: {
    flex: 1,
  },
  rescheduleOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(20),
  },
  rescheduleCard: {
    width: '100%',
    maxWidth: ms(360),
    backgroundColor: '#151719',
    borderRadius: ms(16),
    borderWidth: ms(1),
    borderColor: 'rgba(255,255,255,0.14)',
    padding: ms(16),
  },
  rescheduleTitle: {
    color: '#FFFFFF',
    fontSize: ms(18),
    fontWeight: '700',
  },
  rescheduleSubtitle: {
    marginTop: vs(4),
    color: '#C7C7CC',
    fontSize: ms(12),
  },
  selectorLabel: {
    marginTop: vs(14),
    marginBottom: vs(8),
    color: '#FFFFFF',
    fontSize: ms(13),
    fontWeight: '600',
  },
  selectorRow: {
    gap: ms(8),
    paddingRight: ms(8),
  },
  selectorChip: {
    minWidth: ms(42),
    height: vs(32),
    paddingHorizontal: ms(10),
    borderRadius: ms(16),
    borderWidth: ms(1),
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorChipActive: {
    backgroundColor: 'rgba(250, 27, 254, 0.2)',
    borderColor: '#FA1BFE',
  },
  selectorChipText: {
    color: '#FFFFFF',
    fontSize: ms(12),
    fontWeight: '600',
  },
  selectorChipTextActive: {
    color: '#FA1BFE',
  },
  helperText: {
    marginTop: vs(12),
    color: '#C7C7CC',
    fontSize: ms(12),
  },
  rescheduleActions: {
    marginTop: vs(16),
    flexDirection: 'row',
    gap: ms(10),
  },
  cancelButton: {
    flex: 1,
    height: vs(40),
    borderRadius: ms(12),
    borderWidth: ms(1),
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: ms(13),
    fontWeight: '600',
  },
  bookButton: {
    flex: 1,
    height: vs(40),
    borderRadius: ms(12),
    backgroundColor: BOOK_BUTTON_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: ms(13),
    fontWeight: '700',
  },
  conflictOptions: {
    marginTop: vs(12),
    gap: vs(8),
  },
  conflictOptionButton: {
    borderRadius: ms(10),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: ms(1),
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: vs(10),
    paddingHorizontal: ms(12),
  },
  conflictOptionText: {
    color: '#FFFFFF',
    fontSize: ms(12),
    fontWeight: '600',
  },
  waitlistModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  waitlistModalBox: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 20,
    maxWidth: 320,
  },
  waitlistModalText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  waitlistModalButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#25afff',
    borderRadius: 8,
  },
  waitlistModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
