import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  StyleSheet,
  ScrollView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wp, hp, ms, vs } from '../src/utils/responsive';
import { RFValue } from 'react-native-responsive-fontsize';
import { highlightColors } from '../src/theme';
import { useDurationResult } from '../src/context/DurationResultContext';
import type { DurationValues } from '../src/components/DurationSetupSection';
import Svg, { Path, G } from 'react-native-svg';

const MIN_STEP = 5;
const MAX_MINUTES = 6 * 60;

function buildMinuteOptions(max: number, step: number) {
  const out: { value: number; label: string }[] = [];
  for (let m = 0; m <= max; m += step) {
    out.push({ value: m, label: formatDuration(m) });
  }
  return out;
}

function formatDuration(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m} mins`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

type Segment = 'start' | 'processing' | 'end';

const BackIcon = () => (
  <Svg width={ms(16)} height={ms(10)} viewBox="0 0 15.6059 10.1073">
    <G>
      <Path d="M4.74241 4.97939L8.48012 0.307264L4.11946 0.307263L0.381754 4.97939L4.11946 9.80726L8.48011 9.80726L4.74241 4.97939Z" stroke={highlightColors.neonPink} strokeWidth={0.6} fill="none" />
      <Path d="M14.8228 0.299999L12.0195 0.299999L8.12607 4.97213L12.0195 9.8L14.9785 9.8L11.0851 4.97213L14.8228 0.299999Z" stroke={highlightColors.neonPink} strokeWidth={0.6} fill="none" />
    </G>
  </Svg>
);

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

function parseParams(p: Record<string, string | undefined>): DurationValues {
  return {
    startMin: parseInt(p.startMin ?? '40', 10) || 40,
    processingEnabled: p.processingEnabled === 'true',
    processingMin: parseInt(p.processingMin ?? '20', 10) || 20,
    processingBlocks: p.processingBlocks === 'true',
    endMin: parseInt(p.endMin ?? '15', 10) || 15,
    bufferEnabled: p.bufferEnabled === 'true',
    bufferMin: parseInt(p.bufferMin ?? '10', 10) || 10,
  };
}

export default function DurationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const { setPendingResult } = useDurationResult();

  const [values, setValues] = useState<DurationValues>(() => parseParams(params));
  const [segment, setSegment] = useState<Segment>('start');
  const [showBufferModal, setShowBufferModal] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const bufferScrollRef = useRef<ScrollView>(null);

  const options = useMemo(() => buildMinuteOptions(MAX_MINUTES, MIN_STEP), []);

  const currentValue = segment === 'start' ? values.startMin : segment === 'processing' ? values.processingMin : values.endMin;
  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((o) => o.value === currentValue);
    return idx >= 0 ? idx : 0;
  }, [options, currentValue]);

  const padded = useMemo(() => {
    const padCount = Math.floor(VISIBLE_ITEMS / 2);
    const pad = Array.from({ length: padCount }, (_, i) => ({ value: -i - 1, label: '' }));
    return [...pad, ...options, ...pad];
  }, [options]);

  const paddedIndex = selectedIndex + Math.floor(VISIBLE_ITEMS / 2);
  const centerOffset = (paddedIndex - Math.floor(VISIBLE_ITEMS / 2)) * ITEM_HEIGHT;

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, centerOffset), animated: false });
    });
  }, [paddedIndex, segment, centerOffset, values.processingEnabled]);

  const update = (patch: Partial<DurationValues>) => {
    setValues((v) => ({ ...v, ...patch }));
  };

  const onPickerChange = (next: number) => {
    if (segment === 'start') update({ startMin: next });
    else if (segment === 'processing') update({ processingMin: next });
    else update({ endMin: next });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const pad = Math.floor(VISIBLE_ITEMS / 2);
    const centerY = y + (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;
    const rawIndex = Math.round(centerY / ITEM_HEIGHT);
    const optionIndex = rawIndex - pad;
    const clamped = Math.max(0, Math.min(options.length - 1, optionIndex));
    const next = options[clamped]?.value ?? 0;
    const newCenterOffset = clamped * ITEM_HEIGHT;
    scrollRef.current?.scrollTo({ y: Math.max(0, newCenterOffset), animated: true });
    if (next !== currentValue) onPickerChange(next);
  };

  const totalMinutes = values.startMin + (values.processingEnabled ? values.processingMin : 0) + values.endMin;
  const calendarMinutes = totalMinutes + (values.bufferEnabled ? values.bufferMin : 0);

  const bufferOptions = useMemo(() => buildMinuteOptions(120, MIN_STEP), []);
  const bufferSelectedIndex = useMemo(() => {
    const idx = bufferOptions.findIndex((o) => o.value === values.bufferMin);
    return idx >= 0 ? idx : 0;
  }, [bufferOptions, values.bufferMin]);
  const bufferPadded = useMemo(() => {
    const padCount = Math.floor(VISIBLE_ITEMS / 2);
    const pad = Array.from({ length: padCount }, (_, i) => ({ value: -i - 1, label: '' }));
    return [...pad, ...bufferOptions, ...pad];
  }, [bufferOptions]);
  const bufferPaddedIndex = bufferSelectedIndex + Math.floor(VISIBLE_ITEMS / 2);
  const bufferCenterOffset = bufferSelectedIndex * ITEM_HEIGHT;

  useEffect(() => {
    if (showBufferModal) {
      requestAnimationFrame(() => {
        bufferScrollRef.current?.scrollTo({ y: Math.max(0, bufferCenterOffset), animated: false });
      });
    }
  }, [showBufferModal, bufferCenterOffset]);

  const onBufferMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const pad = Math.floor(VISIBLE_ITEMS / 2);
    const centerY = y + (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;
    const rawIndex = Math.round(centerY / ITEM_HEIGHT);
    const optionIndex = rawIndex - pad;
    const clamped = Math.max(0, Math.min(bufferOptions.length - 1, optionIndex));
    const next = bufferOptions[clamped]?.value ?? 0;
    bufferScrollRef.current?.scrollTo({ y: Math.max(0, clamped * ITEM_HEIGHT), animated: true });
    update({ bufferMin: next });
  };

  const handleDone = () => {
    setPendingResult(values);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <BackIcon />
        </Pressable>
        <Text style={styles.title}>Duration</Text>
        <Pressable onPress={handleDone} style={styles.doneBtn}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Add Processing Time</Text>
          <Switch
            value={values.processingEnabled}
            onValueChange={(v) => {
              setSegment('start');
              update({
                processingEnabled: v,
                processingMin: v ? values.processingMin : 0,
                endMin: v ? values.endMin : 0,
              });
            }}
            trackColor={{ false: '#1F1F1F', true: highlightColors.neonPink }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.divider} />

        {values.processingEnabled ? (
          <>
            <View style={styles.segmentedRow}>
              {(['start', 'processing', 'end'] as const).map((s) => (
                <Pressable
                  key={s}
                  style={[styles.segment, segment === s && styles.segmentActive]}
                  onPress={() => setSegment(s)}
                >
                  <Text style={[styles.segmentText, segment === s && styles.segmentTextActive]}>
                    {s === 'start' ? 'Start' : s === 'processing' ? 'Processing' : 'End'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.wheelCard}>
              <View style={styles.wheelWrap}>
                <View pointerEvents="none" style={styles.wheelHighlight} />
                <ScrollView
                  ref={scrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  onMomentumScrollEnd={onMomentumEnd}
                  style={{ height: WHEEL_HEIGHT }}
                  nestedScrollEnabled
                >
                  {padded.map((item, i) => {
                    const isCenter = i === paddedIndex;
                    return (
                      <View key={i} style={[styles.wheelItem, { height: ITEM_HEIGHT }]}>
                        <Text style={[styles.wheelText, isCenter ? styles.wheelTextActive : styles.wheelTextInactive]}>{item.label || '—'}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
              {segment === 'processing' && (
                <Text style={styles.helperText}>(Stylist available during this)</Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.wheelCard}>
            <View style={styles.wheelWrap}>
              <View pointerEvents="none" style={styles.wheelHighlight} />
              <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="start"
                decelerationRate="fast"
                onMomentumScrollEnd={onMomentumEnd}
                style={{ height: WHEEL_HEIGHT }}
                nestedScrollEnabled
              >
                {padded.map((item, i) => {
                  const isCenter = i === paddedIndex;
                  return (
                    <View key={i} style={[styles.wheelItem, { height: ITEM_HEIGHT }]}>
                      <Text style={[styles.wheelText, isCenter ? styles.wheelTextActive : styles.wheelTextInactive]}>{item.label || '—'}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Duration:</Text>
          <Text style={styles.totalValue}>{totalMinutes} min</Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.row, { paddingTop: hp(1.5) }]}>
          <Text style={styles.rowLabel}>Block Time After</Text>
          <Switch
            value={values.bufferEnabled}
            onValueChange={(v) => update({ bufferEnabled: v, bufferMin: v ? values.bufferMin : 0 })}
            trackColor={{ false: '#1F1F1F', true: highlightColors.neonPink }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text style={styles.blockHelper}>
          Block time to clean, checkout, travel. Hidden from clients. Blocks stylist calendar.
        </Text>

        {values.bufferEnabled && (
          <Pressable style={styles.bufferSection} onPress={() => setShowBufferModal(true)}>
            <Text style={styles.cardLabel}>Time After Appointment</Text>
            <View style={styles.bufferRow}>
              <Text style={styles.valueText}>{values.bufferMin} min</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        )}

        <Modal visible={showBufferModal} transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setShowBufferModal(false)}>
            <Pressable style={styles.bufferModalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.bufferModalTitle}>Time After Appointment</Text>
              <View style={styles.wheelWrap}>
                <View pointerEvents="none" style={styles.wheelHighlight} />
                <ScrollView
                  ref={bufferScrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  onMomentumScrollEnd={onBufferMomentumEnd}
                  style={{ height: WHEEL_HEIGHT }}
                  nestedScrollEnabled
                >
                  {bufferPadded.map((item, i) => (
                    <View key={i} style={[styles.wheelItem, { height: ITEM_HEIGHT }]}>
                      <Text style={[styles.wheelText, i === bufferPaddedIndex ? styles.wheelTextActive : styles.wheelTextInactive]}>{item.label || '—'}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <Pressable style={styles.bufferModalDone} onPress={() => setShowBufferModal(false)}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <Text style={styles.calendarText}>
          Calendar block: <Text style={styles.calendarStrong}>{calendarMinutes} min</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  header: {
    height: vs(56),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
  },
  backBtn: { padding: ms(8) },
  title: { color: '#FFFFFF', fontSize: RFValue(22), fontWeight: '600' },
  doneBtn: { padding: ms(8) },
  doneText: { color: highlightColors.neonPink, fontSize: RFValue(17), fontWeight: '600' },
  scroll: { flex: 1 },
  content: { paddingBottom: hp(6) },
  row: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { color: '#FFFFFF', fontSize: RFValue(17), fontWeight: '400' },
  divider: { height: 1, backgroundColor: '#1F1F1F', marginHorizontal: wp(4), marginVertical: hp(1) },
  segmentedRow: {
    flexDirection: 'row',
    marginHorizontal: wp(4),
    marginBottom: hp(1),
    backgroundColor: '#1C1C1E',
    borderRadius: ms(10),
    padding: ms(4),
  },
  segment: { flex: 1, paddingVertical: hp(1), alignItems: 'center', borderRadius: ms(8) },
  segmentActive: { backgroundColor: highlightColors.neonPink },
  segmentText: { color: '#A1A1A6', fontSize: RFValue(14), fontWeight: '500' },
  segmentTextActive: { color: '#FFFFFF', fontWeight: '600' },
  wheelCard: {
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    padding: wp(4),
    backgroundColor: '#121212',
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  cardLabel: { color: '#A1A1A6', fontSize: RFValue(12), fontWeight: '600', letterSpacing: 1.2, marginBottom: hp(1) },
  wheelWrap: { height: WHEEL_HEIGHT, borderRadius: ms(14), overflow: 'hidden', position: 'relative' },
  wheelHighlight: {
    position: 'absolute',
    top: (WHEEL_HEIGHT - ITEM_HEIGHT) / 2,
    left: ms(4), right: ms(4), height: ITEM_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: ms(12),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 2,
  },
  wheelItem: { justifyContent: 'center', alignItems: 'center' },
  wheelText: { textAlign: 'center' },
  wheelTextActive: {
    color: '#FFFFFF',
    fontSize: RFValue(24),
    fontWeight: '700',
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  wheelTextInactive: { color: 'rgba(255,255,255,0.3)', fontSize: RFValue(15) },
  helperText: { marginTop: hp(1), color: '#A1A1A6', fontSize: RFValue(13) },
  simpleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: wp(4), paddingVertical: hp(0.5) },
  valueText: { color: '#FFFFFF', fontSize: RFValue(16) },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: ms(8),
    marginHorizontal: wp(4),
    marginTop: hp(2),
    paddingVertical: hp(1),
  },
  totalLabel: { color: '#A1A1A6', fontSize: RFValue(16), fontWeight: '600' },
  totalValue: { color: '#FFFFFF', fontSize: RFValue(22), fontWeight: '700' },
  blockHelper: { paddingHorizontal: wp(4), paddingTop: hp(0.5), color: '#A1A1A6', fontSize: RFValue(13), lineHeight: ms(18) },
  bufferSection: {
    marginHorizontal: wp(4),
    marginTop: hp(1),
    padding: wp(4),
    backgroundColor: '#121212',
    borderRadius: ms(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bufferRow: { flexDirection: 'row', alignItems: 'center', gap: ms(4) },
  chevron: { color: '#A1A1A6', fontSize: RFValue(20) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  bufferModalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    padding: wp(4),
    paddingBottom: hp(4),
  },
  bufferModalTitle: { color: '#FFFFFF', fontSize: RFValue(18), fontWeight: '600', marginBottom: hp(2), textAlign: 'center' },
  bufferModalDone: { marginTop: hp(2), paddingVertical: hp(1.5), alignItems: 'center' },
  calendarText: { marginHorizontal: wp(4), marginTop: hp(2), color: '#A1A1A6', fontSize: RFValue(13) },
  calendarStrong: { color: '#FFFFFF', fontWeight: '600' },
});
