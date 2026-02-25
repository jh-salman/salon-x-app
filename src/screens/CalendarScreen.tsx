import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { isSameDay, format, addDays, subDays, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import CalendarHeaderDynamic, { type ViewMode } from '../components/CalendarHeaderDynamic';
import { RightDecoration } from '../components/RightDecoration';
import { AllDaySection, type ParkZoneBounds, type CalendarLayout } from '../components/AllDaySection';
import CalendarMiddleSection, { type Appointment, type AllDayAppointment } from '../components/CalendarMiddleSection';
import CalendarWeekView from '../components/CalendarWeekView';
import CalendarMonthView from '../components/CalendarMonthView';
import { EmptySlotActionModal } from '../components/EmptySlotActionModal';
import { AppointmentOptionsModal } from '../components/AppointmentOptionsModal';
import { GlassConfirmModal } from '../components/GlassConfirmModal';
import { useEvents } from '../context/EventsContext';
import type { CalendarEvent } from '../data/events';

function hexToColorCategory(hex?: string): 'pink' | 'blue' | 'green' | 'gray' {
  if (!hex) return 'gray';
  const h = hex.toLowerCase();
  if (h.includes('fa1bfe') || h.includes('ff18ec')) return 'pink';
  if (h.includes('25afff')) return 'blue';
  if (h.includes('9de684')) return 'green';
  return 'gray';
}

export function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { events, setEvents } = useEvents();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [liveTime, setLiveTime] = useState(() => dayjs());
  const [parkZone, setParkZone] = useState<ParkZoneBounds | null>(null);
  const [calendarLayout, setCalendarLayout] = useState<CalendarLayout | null>(null);
  const [isOverParkZone, setIsOverParkZone] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [emptySlotModal, setEmptySlotModal] = useState<{ date: Date; hour: number } | null>(null);
  const [appointmentOptionsModal, setAppointmentOptionsModal] = useState<Appointment | null>(null);
  const [parkConfirmAppointment, setParkConfirmAppointment] = useState<Appointment | null>(null);
  const [modifyConfirmAppointment, setModifyConfirmAppointment] = useState<Appointment | null>(null);
  const [cancelConfirmAppointment, setCancelConfirmAppointment] = useState<Appointment | null>(null);

  const isToday = dayjs(currentDate).isSame(dayjs(), 'day');

  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => setLiveTime(dayjs()), 30000);
    return () => clearInterval(interval);
  }, [isToday]);

  const appointments = useMemo((): Appointment[] => {
    return events
      .filter((e) => !e.allDay && isSameDay(e.start, currentDate))
      .map((e) => ({
        id: e.id,
        clientName: e.title,
        service: e.clientName || e.service || '',
        startTime: e.start,
        endTime: e.end,
        color: hexToColorCategory(e.color),
        hasAlarm: true,
      }));
  }, [events, currentDate]);

  const allDayEvents = useMemo(
    () =>
      events
        .filter((e) => e.allDay && isSameDay(e.start, currentDate))
        .map((e) => ({ id: e.id, title: e.title, color: e.color, isParked: e.isParked })),
    [events, currentDate]
  );

  const currentTime = isToday ? liveTime.toDate() : dayjs(currentDate).toDate();

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    weekDates.forEach((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      map[dateStr] = events
        .filter((e) => !e.allDay && isSameDay(e.start, date))
        .map((e) => ({
          id: e.id,
          clientName: e.title,
          service: e.clientName || e.service || '',
          startTime: e.start,
          endTime: e.end,
          color: hexToColorCategory(e.color),
          hasAlarm: true,
        }));
    });
    return map;
  }, [events, weekDates]);

  const allDayByDay = useMemo(() => {
    const map: Record<string, AllDayAppointment[]> = {};
    weekDates.forEach((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      map[dateStr] = events
        .filter((e) => e.allDay && isSameDay(e.start, date))
        .map((e) => ({ id: e.id, clientName: e.title, color: 'orange' as const }));
    });
    return map;
  }, [events, weekDates]);

  const selectedDayEvents = useMemo(
    () => events.filter((e) => isSameDay(e.start, currentDate)),
    [events, currentDate]
  );

  const handleParkAppointment = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              allDay: true,
              isParked: true,
              start: dayjs(currentDate).hour(0).minute(0).toDate(),
              end: dayjs(currentDate).hour(0).minute(0).toDate(),
            }
          : e
      )
    );
  };

  const handleMoveAppointment = (id: string, newStart: Date, newEnd: Date) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, start: newStart, end: newEnd, allDay: false } : e)));
  };

  const handleResizeAppointment = (id: string, newStart: Date, newEnd: Date) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, start: newStart, end: newEnd } : e))
    );
  };

  const handleNotifyClient = (id: string) => {
    // TODO: Send notification to client about appointment time change
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

  const SWIPE_THRESHOLD = 50;
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .enabled(viewMode === 'day')
    .onEnd((e) => {
      if (viewMode === 'month') return;
      if (e.translationX > SWIPE_THRESHOLD) {
        const newDate = viewMode === 'week' ? subWeeks(currentDate, 1) : subDays(currentDate, 1);
        setCurrentDate(newDate);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        const newDate = viewMode === 'week' ? addWeeks(currentDate, 1) : addDays(currentDate, 1);
        setCurrentDate(newDate);
      }
    });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <GestureDetector gesture={swipeGesture}>
        <View style={styles.mainWrap}>
          <CalendarHeaderDynamic
          initialDate={currentDate}
          onDateChange={setCurrentDate}
          onViewModeChange={setViewMode}
        />
        <RightDecoration date={currentDate} />
        {viewMode === 'day' && (
          <>
            <AllDaySection
              events={allDayEvents}
              selectedDate={currentDate}
              onParkZoneMeasured={setParkZone}
              highlighted={isOverParkZone}
              parkZone={parkZone}
              calendarLayout={calendarLayout}
              onUnparkToSlot={handleMoveAppointment}
            />
            <CalendarMiddleSection
              onCalendarLayoutChange={setCalendarLayout}
              selectedDate={currentDate}
              appointments={appointments}
              allDayAppointments={[]}
              currentTime={currentTime}
              showCurrentTimeIndicator={isToday}
              parkZone={parkZone}
              onAppointmentPress={handleAppointmentPress}
              onAppointmentDoubleTap={handleAppointmentDoubleTap}
              onParkAppointment={handleParkAppointment}
              onMoveAppointment={handleMoveAppointment}
              onResizeAppointment={handleResizeAppointment}
              onNotifyClient={handleNotifyClient}
              onDragOverParkZone={setIsOverParkZone}
              onEmptySlotPress={handleEmptySlotPress}
            />
          </>
        )}
        {viewMode === 'week' && (
          <>
            <AllDaySection
              events={allDayEvents}
              selectedDate={currentDate}
              onParkZoneMeasured={setParkZone}
              highlighted={isOverParkZone}
              parkZone={parkZone}
              calendarLayout={calendarLayout}
              onUnparkToSlot={handleMoveAppointment}
            />
            <CalendarWeekView
              selectedDate={currentDate}
              appointmentsByDay={appointmentsByDay}
              allDayByDay={allDayByDay}
              currentTime={currentTime}
              showCurrentTimeIndicator={isToday}
              parkZone={parkZone}
              onDateSelect={setCurrentDate}
              onAppointmentPress={handleAppointmentPress}
              onAppointmentDoubleTap={handleAppointmentDoubleTap}
              onParkAppointment={handleParkAppointment}
              onMoveAppointment={handleMoveAppointment}
              onResizeAppointment={handleResizeAppointment}
              onNotifyClient={handleNotifyClient}
              onDragOverParkZone={setIsOverParkZone}
              onEmptySlotPress={handleEmptySlotPress}
            />
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
            setParkConfirmAppointment(apt);
          }}
          onCancel={(apt) => {
            setAppointmentOptionsModal(null);
            setCancelConfirmAppointment(apt);
          }}
        />
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
        {viewMode === 'month' && (
          <CalendarMonthView
            selectedDate={currentDate}
            events={events}
            onDateSelect={setCurrentDate}
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
});
