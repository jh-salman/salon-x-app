import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import type { Appointment } from './CalendarMiddleSection';
import CalendarMiddleSection from './CalendarMiddleSection';
import type { ParkZoneBounds } from './AllDaySection';

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
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MIN_COLUMN_WIDTH = 140;
const MAX_COLUMN_WIDTH = 220;

export default function CalendarWeekView({
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
}: CalendarWeekViewProps) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 1 }), [selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const columnWidth = useMemo(() => {
    const w = (screenWidth - 32) / 7;
    return Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, w));
  }, [screenWidth]);

  const handleDateSelect = (date: Date, index: number) => {
    const targetX = Math.max(0, index * columnWidth - (screenWidth - columnWidth) / 2);
    scrollRef.current?.scrollTo({ x: targetX, animated: true });
    onDateSelect?.(date);
  };

  return (
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {weekDays.map((date, index) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayApps = appointmentsByDay[dateStr] || [];
        const dayAllDay = allDayByDay[dateStr] || [];
        const isSelected = isSameDay(date, selectedDate);
        const isTodayDate = isToday(date);

        return (
          <View key={dateStr} style={[styles.dayColumn, isSelected && styles.dayColumnSelected, { width: columnWidth, minWidth: columnWidth }]}>
            <Pressable style={styles.dayHeader} onPress={() => handleDateSelect(date, index)}>
              <Text style={[styles.dayLabel, isTodayDate && styles.dayLabelToday]}>{DAY_LABELS[(date.getDay() + 6) % 7]}</Text>
              <Text style={[styles.dateNum, isSelected && styles.dateNumSelected, isTodayDate && !isSelected && styles.dateNumToday]}>
                {format(date, 'd')}
              </Text>
            </Pressable>
            <View style={styles.dayContent}>
              <CalendarMiddleSection
                selectedDate={date}
                appointments={dayApps}
                allDayAppointments={dayAllDay}
                currentTime={currentTime}
                showCurrentTimeIndicator={showCurrentTimeIndicator && isTodayDate}
                parkZone={parkZone}
                onAppointmentPress={onAppointmentPress}
                onAppointmentDoubleTap={onAppointmentDoubleTap}
                onParkAppointment={onParkAppointment}
                onMoveAppointment={onMoveAppointment}
                onResizeAppointment={onResizeAppointment}
                onNotifyClient={onNotifyClient}
                onDragOverParkZone={onDragOverParkZone}
                onEmptySlotPress={onEmptySlotPress}
              />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dayColumn: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(142, 142, 147, 0.2)',
  },
  dayColumnSelected: { backgroundColor: 'rgba(37, 175, 255, 0.06)' },
  dayHeader: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#111', alignItems: 'center' },
  dayLabel: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },
  dayLabelToday: { color: '#25afff' },
  dateNum: { fontSize: 18, color: 'white', fontWeight: '600', marginTop: 2 },
  dateNumSelected: { color: '#25afff' },
  dateNumToday: { fontWeight: '700' },
  dayContent: { flex: 1, minHeight: 400 },
});
