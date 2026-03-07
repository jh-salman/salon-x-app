import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions, Animated } from 'react-native';
import { wp, hp, ms } from '../utils/responsive';
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday } from 'date-fns';
import type { CalendarEvent } from '../data/events';

interface CalendarMonthViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  selectedDayEvents?: CalendarEvent[];
}

function hexToDotColor(hex?: string): string {
  if (!hex) return '#8e8e93';
  const h = hex.toLowerCase();
  if (h.includes('fa1bfe') || h.includes('ff18ec')) return '#fa1bfe';
  if (h.includes('25afff')) return '#25afff';
  if (h.includes('9de684')) return '#9de684';
  if (h.includes('ff7701')) return '#FF7701';
  return '#8e8e93';
}

const PANEL_MAX_HEIGHT = hp(27);

export default function CalendarMonthView({ selectedDate, events, onDateSelect, selectedDayEvents = [] }: CalendarMonthViewProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [panelExpanded, setPanelExpanded] = useState(selectedDayEvents.length > 0);
  const panelHeight = useRef(new Animated.Value(selectedDayEvents.length > 0 ? PANEL_MAX_HEIGHT : 0)).current;

  const monthStart = useMemo(() => startOfMonth(selectedDate), [selectedDate]);
  const monthEnd = useMemo(() => endOfMonth(selectedDate), [selectedDate]);
  const start = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 0 }), [monthStart]);
  const end = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 0 }), [monthEnd]);

  const cellSize = useMemo(() => Math.floor((screenWidth - wp(6)) / 7), [screenWidth]);

  useEffect(() => {
    const hasEvents = selectedDayEvents.length > 0;
    if (hasEvents) setPanelExpanded(true);
  }, [selectedDate]);

  useEffect(() => {
    const hasEvents = selectedDayEvents.length > 0;
    Animated.timing(panelHeight, {
      toValue: panelExpanded && hasEvents ? PANEL_MAX_HEIGHT : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [panelExpanded, selectedDayEvents.length]);

  const togglePanel = () => setPanelExpanded((p) => !p);

  const weeks = useMemo(() => {
    const days: Date[] = [];
    let d = start;
    while (d <= end) {
      days.push(d);
      d = addDays(d, 1);
    }
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    return result;
  }, [start, end]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      const d = e.allDay ? format(e.start, 'yyyy-MM-dd') : format(e.start, 'yyyy-MM-dd');
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return map;
  }, [events]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hasSelectedEvents = selectedDayEvents.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {dayLabels.map((l) => (
          <View key={l} style={[styles.headerCell, { width: cellSize }]}>
            <Text style={styles.headerText}>{l}</Text>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={[styles.weekRow, { minHeight: cellSize }]}>
          {week.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[dateStr] || [];
            const isCurrentMonth = isSameMonth(date, selectedDate);
            const isSelected = isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);
            const colors = [...new Set(dayEvents.map((e) => hexToDotColor(e.color)))].slice(0, 3);

            return (
              <Pressable
                key={dateStr}
                style={[styles.dayCell, !isCurrentMonth && styles.dayCellOtherMonth, { width: cellSize }]}
                onPress={() => onDateSelect(date)}
              >
                <View style={[styles.dayInner, isSelected && styles.dayInnerSelected, isTodayDate && !isSelected && styles.dayInnerToday]}>
                  <Text style={[styles.dayNum, !isCurrentMonth && styles.dayNumOtherMonth, isSelected && styles.dayNumSelected]}>
                    {format(date, 'd')}
                  </Text>
                </View>
                {colors.length > 0 && (
                  <View style={styles.dotsRow}>
                    {colors.map((c, i) => (
                      <View key={i} style={[styles.dot, { backgroundColor: c }]} />
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
      <Pressable style={styles.panelHeader} onPress={togglePanel}>
        <Text style={styles.selectedDayTitle}>{format(selectedDate, 'EEEE, MMM d')}</Text>
        <Text style={styles.panelToggle}>{hasSelectedEvents ? (panelExpanded ? '▼' : '▶') : '—'}</Text>
      </Pressable>
      <Animated.View style={[styles.selectedDaySection, { maxHeight: panelHeight }]}>
        {hasSelectedEvents ? (
          <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
            {selectedDayEvents.map((e) => (
              <View key={e.id} style={[styles.eventRow, { borderLeftColor: hexToDotColor(e.color) }]}>
                <Text style={styles.eventTitle} numberOfLines={1}>{e.title}</Text>
                {!e.allDay && <Text style={styles.eventTime}>{format(e.start, 'h:mm a')} - {format(e.end, 'h:mm a')}</Text>}
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyState}>No appointments this day</Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', paddingHorizontal: 12 },
  header: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(142, 142, 147, 0.2)' },
  headerCell: { alignItems: 'center' },
  headerText: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },
  weekRow: { flexDirection: 'row' },
  dayCell: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  dayCellOtherMonth: { opacity: 0.4 },
  dayInner: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayInnerSelected: { backgroundColor: '#25afff' },
  dayInnerToday: { borderWidth: 2, borderColor: '#25afff' },
  dayNum: { fontSize: 14, color: 'white', fontWeight: '500' },
  dayNumOtherMonth: { color: '#FFFFFF' },
  dayNumSelected: { color: 'white', fontWeight: '700' },
  dotsRow: { flexDirection: 'row', gap: 4, marginTop: 4, justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingVertical: 10 },
  panelToggle: { fontSize: 12, color: '#FFFFFF' },
  selectedDaySection: { overflow: 'hidden', borderTopWidth: 1, borderTopColor: 'rgba(142, 142, 147, 0.2)', paddingTop: 12 },
  selectedDayTitle: { fontSize: 14, color: '#25afff', fontWeight: '600', marginBottom: 8 },
  eventsList: { maxHeight: 200 },
  eventRow: { paddingLeft: 12, borderLeftWidth: 3, marginBottom: 8 },
  eventTitle: { fontSize: 13, color: 'white', fontWeight: '600' },
  eventTime: { fontSize: 11, color: '#FFFFFF', marginTop: 2 },
  emptyState: { fontSize: 13, color: '#FFFFFF', paddingVertical: 16, textAlign: 'center' },
});
