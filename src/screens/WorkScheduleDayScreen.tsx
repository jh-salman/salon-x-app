import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Switch,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format, parse } from 'date-fns';
import { highlightColors } from '../theme';
import { wp, hp, RFValue } from '../utils/responsive';
import { ChevronIcon } from '../components/icons';
import { useWorkSchedule } from '../context/WorkScheduleContext';
import type { DayId } from '../context/WorkScheduleContext';

const BASE_DATE = new Date(2000, 0, 1);
const DEFAULT_START_TIME = '8:00 AM'; // start default: AM
const DEFAULT_END_TIME = '5:00 PM';   // end default: PM

function timeStringToDate(s: string): Date {
  try {
    const d = parse(s, 'h:mm a', BASE_DATE);
    return isNaN(d.getTime()) ? new Date(2000, 0, 1, 8, 0) : d;
  } catch {
    return new Date(2000, 0, 1, 8, 0);
  }
}

function dateToTimeString(d: Date): string {
  return format(d, 'h:mm a');
}

const DAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const BUSINESS_NAME = "Your business's";

export function WorkScheduleDayScreen() {
  const router = useRouter();
  const { day } = useLocalSearchParams<{ day?: string }>();
  const dayId = (day && DAY_IDS.includes(day as typeof DAY_IDS[number]) ? day : 'mon') as DayId;
  const dayLabel = DAY_LABELS[dayId] ?? 'Monday';
  const dayLabelPlural = dayLabel + 's'; // Mondays, Tuesdays, ...

  const { schedule, setDaySchedule } = useWorkSchedule();
  const daySchedule = schedule[dayId];

  const [available, setAvailable] = useState(daySchedule?.available ?? true);
  const [startTime, setStartTime] = useState(daySchedule?.startTime ?? DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(daySchedule?.endTime ?? DEFAULT_END_TIME);
  const [activeField, setActiveField] = useState<'start' | 'end'>('start');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState<'start' | 'end'>('start');
  const [pickerDate, setPickerDate] = useState(() => timeStringToDate(daySchedule?.startTime ?? DEFAULT_START_TIME));

  const handleAvailableChange = useCallback(
    (value: boolean) => {
      setAvailable(value);
      setDaySchedule(dayId, { available: value });
    },
    [dayId, setDaySchedule]
  );

  const displayTime = activeField === 'start' ? startTime : endTime;
  const businessHoursText = `${BUSINESS_NAME} regular business hours on ${dayLabel} are 8:00AM - 5:00PM.`;

  const openTimePicker = useCallback((field: 'start' | 'end') => {
    setPickerField(field);
    setPickerDate(timeStringToDate(field === 'start' ? startTime : endTime));
    setActiveField(field);
    setTimePickerVisible(true);
  }, [startTime, endTime]);

  const onPickerChange = useCallback((_ev: unknown, date?: Date) => {
    if (date) setPickerDate(date);
  }, []);

  const onPickerConfirm = useCallback(() => {
    const formatted = dateToTimeString(pickerDate);
    if (pickerField === 'start') {
      setStartTime(formatted);
      setDaySchedule(dayId, { startTime: formatted });
    } else {
      setEndTime(formatted);
      setDaySchedule(dayId, { endTime: formatted });
    }
    setTimePickerVisible(false);
  }, [pickerDate, pickerField, dayId, setDaySchedule]);

  const onPickerCancel = useCallback(() => {
    setTimePickerVisible(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronIcon size={20} color={highlightColors.neonPink} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{dayLabel}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Available {dayLabelPlural}</Text>
          <Switch
            value={available}
            onValueChange={handleAvailableChange}
            trackColor={{ false: '#444', true: highlightColors.neonPink }}
            thumbColor="#FFFFFF"
          />
        </View>

        {available && (
          <>
            <View style={styles.timeButtonsRow}>
              <Pressable
                style={[styles.timeBtn, activeField === 'start' && styles.timeBtnActive]}
                onPress={() => openTimePicker('start')}
              >
                <Text style={styles.timeBtnText}>Start</Text>
              </Pressable>
              <Pressable
                style={[styles.timeBtn, activeField === 'end' && styles.timeBtnActive]}
                onPress={() => openTimePicker('end')}
              >
                <Text style={styles.timeBtnText}>End</Text>
              </Pressable>
            </View>

            <Pressable style={styles.timeDisplayRow} onPress={() => openTimePicker(activeField)}>
              <Text style={styles.timeDisplayText}>{displayTime}</Text>
              <View style={styles.chevronDown}>
                <ChevronIcon size={18} color="#888" />
              </View>
            </Pressable>

            {timePickerVisible && (
              <Modal
                transparent
                visible={timePickerVisible}
                animationType="slide"
                onRequestClose={onPickerCancel}
              >
                <Pressable style={styles.timePickerOverlay} onPress={onPickerCancel}>
                  <Pressable style={styles.timePickerContent} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.timePickerHeader}>
                      <TouchableOpacity onPress={onPickerCancel} hitSlop={12}>
                        <Text style={styles.timePickerCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.timePickerTitle}>
                        {pickerField === 'start' ? 'Start time' : 'End time'}
                      </Text>
                      <TouchableOpacity onPress={onPickerConfirm} hitSlop={12}>
                        <Text style={styles.timePickerDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={pickerDate}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onPickerChange}
                      themeVariant="dark"
                      textColor="#FFFFFF"
                    />
                  </Pressable>
                </Pressable>
              </Modal>
            )}

            <Text style={styles.helperText}>{businessHoursText}</Text>
            <Text style={styles.helperText2}>
              Individual team member working hours changed here will override the business hours. So if individual working hours are longer than the regular business hours, clients will be able to book this team member outside of business hours.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: RFValue(14), color: highlightColors.neonPink, fontWeight: '600' },
  title: { fontSize: RFValue(20), fontWeight: '700', color: '#FFFFFF' },
  headerSpacer: { width: 60 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: hp(6), paddingHorizontal: wp(6), paddingTop: hp(2) },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2),
  },
  toggleLabel: { fontSize: RFValue(15), color: '#FFFFFF', fontWeight: '500' },
  timeButtonsRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(2),
  },
  timeBtn: {
    flex: 1,
    paddingVertical: hp(1.2),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 24, 236, 0.5)',
    backgroundColor: '#000',
    alignItems: 'center',
  },
  timeBtnActive: {
    backgroundColor: highlightColors.neonPink,
    borderColor: highlightColors.neonPink,
  },
  timeBtnText: { fontSize: RFValue(14), fontWeight: '600', color: '#FFFFFF' },
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
    gap: 6,
  },
  timeDisplayText: { fontSize: RFValue(18), color: '#FFFFFF', fontWeight: '500' },
  chevronDown: { transform: [{ rotate: '-90deg' }] },
  helperText: {
    fontSize: RFValue(13),
    color: '#FFFFFF',
    lineHeight: RFValue(19),
    marginTop: hp(3),
  },
  helperText2: {
    fontSize: RFValue(13),
    color: '#FFFFFF',
    lineHeight: RFValue(19),
    marginTop: hp(1),
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  timePickerContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: hp(4),
    alignItems: 'center',
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  timePickerCancel: { fontSize: RFValue(16), color: '#999' },
  timePickerTitle: { fontSize: RFValue(17), fontWeight: '600', color: '#FFFFFF' },
  timePickerDone: { fontSize: RFValue(16), fontWeight: '600', color: highlightColors.neonPink },
});
