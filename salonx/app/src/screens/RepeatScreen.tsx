import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format, addWeeks } from 'date-fns';
import { highlightColors } from '../theme';
import { wp, hp, ms, vs, RFValue } from '../utils/responsive';

export type RepeatIntervalUnit = 'day' | 'week' | 'month';

const PARAM_DATE = 'date';
const PARAM_HOUR = 'hour';
const PARAM_REPEAT = 'repeatEnabled';
const PARAM_END = 'endTime';
const PARAM_UNIT = 'intervalUnit';
const PARAM_VALUE = 'intervalValue';

const UNITS: { key: RepeatIntervalUnit; label: string }[] = [
  { key: 'day', label: 'Days' },
  { key: 'week', label: 'Weeks' },
  { key: 'month', label: 'Months' },
];

const MAX_INTERVAL: Record<RepeatIntervalUnit, number> = {
  day: 30,
  week: 12,
  month: 12,
};

export function RepeatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    [PARAM_DATE]?: string;
    [PARAM_HOUR]?: string;
    [PARAM_REPEAT]?: string;
    [PARAM_END]?: string;
    [PARAM_UNIT]?: string;
    [PARAM_VALUE]?: string;
    clientName?: string;
    serviceName?: string;
    clientId?: string;
    serviceId?: string;
    duration?: string;
  }>();

  const startDate = useMemo(() => {
    const d = params[PARAM_DATE] ? new Date(params[PARAM_DATE]) : new Date();
    const hour = parseInt(String(params[PARAM_HOUR] ?? ''), 10);
    if (!isNaN(hour)) d.setHours(hour, 0, 0, 0);
    return d;
  }, [params[PARAM_DATE], params[PARAM_HOUR]]);

  const [repeatEnabled, setRepeatEnabled] = useState(params[PARAM_REPEAT] === '1');
  const [endTime, setEndTime] = useState<Date>(() => {
    const from = params[PARAM_END];
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) return d;
    }
    return addWeeks(startDate, 4);
  });
  const [intervalUnit, setIntervalUnit] = useState<RepeatIntervalUnit>(
    (params[PARAM_UNIT] as RepeatIntervalUnit) || 'day'
  );
  const [intervalValue, setIntervalValue] = useState(() => {
    const v = parseInt(String(params[PARAM_VALUE] ?? '1'), 10);
    return isNaN(v) || v < 1 ? 1 : Math.min(v, MAX_INTERVAL[intervalUnit]);
  });
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);

  const maxVal = MAX_INTERVAL[intervalUnit];
  const intervalOptions = useMemo(() => Array.from({ length: maxVal }, (_, i) => i + 1), [maxVal]);

  const summary = useMemo(() => {
    if (!repeatEnabled) return null;
    const unitLabel = intervalUnit === 'day' ? 'day' : intervalUnit === 'week' ? 'week' : 'month';
    const plural = intervalValue !== 1 ? 's' : '';
    const dayName = format(endTime, 'EEEE');
    const dateStr = format(endTime, 'MMMM d yyyy');
    return `This will repeat every ${intervalValue} ${unitLabel}${plural} and ends on ${dayName}, ${dateStr}.`;
  }, [repeatEnabled, intervalUnit, intervalValue, endTime]);

  const onCancel = () => {
    router.back();
  };

  const onSave = () => {
    router.replace({
      pathname: '/new-appointment',
      params: {
        date: params[PARAM_DATE] ?? startDate.toISOString(),
        hour: params[PARAM_HOUR] ?? String(startDate.getHours()),
        repeatEnabled: repeatEnabled ? '1' : '0',
        endTime: repeatEnabled ? endTime.toISOString() : '',
        intervalUnit: repeatEnabled ? intervalUnit : '',
        intervalValue: repeatEnabled ? String(intervalValue) : '',
        clientName: params.clientName ?? '',
        serviceName: params.serviceName ?? '',
        clientId: params.clientId ?? '',
        serviceId: params.serviceId ?? '',
        duration: params.duration ?? '',
      },
    });
  };

  const onEndDateChange = (_ev: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowEndDatePicker(false);
    if (date) setEndTime(date);
  };

  const unitLabel = intervalUnit === 'day' ? 'day' : intervalUnit === 'week' ? 'week' : 'month';
  const intervalDisplay = `${intervalValue} ${unitLabel}${intervalValue !== 1 ? 's' : ''}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header: Cancel | Repeat | Save */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} hitSlop={12}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Repeat</Text>
          <TouchableOpacity onPress={onSave} style={styles.saveButton} activeOpacity={0.8}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Repeat toggle */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Repeat</Text>
            <Switch
              value={repeatEnabled}
              onValueChange={setRepeatEnabled}
              trackColor={{ false: '#A3A3A3', true: highlightColors.neonPink }}
              thumbColor="#FCFCFC"
              ios_backgroundColor="#A3A3A3"
            />
          </View>

          {repeatEnabled && (
            <>
              {/* End Time */}
              <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={() => setShowEndDatePicker(true)}>
                <Text style={styles.rowLabel}>End Time</Text>
                <Text style={styles.rowValue}>{format(endTime, 'MMMM d yyyy')}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              {showEndDatePicker && Platform.OS === 'ios' && (
                <Modal transparent animationType="fade">
                  <Pressable style={styles.pickerOverlay} onPress={() => setShowEndDatePicker(false)}>
                    <Pressable style={styles.pickerCard} onPress={(e) => e.stopPropagation()}>
                      <View style={styles.pickerHeader}>
                        <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.pickerTitle}>End date</Text>
                        <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                          <Text style={styles.doneText}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={endTime}
                        mode="date"
                        display="spinner"
                        onChange={onEndDateChange}
                        minimumDate={startDate}
                        themeVariant="dark"
                      />
                    </Pressable>
                  </Pressable>
                </Modal>
              )}

              {showEndDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={endTime}
                  mode="date"
                  display="default"
                  onChange={(ev, date) => {
                    setShowEndDatePicker(false);
                    if (date) setEndTime(date);
                  }}
                  minimumDate={startDate}
                />
              )}

              {/* Interval unit: Days | Weeks | Months */}
              <View style={styles.segmentWrap}>
                <View style={styles.segments}>
                  {UNITS.map(({ key, label }) => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.segment, intervalUnit === key && styles.segmentActive]}
                      onPress={() => {
                        setIntervalUnit(key);
                        setIntervalValue((v) => Math.min(v, MAX_INTERVAL[key]));
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.segmentText, intervalUnit === key && styles.segmentTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Interval value: "1 day" with dropdown */}
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.8}
                onPress={() => setShowIntervalPicker(true)}
              >
                <Text style={styles.rowValue}>{intervalDisplay}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <Modal visible={showIntervalPicker} transparent animationType="fade">
                <Pressable style={styles.pickerOverlay} onPress={() => setShowIntervalPicker(false)}>
                  <Pressable style={styles.pickerCard} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.pickerHeader}>
                      <TouchableOpacity onPress={() => setShowIntervalPicker(false)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.pickerTitle}>Every</Text>
                      <TouchableOpacity onPress={() => setShowIntervalPicker(false)}>
                        <Text style={styles.doneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.intervalList}>
                      {intervalOptions.map((n) => (
                        <TouchableOpacity
                          key={n}
                          style={styles.intervalOption}
                          onPress={() => {
                            setIntervalValue(n);
                            setShowIntervalPicker(false);
                          }}
                        >
                          <Text style={styles.intervalOptionText}>
                            {n} {unitLabel}{n !== 1 ? 's' : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </Pressable>
                </Pressable>
              </Modal>

              {/* Summary */}
              {summary && (
                <Text style={styles.summary}>{summary}</Text>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  cancelText: {
    fontSize: RFValue(14),
    fontWeight: '600',
    color: highlightColors.neonPink,
  },
  title: {
    fontSize: RFValue(20),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveButton: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(0.8),
    borderRadius: 999,
    backgroundColor: highlightColors.neonPink,
  },
  saveText: {
    fontSize: RFValue(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: wp(5), paddingTop: hp(2), gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: vs(48),
    backgroundColor: '#1a1a1a',
    borderRadius: ms(8),
    marginBottom: hp(1),
    paddingHorizontal: wp(4),
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rowLabel: { flex: 1, fontSize: ms(14), color: '#FFFFFF', fontFamily: 'Lato' },
  rowValue: { flex: 1, fontSize: ms(14), color: '#A3A3A3', fontFamily: 'Lato', textAlign: 'right' },
  chevron: { fontSize: ms(18), color: '#A3A3A3', marginLeft: ms(4) },
  segmentWrap: { marginBottom: hp(1) },
  segments: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: ms(8),
    padding: ms(4),
    gap: ms(4),
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  segment: {
    flex: 1,
    paddingVertical: hp(1),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(6),
  },
  segmentActive: { backgroundColor: highlightColors.neonPink },
  segmentText: { fontSize: ms(14), color: '#FFFFFF', fontFamily: 'Lato' },
  segmentTextActive: { color: '#FFFFFF', fontFamily: 'Lato-Bold' },
  summary: {
    marginTop: hp(1),
    fontSize: ms(13),
    color: '#A3A3A3',
    fontFamily: 'Lato',
    lineHeight: ms(18),
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: ms(16),
    borderTopRightRadius: ms(16),
    paddingBottom: hp(4),
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  pickerTitle: { fontSize: RFValue(16), fontWeight: '600', color: '#FFFFFF' },
  doneText: { fontSize: RFValue(14), fontWeight: '600', color: highlightColors.neonPink },
  intervalList: { maxHeight: hp(40) },
  intervalOption: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  intervalOptionText: { fontSize: ms(16), color: '#FFFFFF', fontFamily: 'Lato' },
});
