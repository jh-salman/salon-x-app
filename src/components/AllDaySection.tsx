import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Dimensions } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { RFValue } from 'react-native-responsive-fontsize';
import Svg, { Rect } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { format } from 'date-fns';
import { colors } from '../theme';

const ORB_SIZE = 24;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLACEMENT_LINE_MARGIN = 24;

const MULTIPLE_THRESHOLD = 2;
const SLOT_HEIGHT = 56;
const SLOT_MINUTE_GRANULARITY = 5;

function snapMinutesTo5(min: number): number {
  return Math.min(55, Math.round(min / SLOT_MINUTE_GRANULARITY) * SLOT_MINUTE_GRANULARITY);
}

interface AllDayEvent {
  id: string;
  title: string;
  color?: string;
  isParked?: boolean;
}

export interface ParkZoneBounds {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface CalendarLayout {
  top: number;
  scrollY: number;
}

interface AllDaySectionProps {
  events: AllDayEvent[];
  selectedDate: Date;
  onParkZoneMeasured?: (bounds: ParkZoneBounds) => void;
  highlighted?: boolean;
  parkZone?: ParkZoneBounds | null;
  calendarLayout?: CalendarLayout | null;
  onUnparkToSlot?: (id: string, newStart: Date, newEnd: Date) => void;
}

function PillContent({ ev, isPark }: { ev: AllDayEvent; isPark: boolean }) {
  const pillWidth = Math.max(88, Math.min(110, ev.title.length * 8 + 24));
  const PILL_H = 22;
  const PILL_R = 8;
  const fillColor = isPark ? colors.event.green : '#B87333';
  return (
    <View style={[styles.pillWrap, { minWidth: moderateScale(pillWidth), height: verticalScale(PILL_H) }]}>
      <Svg width={moderateScale(pillWidth)} height={verticalScale(PILL_H)} viewBox={`0 0 ${pillWidth} ${PILL_H}`} fill="none" style={styles.pillSvg}>
        <Rect
          x={0}
          y={0}
          width={pillWidth}
          height={PILL_H}
          rx={PILL_R}
          ry={PILL_R}
          fill={fillColor}
          fillOpacity={isPark ? 0.4 : 0.35}
          stroke={fillColor}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.pillContent]}>
        {isPark ? (
          <View style={[styles.verticalBar, { backgroundColor: colors.event.green }]} />
        ) : (
          <View style={[styles.circleDot, { backgroundColor: '#B87333' }]} />
        )}
        <Text style={styles.pillText} numberOfLines={1}>
          {ev.title}
        </Text>
      </View>
    </View>
  );
}

function DraggablePill({
  ev,
  isPark,
  calendarLayout,
  parkBottom,
  selectedDate,
  onUnparkToSlot,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  ev: AllDayEvent;
  isPark: boolean;
  calendarLayout: CalendarLayout | null;
  parkBottom: number;
  selectedDate: Date;
  onUnparkToSlot?: (id: string, newStart: Date, newEnd: Date) => void;
  onDragStart?: (title: string) => void;
  onDragMove?: (x: number, y: number, dropPreview: { dropTime: string; lineY: number } | null) => void;
  onDragEnd?: () => void;
}) {
  const longPressFiredRef = useRef(false);

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      longPressFiredRef.current = true;
      onDragStart?.(ev.title);
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (!longPressFiredRef.current) return;
      const x = e.absoluteX;
      const y = e.absoluteY;
      let dropPreview: { dropTime: string; lineY: number } | null = null;
      if (calendarLayout && y >= parkBottom && y >= calendarLayout.top - 20) {
        const offsetFromTop = y - calendarLayout.top + calendarLayout.scrollY;
        const slotIndex = Math.max(0, Math.floor(offsetFromTop / SLOT_HEIGHT));
        const minutesInSlot = ((offsetFromTop % SLOT_HEIGHT) / SLOT_HEIGHT) * 60;
        const hour = 8 + slotIndex;
        const newStart = new Date(selectedDate);
        newStart.setHours(hour, snapMinutesTo5(minutesInSlot), 0, 0);
        const lineY = calendarLayout.top - calendarLayout.scrollY + slotIndex * SLOT_HEIGHT + (snapMinutesTo5(minutesInSlot) / 60) * SLOT_HEIGHT;
        dropPreview = { dropTime: format(newStart, 'h:mm a'), lineY };
      }
      onDragMove?.(x, y, dropPreview);
    })
    .onEnd((e) => {
      if (longPressFiredRef.current) {
        longPressFiredRef.current = false;
        onDragEnd?.();
        const dropY = e.absoluteY;
        if (calendarLayout && onUnparkToSlot && dropY >= parkBottom && dropY >= calendarLayout.top - 20) {
          const offsetFromTop = dropY - calendarLayout.top + calendarLayout.scrollY;
          const slotIndex = Math.max(0, Math.floor(offsetFromTop / SLOT_HEIGHT));
          const minutesInSlot = ((offsetFromTop % SLOT_HEIGHT) / SLOT_HEIGHT) * 60;
          const hour = 8 + slotIndex;
          const newStart = new Date(selectedDate);
          newStart.setHours(hour, snapMinutesTo5(minutesInSlot), 0, 0);
          const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
          onUnparkToSlot(ev.id, newStart, newEnd);
        }
      }
    });

  const composed = Gesture.Simultaneous(longPress, pan);

  return (
    <GestureDetector gesture={composed}>
      <View>
        <PillContent ev={ev} isPark={isPark} />
      </View>
    </GestureDetector>
  );
}

function NumberedButton({
  label,
  count,
  isPark,
  onPress,
}: {
  label: string;
  count: number;
  isPark: boolean;
  onPress: () => void;
}) {
  const fillColor = isPark ? colors.event.green : '#B87333';
  const w = 80;
  const h = 22;
  const r = 8;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <View style={[styles.pillWrap, { minWidth: moderateScale(w), height: verticalScale(h) }]}>
        <Svg width={moderateScale(w)} height={verticalScale(h)} viewBox={`0 0 ${w} ${h}`} fill="none" style={styles.pillSvg}>
          <Rect x={0} y={0} width={w} height={h} rx={r} ry={r} fill={fillColor} fillOpacity={isPark ? 0.4 : 0.35} stroke={fillColor} />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, styles.pillContent]}>
          {isPark ? (
            <View style={[styles.verticalBar, { backgroundColor: colors.event.green }]} />
          ) : (
            <View style={[styles.circleDot, { backgroundColor: '#B87333' }]} />
          )}
          <Text style={styles.pillText}>
            {label} ({count})
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function DraggableExpandedItem({
  ev,
  isPark,
  calendarLayout,
  parkBottom,
  selectedDate,
  onUnparkToSlot,
  onDragStart,
  onDragMove,
  onDragEnd,
  onCloseModal,
}: {
  ev: AllDayEvent;
  isPark: boolean;
  calendarLayout: CalendarLayout | null;
  parkBottom: number;
  selectedDate: Date;
  onUnparkToSlot?: (id: string, newStart: Date, newEnd: Date) => void;
  onDragStart?: (title: string) => void;
  onDragMove?: (x: number, y: number, dropPreview: { dropTime: string; lineY: number } | null) => void;
  onDragEnd?: () => void;
  onCloseModal?: () => void;
}) {
  const longPressFiredRef = useRef(false);

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      longPressFiredRef.current = true;
      onDragStart?.(ev.title);
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (!longPressFiredRef.current) return;
      const x = e.absoluteX;
      const y = e.absoluteY;
      let dropPreview: { dropTime: string; lineY: number } | null = null;
      if (calendarLayout && y >= parkBottom && y >= calendarLayout.top - 20) {
        const offsetFromTop = y - calendarLayout.top + calendarLayout.scrollY;
        const slotIndex = Math.max(0, Math.floor(offsetFromTop / SLOT_HEIGHT));
        const minutesInSlot = ((offsetFromTop % SLOT_HEIGHT) / SLOT_HEIGHT) * 60;
        const hour = 8 + slotIndex;
        const newStart = new Date(selectedDate);
        newStart.setHours(hour, snapMinutesTo5(minutesInSlot), 0, 0);
        const lineY = calendarLayout.top - calendarLayout.scrollY + slotIndex * SLOT_HEIGHT + (snapMinutesTo5(minutesInSlot) / 60) * SLOT_HEIGHT;
        dropPreview = { dropTime: format(newStart, 'h:mm a'), lineY };
      }
      onDragMove?.(x, y, dropPreview);
    })
    .onEnd((e) => {
      if (longPressFiredRef.current) {
        longPressFiredRef.current = false;
        onDragEnd?.();
        const dropY = e.absoluteY;
        if (calendarLayout && onUnparkToSlot) {
          if (dropY >= parkBottom && dropY >= calendarLayout.top - 20) {
            const offsetFromTop = dropY - calendarLayout.top + calendarLayout.scrollY;
            const slotIndex = Math.max(0, Math.floor(offsetFromTop / SLOT_HEIGHT));
            const minutesInSlot = ((offsetFromTop % SLOT_HEIGHT) / SLOT_HEIGHT) * 60;
            const hour = 8 + slotIndex;
            const newStart = new Date(selectedDate);
            newStart.setHours(hour, snapMinutesTo5(minutesInSlot), 0, 0);
            const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
            onUnparkToSlot(ev.id, newStart, newEnd);
            onCloseModal?.();
          }
        }
      }
    });

  const composed = Gesture.Simultaneous(longPress, pan);

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.expandedItem}>
        <View style={[styles.verticalBar, isPark ? { backgroundColor: colors.event.green } : { backgroundColor: '#B87333' }]} />
        <Text style={styles.expandedItemText} numberOfLines={1}>{ev.title}</Text>
      </View>
    </GestureDetector>
  );
}

export function AllDaySection({
  events,
  selectedDate,
  onParkZoneMeasured,
  highlighted,
  parkZone = null,
  calendarLayout = null,
  onUnparkToSlot,
}: AllDaySectionProps) {
  const containerRef = useRef<View>(null);
  const [expandedParked, setExpandedParked] = useState(false);
  const [expandedWaiting, setExpandedWaiting] = useState(false);
  const [dragGhost, setDragGhost] = useState<{
    x: number;
    y: number;
    title: string;
    dropTime?: string;
    lineY?: number;
  } | null>(null);

  const parked = events.filter((e) => e.isParked === true);
  const waiting = events.filter((e) => !e.isParked);

  const handleLayout = () => {
    containerRef.current?.measureInWindow((x, y, w, h) => {
      onParkZoneMeasured?.({ top: y, bottom: y + h, left: x, right: x + w });
    });
  };

  const containerStyle = [
    styles.container,
    highlighted && {
      borderWidth: 2,
      borderColor: '#FF7701',
      shadowColor: '#FF7701',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 8,
    },
  ];

  return (
    <>
      <View ref={containerRef} style={containerStyle} onLayout={handleLayout}>
        {(parked.length > 0 || waiting.length > 0) && (
          <View style={styles.eventsRow}>
            {parked.length > 0 && (
              <View style={styles.buttonGroup}>
                {parked.length >= MULTIPLE_THRESHOLD ? (
                  <NumberedButton label="Parked" count={parked.length} isPark onPress={() => setExpandedParked(true)} />
                ) : (
                  parked.map((ev) =>
                    onUnparkToSlot ? (
                      <DraggablePill
                        key={ev.id}
                        ev={ev}
                        isPark
                        calendarLayout={calendarLayout}
                        parkBottom={parkZone?.bottom ?? 200}
                        selectedDate={selectedDate}
                        onUnparkToSlot={onUnparkToSlot}
                        onDragStart={(title) => setDragGhost({ x: 0, y: 0, title })}
                        onDragMove={(x, y, dropPreview) => setDragGhost((p) => (p ? { ...p, x, y, dropTime: dropPreview?.dropTime, lineY: dropPreview?.lineY } : null))}
                        onDragEnd={() => setDragGhost(null)}
                      />
                    ) : (
                      <PillContent key={ev.id} ev={ev} isPark />
                    )
                  )
                )}
              </View>
            )}
            {waiting.length > 0 && (
              <View style={styles.buttonGroup}>
                {waiting.length >= MULTIPLE_THRESHOLD ? (
                  <NumberedButton label="Waiting" count={waiting.length} isPark={false} onPress={() => setExpandedWaiting(true)} />
                ) : (
                  waiting.map((ev) =>
                    onUnparkToSlot ? (
                      <DraggablePill
                        key={ev.id}
                        ev={ev}
                        isPark={false}
                        calendarLayout={calendarLayout}
                        parkBottom={parkZone?.bottom ?? 200}
                        selectedDate={selectedDate}
                        onUnparkToSlot={onUnparkToSlot}
                        onDragStart={(title) => setDragGhost({ x: 0, y: 0, title })}
                        onDragMove={(x, y, dropPreview) => setDragGhost((p) => (p ? { ...p, x, y, dropTime: dropPreview?.dropTime, lineY: dropPreview?.lineY } : null))}
                        onDragEnd={() => setDragGhost(null)}
                      />
                    ) : (
                      <PillContent key={ev.id} ev={ev} isPark={false} />
                    )
                  )
                )}
              </View>
            )}
          </View>
        )}
      </View>

      <Modal
        visible={expandedParked || expandedWaiting}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setExpandedParked(false);
          setExpandedWaiting(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setExpandedParked(false);
            setExpandedWaiting(false);
          }}
        >
          <View style={styles.expandedPanel} onStartShouldSetResponder={() => true}>
            <Text style={styles.expandedTitle}>{expandedParked ? 'Parked' : 'Waiting List'}</Text>
            <Text style={styles.expandedHint}>Long-press and drag to calendar</Text>
            <ScrollView style={styles.expandedScroll} keyboardShouldPersistTaps="handled">
              {(expandedParked ? parked : waiting).map((ev) => (
                <DraggableExpandedItem
                  key={ev.id}
                  ev={ev}
                  isPark={expandedParked}
                  calendarLayout={calendarLayout}
                  parkBottom={parkZone?.bottom ?? 200}
                  selectedDate={selectedDate}
                  onUnparkToSlot={onUnparkToSlot}
                  onCloseModal={() => {
                    setExpandedParked(false);
                    setExpandedWaiting(false);
                  }}
                  onDragStart={(title) => setDragGhost({ x: 0, y: 0, title })}
                  onDragMove={(x, y, dropPreview) => setDragGhost((p) => (p ? { ...p, x, y, dropTime: dropPreview?.dropTime, lineY: dropPreview?.lineY } : null))}
                  onDragEnd={() => setDragGhost(null)}
                />
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {dragGhost && (
        <Modal visible transparent animationType="none" statusBarTranslucent>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {typeof dragGhost.lineY === 'number' && (
              <View
                style={[
                  styles.placementLine,
                  {
                    top: dragGhost.lineY,
                    left: PLACEMENT_LINE_MARGIN,
                    width: SCREEN_WIDTH - PLACEMENT_LINE_MARGIN * 2,
                  },
                ]}
              />
            )}
            <View
              style={[
                styles.orb,
                {
                  left: dragGhost.x - ORB_SIZE / 2,
                  top: dragGhost.y - ORB_SIZE / 2,
                },
              ]}
            />
            {dragGhost.dropTime && (
              <View
                style={[
                  styles.timeLabel,
                  {
                    left: dragGhost.x + ORB_SIZE / 2 + 8,
                    top: dragGhost.y - 10,
                  },
                ]}
              >
                <Text style={styles.timeLabelText}>{dragGhost.dropTime}</Text>
              </View>
            )}
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: verticalScale(32),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    backgroundColor: 'rgba(17, 17, 17, 0.07)',
  },
  eventsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  pillWrap: {
    position: 'relative',
    minWidth: moderateScale(88),
  },
  pillSvg: {
    position: 'absolute',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: moderateScale(12),
    gap: moderateScale(8),
  },
  circleDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  verticalBar: {
    width: moderateScale(3),
    height: verticalScale(16),
    borderRadius: 2,
  },
  pillText: {
    fontSize: RFValue(8),
    color: colors.text.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: moderateScale(60),
    paddingHorizontal: moderateScale(16),
  },
  expandedPanel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: moderateScale(16),
    maxHeight: '60%',
  },
  expandedTitle: {
    fontSize: RFValue(16),
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: moderateScale(4),
  },
  expandedHint: {
    fontSize: RFValue(10),
    color: colors.text.secondary || '#999',
    marginBottom: moderateScale(12),
  },
  expandedScroll: {
    maxHeight: verticalScale(240),
  },
  expandedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(12),
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: moderateScale(8),
    gap: moderateScale(8),
  },
  expandedItemText: {
    fontSize: RFValue(12),
    color: colors.text.primary,
    flex: 1,
  },
  placementLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.highlight.neonPink,
    zIndex: 9998,
  },
  orb: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: colors.highlight.neonPink,
    zIndex: 10000,
  },
  timeLabel: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    zIndex: 10001,
  },
  timeLabelText: {
    fontSize: RFValue(12),
    fontWeight: '700',
    color: '#fff',
  },
});
