import React, { useMemo, useRef, useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  StyleSheet,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { wp, hp, ms, vs } from '../utils/responsive';
import { RFValue } from 'react-native-responsive-fontsize';
import { highlightColors } from '../theme';

const MIN_STEP = 5;
const MAX_MINUTES = 6 * 60;

function buildMinuteOptions(maxMinutes: number, step: number) {
  const out: { value: number; label: string }[] = [];
  for (let m = 0; m <= maxMinutes; m += step) {
    out.push({ value: m, label: formatDuration(m) });
  }
  return out;
}

function formatDuration(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m} mins`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

type WheelOption = { value: number; label: string };

type WheelPickerProps = {
  value: number;
  options: WheelOption[];
  onChange: (value: number) => void;
};

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const WheelPicker = memo(function WheelPicker({ value, options, onChange }: WheelPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((o) => o.value === value);
    return idx >= 0 ? idx : 0;
  }, [options, value]);

  const padded = useMemo(() => {
    const padCount = Math.floor(VISIBLE_ITEMS / 2);
    const pad: WheelOption[] = Array.from({ length: padCount }, (_, i) => ({
      value: -100000 - i,
      label: '',
    }));
    return [...pad, ...options, ...pad];
  }, [options]);

  const paddedIndex = selectedIndex + Math.floor(VISIBLE_ITEMS / 2);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: paddedIndex * ITEM_HEIGHT,
        animated: false,
      });
    });
  }, [paddedIndex]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const rawIndex = Math.round(y / ITEM_HEIGHT);
    const pad = Math.floor(VISIBLE_ITEMS / 2);
    const optionIndex = rawIndex - pad;
    const clamped = Math.max(0, Math.min(options.length - 1, optionIndex));
    const next = options[clamped]?.value ?? 0;
    scrollRef.current?.scrollTo({
      y: (clamped + pad) * ITEM_HEIGHT,
      animated: true,
    });
    if (next !== value) onChange(next);
  };

  return (
    <View style={styles.wheelWrap}>
      <View pointerEvents="none" style={styles.wheelCenterHighlight} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        style={{ height: WHEEL_HEIGHT }}
        contentContainerStyle={{ paddingVertical: 0 }}
        nestedScrollEnabled
      >
        {padded.map((item, index) => {
          const isCenter = index === paddedIndex;
          return (
            <View key={index} style={[styles.wheelItem, { height: ITEM_HEIGHT }]}>
              <Text style={[styles.wheelText, isCenter ? styles.wheelTextActive : styles.wheelTextInactive]}>{item.label}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
});

type TimeWheelCardProps = {
  label: string;
  value: number;
  options: WheelOption[];
  onChange: (v: number) => void;
  helperText?: string;
  rightAccessory?: React.ReactNode;
};

function TimeWheelCard({ label, value, options, onChange, helperText, rightAccessory }: TimeWheelCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardLabel}>{label}</Text>
        {rightAccessory ?? null}
      </View>
      <WheelPicker value={value} options={options} onChange={onChange} />
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

type TimelineBarProps = {
  start: number;
  processing: number;
  end: number;
  bufferAfter: number;
  processingEnabled: boolean;
  processingBlocks: boolean;
};

function TimelineBar({
  start,
  processing,
  end,
  bufferAfter,
  processingEnabled,
  processingBlocks,
}: TimelineBarProps) {
  const total = start + (processingEnabled ? processing : 0) + end + bufferAfter;
  const safeTotal = Math.max(1, total);
  const startPct = (start / safeTotal) * 100;
  const procPct = ((processingEnabled ? processing : 0) / safeTotal) * 100;
  const endPct = (end / safeTotal) * 100;
  const bufPct = (bufferAfter / safeTotal) * 100;

  return (
    <View style={styles.timelineOuter}>
      <View style={styles.timelineTrack}>
        <View style={[styles.seg, { flexBasis: `${startPct}%`, backgroundColor: highlightColors.neonPink }]} />
        {processingEnabled && processing > 0 ? (
          <View
            style={[
              styles.seg,
              {
                flexBasis: `${procPct}%`,
                backgroundColor: processingBlocks ? highlightColors.neonBlue : '#3A3A3C',
              },
            ]}
          />
        ) : null}
        <View style={[styles.seg, { flexBasis: `${endPct}%`, backgroundColor: highlightColors.neonBlue }]} />
        {bufferAfter > 0 ? (
          <View style={[styles.seg, { flexBasis: `${bufPct}%`, backgroundColor: '#1A1A1A' }]} />
        ) : null}
      </View>
      <View style={styles.timelineLegendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: highlightColors.neonPink }]} />
          <Text style={styles.legendText}>Start</Text>
        </View>
        {processingEnabled ? (
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: processingBlocks ? highlightColors.neonBlue : '#3A3A3C' },
              ]}
            />
            <Text style={styles.legendText}>Processing</Text>
          </View>
        ) : null}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: highlightColors.neonBlue }]} />
          <Text style={styles.legendText}>End</Text>
        </View>
        {bufferAfter > 0 ? (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#1A1A1A' }]} />
            <Text style={styles.legendText}>Buffer</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export interface DurationValues {
  startMin: number;
  processingEnabled: boolean;
  processingMin: number;
  processingBlocks: boolean;
  endMin: number;
  bufferEnabled: boolean;
  bufferMin: number;
}

export interface DurationSetupSectionProps {
  values: DurationValues;
  onChange: (values: DurationValues) => void;
}

export function DurationSetupSection({ values, onChange }: DurationSetupSectionProps) {
  const options = useMemo(() => buildMinuteOptions(MAX_MINUTES, MIN_STEP), []);

  const update = (patch: Partial<DurationValues>) => {
    onChange({ ...values, ...patch });
  };

  const clientDuration = values.startMin + (values.processingEnabled ? values.processingMin : 0) + values.endMin;
  const calendarDuration = clientDuration + (values.bufferEnabled ? values.bufferMin : 0);

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Add Processing Time</Text>
        <Switch
          value={values.processingEnabled}
          onValueChange={(v) => update({ processingEnabled: v })}
          trackColor={{ false: '#1F1F1F', true: highlightColors.neonPink }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.divider} />

      <TimeWheelCard
        label="START"
        value={values.startMin}
        options={options}
        onChange={(v) => update({ startMin: v })}
      />

      {values.processingEnabled ? (
        <TimeWheelCard
          label="PROCESSING"
          value={values.processingMin}
          options={options}
          onChange={(v) => update({ processingMin: v })}
          helperText="Stylist available during this time"
          rightAccessory={
            <View style={styles.inlineToggle}>
              <Text style={styles.inlineToggleText}>Blocks Stylist</Text>
              <Switch
                value={values.processingBlocks}
                onValueChange={(v) => update({ processingBlocks: v })}
                trackColor={{ false: '#1F1F1F', true: highlightColors.neonPink }}
                thumbColor="#FFFFFF"
              />
            </View>
          }
        />
      ) : null}

      <TimeWheelCard label="END" value={values.endMin} options={options} onChange={(v) => update({ endMin: v })} />

      <View style={styles.summary}>
        <Text style={styles.totalText}>TOTAL: {formatDuration(clientDuration)}</Text>
        <TimelineBar
          start={values.startMin}
          processing={values.processingMin}
          end={values.endMin}
          bufferAfter={values.bufferEnabled ? values.bufferMin : 0}
          processingEnabled={values.processingEnabled}
          processingBlocks={values.processingBlocks}
        />
        <Text style={styles.calendarText}>
          Calendar block: <Text style={styles.calendarTextStrong}>{formatDuration(calendarDuration)}</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={[styles.row, { paddingTop: hp(1.5) }]}>
        <Text style={styles.rowLabel}>Block Time After</Text>
        <Switch
          value={values.bufferEnabled}
          onValueChange={(v) => update({ bufferEnabled: v })}
          trackColor={{ false: '#1F1F1F', true: highlightColors.neonPink }}
          thumbColor="#FFFFFF"
        />
      </View>

      <Text style={styles.blockHelper}>
        Block time to clean, checkout, travel, etc. Hidden from clients. Blocks stylist calendar.
      </Text>

      {values.bufferEnabled ? (
        <View style={styles.bufferCardWrap}>
          <TimeWheelCard
            label="BUFFER AFTER"
            value={values.bufferMin}
            options={options}
            onChange={(v) => update({ bufferMin: v })}
            helperText="Hidden buffer (blocks stylist)"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 0 },
  row: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { color: '#FFFFFF', fontSize: RFValue(17), fontWeight: '400' },
  divider: { height: 1, backgroundColor: '#1F1F1F', marginHorizontal: wp(4), marginVertical: hp(1) },
  card: {
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    padding: wp(4),
    backgroundColor: '#121212',
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.2),
    gap: ms(12),
  },
  cardLabel: { color: '#A1A1A6', fontSize: RFValue(12), fontWeight: '600', letterSpacing: 1.2 },
  helperText: { marginTop: hp(1), color: '#A1A1A6', fontSize: RFValue(13), lineHeight: ms(18) },
  inlineToggle: { flexDirection: 'row', alignItems: 'center', gap: ms(10) },
  inlineToggleText: { color: '#A1A1A6', fontSize: RFValue(13) },
  wheelWrap: {
    height: WHEEL_HEIGHT,
    borderRadius: ms(14),
    overflow: 'hidden',
    position: 'relative',
  },
  wheelCenterHighlight: {
    position: 'absolute',
    top: (WHEEL_HEIGHT - ITEM_HEIGHT) / 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: '#1C1C1E',
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#2C2C2E',
    zIndex: 2,
  },
  wheelItem: { justifyContent: 'center', alignItems: 'center' },
  wheelText: { textAlign: 'center' },
  wheelTextActive: { color: '#FFFFFF', fontSize: RFValue(20), fontWeight: '600' },
  wheelTextInactive: { color: 'rgba(255,255,255,0.45)', fontSize: RFValue(18), fontWeight: '400' },
  summary: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(1.5),
  },
  totalText: { color: '#FFFFFF', fontSize: RFValue(18), fontWeight: '600' },
  calendarText: { marginTop: hp(1.5), color: '#A1A1A6', fontSize: RFValue(13) },
  calendarTextStrong: { color: '#FFFFFF', fontWeight: '600' },
  timelineOuter: { marginTop: hp(1.5) },
  timelineTrack: {
    height: vs(12),
    borderRadius: ms(6),
    backgroundColor: '#1C1C1E',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  seg: { height: '100%' },
  timelineLegendRow: { marginTop: hp(1.2), flexDirection: 'row', flexWrap: 'wrap', gap: ms(12) },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: ms(6) },
  legendDot: { width: ms(10), height: ms(10), borderRadius: ms(5) },
  legendText: { color: '#A1A1A6', fontSize: RFValue(12) },
  blockHelper: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(1),
    color: '#A1A1A6',
    fontSize: RFValue(13),
    lineHeight: ms(18),
  },
  bufferCardWrap: { paddingHorizontal: wp(4), paddingTop: hp(1.5) },
});
