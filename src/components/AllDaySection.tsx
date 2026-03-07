import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ms, vs } from '../utils/responsive';
import { RFValue } from 'react-native-responsive-fontsize';
import Svg, { Rect } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { format } from 'date-fns';
import { colors } from '../theme';
import { haptics } from '../utils/haptics';

const ORB_SIZE = 24;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PLACEMENT_LINE_MARGIN = 24;

const MULTIPLE_THRESHOLD = 2;
const SLOT_HEIGHT = 56;
const SLOT_MINUTE_GRANULARITY = 5;
/** Must match CalendarMiddleSection so drop position aligns with calendar y-axis */
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 23;

function snapMinutesTo5(min: number): number {
  return Math.min(55, Math.round(min / SLOT_MINUTE_GRANULARITY) * SLOT_MINUTE_GRANULARITY);
}

interface AllDayEvent {
  id: string;
  title: string;
  color?: string;
  isParked?: boolean;
  /** When added to waitlist (ms or Date); used for chronological order and display */
  waitlistAddedAt?: number | Date;
  /** What appointment/service they're waiting for (e.g. Color, Cut, Perm, Highlights) */
  service?: string;
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
  /** Called during unpark drag with finger screenY so calendar can auto-scroll near edges */
  onUnparkDragPosition?: (screenY: number) => void;
  /** Called when unpark drag ends so calendar can stop auto-scroll */
  onUnparkDragEnd?: () => void;
  /** When set, parent (e.g. CalendarMiddleSection) shows the same pointer/placement UI as move; pass ghost or null */
  onUnparkDragGhost?: (ghost: UnparkDragGhost | null) => void;
}

export type UnparkDragGhost = { x: number; y: number; lineY?: number; dropTime?: string };

function getWaitlistTime(ev: AllDayEvent): number {
  const t = ev.waitlistAddedAt;
  if (t == null) return 0;
  return typeof t === 'number' ? t : t.getTime();
}

function PillContent({ ev, isPark }: { ev: AllDayEvent; isPark: boolean }) {
  const showTimestamp = !isPark && ev.waitlistAddedAt != null;
  const showService = !isPark && ev.service;
  const ts = ev.waitlistAddedAt != null ? (typeof ev.waitlistAddedAt === 'number' ? new Date(ev.waitlistAddedAt) : ev.waitlistAddedAt) : null;
  const pillWidth = Math.max(88, Math.min(170, ev.title.length * 8 + (showTimestamp ? 52 : 24) + (showService ? (ev.service?.length ?? 0) * 4 : 0)));
  const PILL_H = showService ? 28 : 22;
  const PILL_R = 8;
  const fillColor = isPark ? colors.parked.background : '#9DE684';
  const strokeColor = isPark ? colors.parked.border : '#9DE684';
  return (
    <View style={[styles.pillWrap, { minWidth: ms(pillWidth), height: vs(PILL_H) }]}>
      <Svg width={ms(pillWidth)} height={vs(PILL_H)} viewBox={`0 0 ${pillWidth} ${PILL_H}`} fill="none" style={styles.pillSvg}>
        <Rect
          x={0}
          y={0}
          width={pillWidth}
          height={PILL_H}
          rx={PILL_R}
          ry={PILL_R}
          fill={fillColor}
          fillOpacity={isPark ? 1 : 0.35}
          stroke={strokeColor}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.pillContent]}>
        {isPark ? (
          <View style={[styles.verticalBar, { backgroundColor: colors.parked.border }]} />
        ) : (
          <View style={[styles.circleDot, { backgroundColor: '#9DE684' }]} />
        )}
        <View style={styles.pillTextCol}>
          <View style={styles.pillTextRow}>
            <Text style={styles.pillText} numberOfLines={1}>
              {ev.title}
            </Text>
            {showTimestamp && ts && (
              <Text style={styles.pillTimestamp} numberOfLines={1}>{format(ts, 'M/d  HH:mm')}</Text>
            )}
          </View>
          {showService && (
            <Text style={styles.pillService} numberOfLines={1}>{ev.service}</Text>
          )}
        </View>
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
  onUnparkDragPosition,
  onUnparkDragEnd,
}: {
  ev: AllDayEvent;
  isPark: boolean;
  calendarLayout: CalendarLayout | null;
  parkBottom: number;
  selectedDate: Date;
  onUnparkToSlot?: (id: string, newStart: Date, newEnd: Date) => void;
  onDragStart?: (title: string, x?: number, y?: number) => void;
  onDragMove?: (x: number, y: number, dropPreview: { dropTime: string; lineY: number } | null) => void;
  onDragEnd?: () => void;
  onUnparkDragPosition?: (screenY: number) => void;
  onUnparkDragEnd?: () => void;
}) {
  const longPressFiredRef = useRef(false);
  const viewRef = useRef<View>(null);

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .runOnJS(true)
    .onStart(() => {
      longPressFiredRef.current = true;
      haptics.medium();
      viewRef.current?.measureInWindow((wx, wy, w, h) => {
        onDragStart?.(ev.title, wx + w / 2, wy + h / 2);
      });
    });

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      if (!longPressFiredRef.current) return;
      const x = e.absoluteX;
      const y = e.absoluteY;
      let dropPreview: { dropTime: string; lineY: number } | null = null;
      if (calendarLayout && y >= parkBottom && y >= calendarLayout.top - 20) {
        const offsetFromTop = y - calendarLayout.top + calendarLayout.scrollY;
        const slotIndex = Math.max(0, Math.floor(offsetFromTop / SLOT_HEIGHT));
        const minutesInSlot = ((offsetFromTop % SLOT_HEIGHT) / SLOT_HEIGHT) * 60;
        const hour = Math.min(DAY_END_HOUR, DAY_START_HOUR + slotIndex);
        const newStart = new Date(selectedDate);
        newStart.setHours(hour, snapMinutesTo5(minutesInSlot), 0, 0);
        const clampedSlotIndex = hour - DAY_START_HOUR;
        const lineY = calendarLayout.top - calendarLayout.scrollY + clampedSlotIndex * SLOT_HEIGHT + (snapMinutesTo5(minutesInSlot) / 60) * SLOT_HEIGHT;
        dropPreview = { dropTime: format(newStart, 'h:mm a'), lineY };
      }
      onDragMove?.(x, y, dropPreview);
      onUnparkDragPosition?.(y);
    })
    .onEnd((e) => {
      if (longPressFiredRef.current) {
        longPressFiredRef.current = false;
        onUnparkDragEnd?.();
        onDragEnd?.();
        const dropY = e.absoluteY;
        if (calendarLayout && onUnparkToSlot && dropY >= parkBottom && dropY >= calendarLayout.top - 20) {
          const offsetFromTop = dropY - calendarLayout.top + calendarLayout.scrollY;
          const slotIndex = Math.max(0, Math.floor(offsetFromTop / SLOT_HEIGHT));
          const minutesInSlot = ((offsetFromTop % SLOT_HEIGHT) / SLOT_HEIGHT) * 60;
          const hour = Math.min(DAY_END_HOUR, DAY_START_HOUR + slotIndex);
          const newStart = new Date(selectedDate);
          newStart.setHours(hour, snapMinutesTo5(minutesInSlot), 0, 0);
          let newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
          const endOfLastSlot = new Date(selectedDate);
          endOfLastSlot.setHours(DAY_END_HOUR, 59, 59, 999);
          if (newEnd.getTime() > endOfLastSlot.getTime()) newEnd = endOfLastSlot;
          onUnparkToSlot(ev.id, newStart, newEnd);
        }
      }
    });

  const composed = Gesture.Simultaneous(longPress, pan);

  return (
    <GestureDetector gesture={composed}>
      <View ref={viewRef}>
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
  const fillColor = isPark ? colors.parked.background : '#9DE684';
  const strokeColor = isPark ? colors.parked.border : '#9DE684';
  const w = 80;
  const h = 22;
  const r = 8;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <View style={[styles.pillWrap, { minWidth: ms(w), height: vs(h) }]}>
        <Svg width={ms(w)} height={vs(h)} viewBox={`0 0 ${w} ${h}`} fill="none" style={styles.pillSvg}>
          <Rect x={0} y={0} width={w} height={h} rx={r} ry={r} fill={fillColor} fillOpacity={isPark ? 1 : 0.35} stroke={strokeColor} />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, styles.pillContent]}>
          {isPark ? (
            <View style={[styles.verticalBar, { backgroundColor: colors.parked.border }]} />
          ) : (
            <View style={[styles.circleDot, { backgroundColor: '#9DE684' }]} />
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
  onDragStartFromExpanded,
  onDragCancelFromExpanded,
  onUnparkDragPosition,
  onUnparkDragEnd,
}: {
  ev: AllDayEvent;
  isPark: boolean;
  calendarLayout: CalendarLayout | null;
  parkBottom: number;
  selectedDate: Date;
  onUnparkToSlot?: (id: string, newStart: Date, newEnd: Date) => void;
  onDragStart?: (title: string, x?: number, y?: number) => void;
  onDragMove?: (x: number, y: number, dropPreview: { dropTime: string; lineY: number } | null) => void;
  onDragEnd?: () => void;
  onCloseModal?: () => void;
  /** When drag starts from expanded list, hide panel but keep mounted so gesture onEnd fires */
  onDragStartFromExpanded?: () => void;
  /** When drag ends outside calendar, popup will show again (via draggingFromExpanded false in onDragEnd) */
  onDragCancelFromExpanded?: (isPark: boolean) => void;
  onUnparkDragPosition?: (screenY: number) => void;
  onUnparkDragEnd?: () => void;
}) {
  const longPressFiredRef = useRef(false);
  const viewRef = useRef<View>(null);

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .runOnJS(true)
    .onStart(() => {
      longPressFiredRef.current = true;
      haptics.medium();
      onDragStartFromExpanded?.();
      viewRef.current?.measureInWindow((wx, wy, w, h) => {
        onDragStart?.(ev.title, wx + w / 2, wy + h / 2);
      });
    });

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      if (!longPressFiredRef.current) return;
      const x = e.absoluteX;
      const y = e.absoluteY;
      let dropPreview: { dropTime: string; lineY: number } | null = null;
      if (calendarLayout && y >= parkBottom && y >= calendarLayout.top - 20) {
        const offsetFromTop = y - calendarLayout.top + calendarLayout.scrollY;
        const slotIndex = Math.max(0, Math.floor(offsetFromTop / SLOT_HEIGHT));
        const minutesInSlot = ((offsetFromTop % SLOT_HEIGHT) / SLOT_HEIGHT) * 60;
        const hour = Math.min(DAY_END_HOUR, DAY_START_HOUR + slotIndex);
        const newStart = new Date(selectedDate);
        newStart.setHours(hour, snapMinutesTo5(minutesInSlot), 0, 0);
        const clampedSlotIndex = hour - DAY_START_HOUR;
        const lineY = calendarLayout.top - calendarLayout.scrollY + clampedSlotIndex * SLOT_HEIGHT + (snapMinutesTo5(minutesInSlot) / 60) * SLOT_HEIGHT;
        dropPreview = { dropTime: format(newStart, 'h:mm a'), lineY };
      }
      onDragMove?.(x, y, dropPreview);
      onUnparkDragPosition?.(y);
    })
    .onEnd((e) => {
      if (longPressFiredRef.current) {
        longPressFiredRef.current = false;
        onUnparkDragEnd?.();
        onDragEnd?.();
        const dropY = e.absoluteY;
        const droppedInCalendar = calendarLayout && onUnparkToSlot && dropY >= parkBottom && dropY >= calendarLayout.top - 20;
        if (droppedInCalendar) {
            const offsetFromTop = dropY - calendarLayout!.top + calendarLayout!.scrollY;
            const slotIndex = Math.max(0, Math.floor(offsetFromTop / SLOT_HEIGHT));
            const minutesInSlot = ((offsetFromTop % SLOT_HEIGHT) / SLOT_HEIGHT) * 60;
            const hour = Math.min(DAY_END_HOUR, DAY_START_HOUR + slotIndex);
            const newStart = new Date(selectedDate);
            newStart.setHours(hour, snapMinutesTo5(minutesInSlot), 0, 0);
            let newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
            const endOfLastSlot = new Date(selectedDate);
            endOfLastSlot.setHours(DAY_END_HOUR, 59, 59, 999);
            if (newEnd.getTime() > endOfLastSlot.getTime()) newEnd = endOfLastSlot;
            onUnparkToSlot(ev.id, newStart, newEnd);
            onCloseModal?.();
        } else {
          onDragCancelFromExpanded?.(isPark);
        }
      }
    });

  const composed = Gesture.Simultaneous(longPress, pan);

  const waitlistTime = !isPark && ev.waitlistAddedAt != null
    ? (typeof ev.waitlistAddedAt === 'number' ? new Date(ev.waitlistAddedAt) : ev.waitlistAddedAt)
    : null;

  if (!onUnparkToSlot) {
    return (
      <View style={styles.expandedItem}>
        <View style={[styles.verticalBar, isPark ? { backgroundColor: colors.parked.border } : { backgroundColor: '#9DE684' }]} />
        <View style={styles.expandedItemContent}>
          <View style={styles.expandedItemTextRow}>
            <Text style={styles.expandedItemText} numberOfLines={1}>{ev.title}</Text>
            {waitlistTime && (
              <Text style={styles.expandedItemTimestamp}>{format(waitlistTime, 'M/d  HH:mm')}</Text>
            )}
          </View>
          {!isPark && ev.service && (
            <Text style={styles.expandedItemService} numberOfLines={1}>Waiting for: {ev.service}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <GestureDetector gesture={composed}>
      <View ref={viewRef} style={styles.expandedItem}>
        <View style={[styles.verticalBar, isPark ? { backgroundColor: colors.parked.border } : { backgroundColor: '#9DE684' }]} />
        <View style={styles.expandedItemContent}>
          <View style={styles.expandedItemTextRow}>
            <Text style={styles.expandedItemText} numberOfLines={1}>{ev.title}</Text>
            {waitlistTime && (
              <Text style={styles.expandedItemTimestamp}>{format(waitlistTime, 'M/d  HH:mm')}</Text>
            )}
          </View>
          {!isPark && ev.service && (
            <Text style={styles.expandedItemService} numberOfLines={1}>Waiting for: {ev.service}</Text>
          )}
        </View>
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
  onUnparkDragPosition,
  onUnparkDragEnd,
  onUnparkDragGhost,
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
  const [draggingFromExpanded, setDraggingFromExpanded] = useState(false);
  const onUnparkDragGhostRef = useRef(onUnparkDragGhost);
  onUnparkDragGhostRef.current = onUnparkDragGhost;

  useEffect(() => {
    const notify = onUnparkDragGhostRef.current;
    if (!notify) return;
    if (!dragGhost) {
      notify(null);
      return;
    }
    notify({
      x: dragGhost.x,
      y: dragGhost.y,
      lineY: typeof dragGhost.lineY === 'number' ? dragGhost.lineY : undefined,
      dropTime: dragGhost.dropTime,
    });
  }, [dragGhost]);

  const parked = events.filter((e) => e.isParked === true);
  const waiting = events.filter((e) => !e.isParked);
  const waitingSorted = useMemo(
    () => [...waiting].sort((a, b) => getWaitlistTime(a) - getWaitlistTime(b)),
    [waiting]
  );

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
        {(parked.length > 0 || waitingSorted.length > 0) && (
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
                        onDragStart={(title, x, y) => setDragGhost({ x: x ?? 0, y: y ?? 0, title })}
                        onDragMove={(x, y, dropPreview) => setDragGhost((p) => (p ? { ...p, x, y, dropTime: dropPreview?.dropTime, lineY: dropPreview?.lineY } : null))}
                        onDragEnd={() => setDragGhost(null)}
                        onUnparkDragPosition={onUnparkDragPosition}
                        onUnparkDragEnd={onUnparkDragEnd}
                      />
                    ) : (
                      <PillContent key={ev.id} ev={ev} isPark />
                    )
                  )
                )}
              </View>
            )}
            {waitingSorted.length > 0 && (
              <View style={styles.buttonGroup}>
                {waitingSorted.length >= MULTIPLE_THRESHOLD ? (
                  <NumberedButton label="Waiting" count={waitingSorted.length} isPark={false} onPress={() => setExpandedWaiting(true)} />
                ) : (
                  waitingSorted.map((ev) =>
                    onUnparkToSlot ? (
                      <DraggablePill
                        key={ev.id}
                        ev={ev}
                        isPark={false}
                        calendarLayout={calendarLayout}
                        parkBottom={parkZone?.bottom ?? 200}
                        selectedDate={selectedDate}
                        onUnparkToSlot={onUnparkToSlot}
                        onDragStart={(title, x, y) => setDragGhost({ x: x ?? 0, y: y ?? 0, title })}
                        onDragMove={(x, y, dropPreview) => setDragGhost((p) => (p ? { ...p, x, y, dropTime: dropPreview?.dropTime, lineY: dropPreview?.lineY } : null))}
                        onDragEnd={() => setDragGhost(null)}
                        onUnparkDragPosition={onUnparkDragPosition}
                        onUnparkDragEnd={onUnparkDragEnd}
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

      {/* Expanded list modal – stay mounted during drag so gesture onEnd fires and drop works */}
      <Modal
        visible={expandedParked || expandedWaiting}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!draggingFromExpanded) {
            setExpandedParked(false);
            setExpandedWaiting(false);
          }
        }}
      >
        <Pressable
          style={[styles.modalOverlay, draggingFromExpanded && { opacity: 0, pointerEvents: 'none' as const }]}
          onPress={() => {
            if (!draggingFromExpanded) {
              setExpandedParked(false);
              setExpandedWaiting(false);
            }
          }}
        >
          <View
            style={[
              styles.expandedPanel,
              draggingFromExpanded && { opacity: 0, pointerEvents: 'none' as const },
            ]}
            onStartShouldSetResponder={() => !draggingFromExpanded}
          >
            <Text style={styles.expandedTitle}>{expandedParked ? 'Parked' : 'Waiting List'}</Text>
            {onUnparkToSlot ? (
              <Text style={styles.expandedHint}>Long-press and drag to calendar</Text>
            ) : (
              <Text style={styles.expandedHint}>Switch to Day view to move or place appointments</Text>
            )}
            <ScrollView style={styles.expandedScroll} keyboardShouldPersistTaps="handled">
              {(expandedParked ? parked : waitingSorted).map((ev) => (
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
                    setDraggingFromExpanded(false);
                  }}
                  onDragStartFromExpanded={() => setDraggingFromExpanded(true)}
                  onDragCancelFromExpanded={() => {}}
                  onDragStart={(title, x, y) => setDragGhost({ x: x ?? 0, y: y ?? 0, title })}
                  onDragMove={(x, y, dropPreview) => setDragGhost((p) => (p ? { ...p, x, y, dropTime: dropPreview?.dropTime, lineY: dropPreview?.lineY } : null))}
                  onDragEnd={() => {
                    setDragGhost(null);
                    setDraggingFromExpanded(false);
                  }}
                  onUnparkDragPosition={onUnparkDragPosition}
                  onUnparkDragEnd={onUnparkDragEnd}
                />
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Ghost Modal only when parent does not handle pointer (e.g. week view); day view uses calendar’s same pointer UI */}
      {dragGhost && !onUnparkDragGhost && (
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
    minHeight: vs(32),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(12),
    backgroundColor: 'rgba(17, 17, 17, 0.07)',
    marginTop: -vs(10),
  },
  eventsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    gap: ms(12),
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  pillWrap: {
    position: 'relative',
    minWidth: ms(88),
  },
  pillSvg: {
    position: 'absolute',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: ms(12),
    gap: ms(8),
  },
  circleDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },
  verticalBar: {
    width: ms(3),
    height: vs(16),
    borderRadius: 2,
  },
  pillTextCol: { flex: 1, minWidth: 0, justifyContent: 'center' },
  pillTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    minWidth: 0,
  },
  pillText: {
    fontSize: RFValue(8),
    color: colors.text.primary,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
  },
  pillTimestamp: {
    fontSize: RFValue(7),
    color: colors.text.secondary || '#999',
    fontWeight: '600',
  },
  pillService: {
    fontSize: RFValue(7),
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: ms(60),
    paddingHorizontal: ms(16),
  },
  expandedPanel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: ms(16),
    maxHeight: '60%',
  },
  expandedTitle: {
    fontSize: RFValue(16),
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: ms(4),
  },
  expandedHint: {
    fontSize: RFValue(10),
    color: colors.text.secondary || '#999',
    marginBottom: ms(12),
  },
  expandedScroll: {
    maxHeight: vs(240),
  },
  expandedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(10),
    paddingHorizontal: ms(12),
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: ms(8),
    gap: ms(8),
  },
  expandedItemContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
  },
  expandedItemTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(8),
    minWidth: 0,
  },
  expandedItemText: {
    fontSize: RFValue(12),
    color: colors.text.primary,
    flex: 1,
    minWidth: 0,
  },
  expandedItemTimestamp: {
    fontSize: RFValue(11),
    color: colors.text.secondary || '#999',
  },
  expandedItemService: {
    fontSize: RFValue(10),
    color: colors.text.secondary || '#999',
    fontWeight: '600',
    marginTop: 2,
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
