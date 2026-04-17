import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, isSameDay } from 'date-fns';
import { useEvents } from '../context/EventsContext';
import type { AppointmentStopwatchPersist } from '../data/types';
import type { Appointment, AppointmentTimerBadge } from '../components/StylistComponents/AppointmentsSection';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme';
import { MuseButton } from '../components/MuseButton';
import { StylistLayout, StylistRailCurve } from '../components/StylistComponents/StylistLayout';
import { MainBrandingCard } from '../components/StylistComponents/MainBrandingCard';
import { StylistSubBranding } from '../components/StylistComponents/StylistSubBranding';
import {
  AppointmentsSection,
  VIEWPORT_HEIGHT_FOR_5_CARDS,
} from '../components/StylistComponents/AppointmentsSection';
import { WaitlistSection } from '../components/StylistComponents/WaitlistSection';
import {
  WaitlistTitleCard,
  WAITLIST_TITLE_HEIGHT,
} from '../components/StylistComponents/WaitlistTitleCard';
import { NotificationButtonsInline } from '../components/StylistComponents/NotificationButtonsRow';
import {
  STYLIST_CARD_LEFT,
  STYLIST_CARD_GAP,
  SUB_BRANDING_CARD_HEIGHT,
} from '../components/StylistComponents/stylistConstants';
import { vs, ms, hp, wp, RFValue } from '../utils/responsive';
import {
  SERVICE_TIMERS_STORAGE_KEY,
  subscribeServiceTimersInvalidate,
} from '../utils/serviceTimersStorage';
import { haptics } from '../utils/haptics';
import {
  STOPWATCH_CARD_STORAGE_KEY,
  subscribeStopwatchCardInvalidate,
} from '../utils/stopwatchCardStorage';

const CONTAINER_BG = '#000';
const SHAPE_BG = '#1B1818';

/** Mask: white = visible, transparent/black = hidden. */
const SHAPE_VIEWBOX = '0 0 1284 2369';
const SHAPE_PATH_D =
  'M1004.5 274V0.5H0.5V2368.5H1282.5L1121.5 1851.5L1048 1330L1239 595.5L1004.5 274Z';

const waitlist = [
  { id: 'w1', client: 'Liam Wright', service: 'Hair Cut', time: '—' },
  { id: 'w2', client: 'Noah Davis', service: 'Color', time: '—' },
  { id: 'w3', client: 'James Wilson', service: 'Blow Dry', time: '—' },
  { id: 'w4', client: 'Oliver Brown', service: 'Styling', time: '—' },
  { id: 'w5', client: 'Elijah Taylor', service: 'Treatment', time: '—' },
];

/** Only buttons with count > 0 show. Right now only Waiting is shown (others 0). */
const notificationItems = [
  { label: 'Referrals', count: 0, color: '#e64cff' },
  { label: 'Reviews', count: 0, color: '#4fc7ea' },
  { label: 'Messages', count: 0, color: '#ff7f2a' },
];

const MAIN_BRANDING_HEIGHT = vs(110);
const MUSE_BUTTON_HEIGHT = vs(52);
/** Smaller gap above/below Muse button (tighter than card gap). */
const MUSE_BUTTON_GAP = vs(1);
/** Gap between Muse button and sub-branding card. */
const GAP_BELOW_MUSE = vs(2);
const GAP_ABOVE_MAIN_BRANDING = vs(35);
const MAIN_BRANDING_TOP = GAP_ABOVE_MAIN_BRANDING;
const MUSE_BUTTON_TOP = MAIN_BRANDING_TOP + MAIN_BRANDING_HEIGHT;
/** Nudge sub-branding card up (subtract from top). */
const SUB_BRANDING_UP_NUDGE = vs(25);
const SUB_BRANDING_TOP =
  MUSE_BUTTON_TOP + MUSE_BUTTON_GAP + MUSE_BUTTON_HEIGHT + GAP_BELOW_MUSE - SUB_BRANDING_UP_NUDGE;
const VIEWPORT_TOP = SUB_BRANDING_TOP + SUB_BRANDING_CARD_HEIGHT + STYLIST_CARD_GAP;
const VIEWPORT_HEIGHT = VIEWPORT_HEIGHT_FOR_5_CARDS;
/** Gap above title + title height + gap below title. */
const WAITLIST_HEADER_HEIGHT = STYLIST_CARD_GAP + WAITLIST_TITLE_HEIGHT + STYLIST_CARD_GAP;
const WAITLIST_VIEWPORT_TOP = VIEWPORT_TOP + VIEWPORT_HEIGHT + WAITLIST_HEADER_HEIGHT;
/** Timer panel width = full width minus same horizontal inset as appointment cards (STYLIST_CARD_LEFT each side). */
const TIMER_PANEL_SLIDE_WIDTH = wp(100) - STYLIST_CARD_LEFT * 2;
/** Extra space below header before clock / picker (design: breathing room at top). */
const TIMER_BODY_TOP_INSET = vs(36);
const TIMER_ITEM_HEIGHT = vs(24);
const TIMER_VISIBLE_ITEMS = 5;
const TIMER_WHEEL_HEIGHT = TIMER_ITEM_HEIGHT * TIMER_VISIBLE_ITEMS;

type ServiceTimerStatus = 'idle' | 'running' | 'paused' | 'done';

type ServiceTimerState = {
  timerId: string;
  appointmentId: string;
  clientKey: string;
  serviceKey: string;
  durationMs: number;
  status: ServiceTimerStatus;
  startedAtEpoch?: number;
  accumulatedMs: number;
  updatedAtEpoch: number;
};
function buildNumberOptions(max: number): number[] {
  return Array.from({ length: max + 1 }, (_, i) => i);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function pickServiceLabel(event: {
  service?: string;
  clientName?: string;
  title?: string;
}): string {
  const service = event.service?.trim();
  if (service) return service;

  // Backward compatibility: some older data used `clientName` to hold service text.
  const legacyService = event.clientName?.trim();
  if (legacyService && legacyService !== event.title?.trim()) return legacyService;

  return '—';
}

function withAlpha(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return hexColor;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildTimerId(apt: Appointment): string {
  return `${normalizeKey(apt.client)}-${normalizeKey(apt.service)}-${apt.id}`;
}

function computeElapsedMs(timer: ServiceTimerState, nowEpoch: number): number {
  if (timer.status === 'running' && timer.startedAtEpoch != null) {
    return timer.accumulatedMs + Math.max(0, nowEpoch - timer.startedAtEpoch);
  }
  return timer.accumulatedMs;
}

function computeRemainingMs(timer: ServiceTimerState, nowEpoch: number): number {
  return Math.max(0, timer.durationMs - computeElapsedMs(timer, nowEpoch));
}

function formatClock(totalMs: number): string {
  const totalSec = Math.max(0, Math.floor(totalMs / 1000));
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/** Elapsed stopwatch: centiseconds for smooth updates; hours if needed. */
function formatStopwatch(totalMs: number): string {
  const ms = Math.max(0, Math.floor(totalMs));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

type TimerPanelMode = 'timer' | 'stopwatch';

/** Set Timer button: minutes and seconds only (no centiseconds or hours). */
function formatStopwatchCardLabel(totalMs: number): string {
  const ms = Math.max(0, Math.floor(totalMs));
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Compact card label: 3:07 or 42:18 for quick glance. */
function formatTimerBadgeClock(totalMs: number): string {
  const totalSec = Math.max(0, Math.floor(totalMs / 1000));
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  if (hh > 0) return `${hh}:${String(mm).padStart(2, '0')}`;
  return `${mm}:${String(ss).padStart(2, '0')}`;
}
/** Map calendar events for today (timed, not parked, not waitlist) to Stylist appointment shape. */
function useTodayAppointments(): Appointment[] {
  const { events } = useEvents();
  return useMemo(() => {
    const today = new Date();
    const timed = events.filter(
      (e) =>
        isSameDay(e.start, today) &&
        !e.allDay &&
        !e.isParked &&
        e.waitlistAddedAt == null
    );
    const sorted = [...timed].sort((a, b) => a.start.getTime() - b.start.getTime());
    return sorted.map((e) => ({
      id: e.id,
      // Stylist card should always show person name here.
      client: e.title ?? e.clientName ?? '—',
      // Service area should show service/service list name(s).
      service: pickServiceLabel(e),
      time: `${format(e.start, 'h:mm a')} – ${format(e.end, 'h:mm a')}`,
    }));
  }, [events]);
}

export default function StylistScreen() {
  const { primaryColor } = useTheme();
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  /** Below status icons (battery, etc.): max of safe inset vs Android status bar, then a small gap. */
  const headerDateTop = Math.max(insets.top, statusBarHeight) + vs(12);
  /** Flush to top-right (branding header corner); safe-area right for notched devices. */
  const headerDateRight = insets.right + ms(12);
  const headerWeekday = format(new Date(), 'EEE');
  const headerDayOfMonth = format(new Date(), 'd');
  const appointments = useTodayAppointments();
  const [setTimerTarget, setSetTimerTarget] = useState<Appointment | null>(null);
  const [pickedHour, setPickedHour] = useState<number>(0);
  const [pickedMinute, setPickedMinute] = useState<number>(0);
  const [pickerDate, setPickerDate] = useState<Date>(() => new Date());
  const [nowEpoch, setNowEpoch] = useState<number>(() => Date.now());
  const [timersById, setTimersById] = useState<Record<string, ServiceTimerState>>({});
  const [timersHydrated, setTimersHydrated] = useState(false);
  const [timerPanelMode, setTimerPanelMode] = useState<TimerPanelMode>('timer');
  const [swAccumulatedMs, setSwAccumulatedMs] = useState(0);
  const [swStartedAtEpoch, setSwStartedAtEpoch] = useState<number | undefined>(undefined);
  const [swTick, setSwTick] = useState(0);
  const [stopwatchByAppointmentId, setStopwatchByAppointmentId] = useState<
    Record<string, AppointmentStopwatchPersist>
  >({});
  const [stopwatchHydrated, setStopwatchHydrated] = useState(false);
  const [stopwatchUiNow, setStopwatchUiNow] = useState(() => Date.now());
  const swPersistRef = useRef<Record<string, AppointmentStopwatchPersist>>({});
  const swAccRef = useRef(0);
  const swStartRef = useRef<number | undefined>(undefined);
  const setTimerTargetRef = useRef<Appointment | null>(null);
  const doneHapticsTriggeredRef = useRef<Set<string>>(new Set());
  const timerPanelTranslateX = useSharedValue(-TIMER_PANEL_SLIDE_WIDTH);
  const activeTimer = setTimerTarget ? timersById[buildTimerId(setTimerTarget)] : undefined;
  const activeRemainingMs = activeTimer ? computeRemainingMs(activeTimer, nowEpoch) : 0;

  useEffect(() => {
    swPersistRef.current = stopwatchByAppointmentId;
  }, [stopwatchByAppointmentId]);

  useEffect(() => {
    swAccRef.current = swAccumulatedMs;
    swStartRef.current = swStartedAtEpoch;
  }, [swAccumulatedMs, swStartedAtEpoch]);

  useEffect(() => {
    setTimerTargetRef.current = setTimerTarget;
  }, [setTimerTarget]);

  const openSetTimer = useCallback((apt: Appointment) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setSetTimerTarget(apt);
    setPickerDate(now);
    setPickedHour(0);
    setPickedMinute(0);
    const sw = swPersistRef.current[apt.id];
    const hasStopwatchSession =
      sw != null && (sw.startedAtEpoch != null || sw.accumulatedMs > 0);
    setTimerPanelMode(hasStopwatchSession ? 'stopwatch' : 'timer');
    setSwAccumulatedMs(sw?.accumulatedMs ?? 0);
    setSwStartedAtEpoch(sw?.startedAtEpoch);
    setSwTick(0);
  }, []);

  const closeSetTimer = useCallback(() => {
    const target = setTimerTargetRef.current;
    if (target) {
      const aid = target.id;
      const t = Date.now();
      const acc = swAccRef.current;
      const start = swStartRef.current;
      if (start != null || acc > 0) {
        setStopwatchByAppointmentId((prev) => ({
          ...prev,
          [aid]: {
            appointmentId: aid,
            accumulatedMs: acc,
            startedAtEpoch: start,
            updatedAtEpoch: t,
          },
        }));
      } else {
        setStopwatchByAppointmentId((prev) => {
          if (!prev[aid]) return prev;
          const next = { ...prev };
          delete next[aid];
          return next;
        });
      }
    }
    timerPanelTranslateX.value = withTiming(
      -TIMER_PANEL_SLIDE_WIDTH,
      { duration: 220 },
      (finished) => {
        if (finished) {
          runOnJS(setSetTimerTarget)(null);
        }
      }
    );
  }, [timerPanelTranslateX]);

  const loadTimersFromStorage = useCallback((markHydrated: boolean) => {
    AsyncStorage.getItem(SERVICE_TIMERS_STORAGE_KEY)
      .then((raw) => {
        if (!raw) {
          setTimersById({});
          return;
        }
        try {
          const parsed = JSON.parse(raw) as Record<string, ServiceTimerState>;
          if (parsed && typeof parsed === 'object') {
            setTimersById(parsed);
          }
        } catch {
          // Ignore malformed storage and keep empty timers.
        }
      })
      .finally(() => {
        if (markHydrated) setTimersHydrated(true);
      });
  }, []);

  useEffect(() => {
    loadTimersFromStorage(true);
  }, [loadTimersFromStorage]);

  useEffect(() => {
    return subscribeServiceTimersInvalidate(() => loadTimersFromStorage(false));
  }, [loadTimersFromStorage]);

  useFocusEffect(
    useCallback(() => {
      loadTimersFromStorage(false);
    }, [loadTimersFromStorage])
  );

  const loadStopwatchFromStorage = useCallback((markHydrated: boolean) => {
    AsyncStorage.getItem(STOPWATCH_CARD_STORAGE_KEY)
      .then((raw) => {
        if (!raw) {
          setStopwatchByAppointmentId({});
          return;
        }
        try {
          const parsed = JSON.parse(raw) as Record<string, AppointmentStopwatchPersist>;
          if (parsed && typeof parsed === 'object') {
            setStopwatchByAppointmentId(parsed);
          }
        } catch {
          // Ignore malformed storage.
        }
      })
      .finally(() => {
        if (markHydrated) setStopwatchHydrated(true);
      });
  }, []);

  useEffect(() => {
    loadStopwatchFromStorage(true);
  }, [loadStopwatchFromStorage]);

  useEffect(() => {
    return subscribeStopwatchCardInvalidate(() => loadStopwatchFromStorage(false));
  }, [loadStopwatchFromStorage]);

  useFocusEffect(
    useCallback(() => {
      loadStopwatchFromStorage(false);
    }, [loadStopwatchFromStorage])
  );

  useEffect(() => {
    if (!stopwatchHydrated) return;
    AsyncStorage.setItem(STOPWATCH_CARD_STORAGE_KEY, JSON.stringify(stopwatchByAppointmentId)).catch(() => {});
  }, [stopwatchByAppointmentId, stopwatchHydrated]);

  useEffect(() => {
    if (!timersHydrated) return;
    AsyncStorage.setItem(SERVICE_TIMERS_STORAGE_KEY, JSON.stringify(timersById)).catch(() => {});
  }, [timersById, timersHydrated]);

  useEffect(() => {
    const hasRunning = Object.values(timersById).some((t) => t.status === 'running');
    if (!hasRunning) return;
    const interval = setInterval(() => {
      setNowEpoch(Date.now());
      setTimersById((prev) => {
        const next: Record<string, ServiceTimerState> = { ...prev };
        let changed = false;
        const now = Date.now();
        for (const [id, timer] of Object.entries(prev)) {
          if (timer.status !== 'running') continue;
          const remainingMs = computeRemainingMs(timer, now);
          if (remainingMs <= 0) {
            if (!doneHapticsTriggeredRef.current.has(id)) {
              doneHapticsTriggeredRef.current.add(id);
              void haptics.timerDoneJiggle();
            }
            next[id] = {
              ...timer,
              status: 'done',
              accumulatedMs: timer.durationMs,
              startedAtEpoch: undefined,
              updatedAtEpoch: now,
            };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timersById]);

  useEffect(() => {
    if (setTimerTarget) {
      timerPanelTranslateX.value = -TIMER_PANEL_SLIDE_WIDTH;
      timerPanelTranslateX.value = withTiming(0, { duration: 240 });
    }
  }, [setTimerTarget, timerPanelTranslateX]);

  useEffect(() => {
    if (swStartedAtEpoch == null) return;
    const id = setInterval(() => setSwTick((t) => t + 1), 50);
    return () => clearInterval(id);
  }, [swStartedAtEpoch]);

  useEffect(() => {
    if (setTimerTarget != null) return;
    setTimerPanelMode('timer');
  }, [setTimerTarget]);

  useEffect(() => {
    const anyRunning = Object.values(stopwatchByAppointmentId).some((s) => s.startedAtEpoch != null);
    if (!anyRunning) return;
    const id = setInterval(() => setStopwatchUiNow(Date.now()), 50);
    return () => clearInterval(id);
  }, [stopwatchByAppointmentId]);

  const swElapsedMs = useMemo(() => {
    const base = swAccumulatedMs;
    if (swStartedAtEpoch != null) {
      return base + (Date.now() - swStartedAtEpoch);
    }
    return base;
  }, [swAccumulatedMs, swStartedAtEpoch, swTick]);

  const stopwatchReset = useCallback(() => {
    if (!setTimerTarget) return;
    const aid = setTimerTarget.id;
    setSwAccumulatedMs(0);
    setSwStartedAtEpoch(undefined);
    setSwTick(0);
    setStopwatchByAppointmentId((prev) => {
      const next = { ...prev };
      delete next[aid];
      return next;
    });
  }, [setTimerTarget]);

  const stopwatchToggleRunning = useCallback(() => {
    if (!setTimerTarget) return;
    const aid = setTimerTarget.id;
    if (swStartedAtEpoch != null) {
      const now = Date.now();
      const nextAcc = swAccumulatedMs + (now - swStartedAtEpoch);
      setSwAccumulatedMs(nextAcc);
      setSwStartedAtEpoch(undefined);
      setStopwatchByAppointmentId((prev) => ({
        ...prev,
        [aid]: {
          appointmentId: aid,
          accumulatedMs: nextAcc,
          startedAtEpoch: undefined,
          updatedAtEpoch: now,
        },
      }));
    } else {
      const now = Date.now();
      setSwStartedAtEpoch(now);
      setStopwatchByAppointmentId((prev) => ({
        ...prev,
        [aid]: {
          appointmentId: aid,
          accumulatedMs: swAccumulatedMs,
          startedAtEpoch: now,
          updatedAtEpoch: now,
        },
      }));
    }
  }, [setTimerTarget, swStartedAtEpoch, swAccumulatedMs]);

  const handleSetTimer = useCallback(() => {
    if (!setTimerTarget) return;
    const durationMs =
      pickedHour * 3600 * 1000 + pickedMinute * 60 * 1000;
    const now = Date.now();
    const timerId = buildTimerId(setTimerTarget);
    doneHapticsTriggeredRef.current.delete(timerId);
    setTimersById((prev) => ({
      ...(prev[timerId]
        ? prev
        : {
            ...prev,
            [timerId]: {
              timerId,
              appointmentId: setTimerTarget.id,
              clientKey: normalizeKey(setTimerTarget.client),
              serviceKey: normalizeKey(setTimerTarget.service),
              durationMs,
              status: durationMs > 0 ? 'idle' : 'done',
              accumulatedMs: 0,
              startedAtEpoch: undefined,
              updatedAtEpoch: now,
            },
          }),
    }));
  }, [setTimerTarget, pickedHour, pickedMinute]);

  const handleStartFromPicker = useCallback(() => {
    if (!setTimerTarget) return;
    const durationMs =
      pickedHour * 3600 * 1000 + pickedMinute * 60 * 1000;
    if (durationMs <= 0) return;
    const now = Date.now();
    const timerId = buildTimerId(setTimerTarget);
    doneHapticsTriggeredRef.current.delete(timerId);
    setTimersById((prev) => ({
      ...(prev[timerId]
        ? prev
        : {
            ...prev,
            [timerId]: {
              timerId,
              appointmentId: setTimerTarget.id,
              clientKey: normalizeKey(setTimerTarget.client),
              serviceKey: normalizeKey(setTimerTarget.service),
              durationMs,
              status: 'running',
              accumulatedMs: 0,
              startedAtEpoch: now,
              updatedAtEpoch: now,
            },
          }),
    }));
  }, [setTimerTarget, pickedHour, pickedMinute]);

  const handleStartTimer = useCallback(() => {
    if (!setTimerTarget) return;
    const timerId = buildTimerId(setTimerTarget);
    const now = Date.now();
    doneHapticsTriggeredRef.current.delete(timerId);
    setTimersById((prev) => {
      const timer = prev[timerId];
      if (!timer || timer.status === 'done') return prev;
      return {
        ...prev,
        [timerId]: {
          ...timer,
          status: 'running',
          startedAtEpoch: now,
          updatedAtEpoch: now,
        },
      };
    });
  }, [setTimerTarget]);

  const handleStopTimer = useCallback(() => {
    if (!setTimerTarget) return;
    const timerId = buildTimerId(setTimerTarget);
    const now = Date.now();
    setTimersById((prev) => {
      const timer = prev[timerId];
      if (!timer || timer.status !== 'running') return prev;
      const elapsed = computeElapsedMs(timer, now);
      return {
        ...prev,
        [timerId]: {
          ...timer,
          status: elapsed >= timer.durationMs ? 'done' : 'paused',
          accumulatedMs: Math.min(timer.durationMs, elapsed),
          startedAtEpoch: undefined,
          updatedAtEpoch: now,
        },
      };
    });
  }, [setTimerTarget]);

  const handleResetTimer = useCallback(() => {
    if (!setTimerTarget) return;
    const timerId = buildTimerId(setTimerTarget);
    const now = Date.now();
    doneHapticsTriggeredRef.current.delete(timerId);
    setTimersById((prev) => {
      const timer = prev[timerId];
      if (!timer) return prev;
      return {
        ...prev,
        [timerId]: {
          ...timer,
          status: timer.durationMs > 0 ? 'idle' : 'done',
          accumulatedMs: 0,
          startedAtEpoch: undefined,
          updatedAtEpoch: now,
        },
      };
    });
  }, [setTimerTarget]);

  const timerPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: timerPanelTranslateX.value }],
  }));

  const stopwatchCardLabelsByAppointmentId = useMemo(() => {
    const now = stopwatchUiNow;
    const out: Record<string, string> = {};
    for (const [aptId, sw] of Object.entries(stopwatchByAppointmentId)) {
      const running = sw.startedAtEpoch != null;
      const elapsed = sw.accumulatedMs + (running ? now - (sw.startedAtEpoch ?? 0) : 0);
      if (!running && sw.accumulatedMs === 0) continue;
      out[aptId] = formatStopwatchCardLabel(elapsed);
    }
    return out;
  }, [stopwatchByAppointmentId, stopwatchUiNow]);

  const timerBadgesByAppointmentId = useMemo<Record<string, AppointmentTimerBadge>>(() => {
    const badges: Record<string, AppointmentTimerBadge> = {};
    for (const apt of appointments) {
      const timer = timersById[buildTimerId(apt)];
      if (!timer) continue;
      const remainingMs = computeRemainingMs(timer, nowEpoch);
      badges[apt.id] = {
        timeText: formatTimerBadgeClock(remainingMs),
        status: timer.status,
      };
    }
    return badges;
  }, [appointments, nowEpoch, timersById]);

  return (
    <View style={styles.screen}>
      <MaskedView
        style={styles.maskedView}
        maskElement={
          <View style={styles.maskContainer}>
            <Svg
              width="100%"
              height="100%"
              viewBox={SHAPE_VIEWBOX}
              preserveAspectRatio="none"
            >
              <Path d={SHAPE_PATH_D} fill="white" />
            </Svg>
          </View>
        }
      >
        <View style={styles.shapeFill}>
          <StylistLayout />
          <MainBrandingCard top={MAIN_BRANDING_TOP} />
          <View style={[styles.museButtonWrap, { top: MUSE_BUTTON_TOP, left: STYLIST_CARD_LEFT }]}>
            <MuseButton onPress={() => {}} />
          </View>
          <StylistSubBranding top={SUB_BRANDING_TOP} />
          <AppointmentsSection
            appointments={appointments}
            viewportTop={VIEWPORT_TOP}
            viewportHeight={VIEWPORT_HEIGHT}
            timerBadgesByAppointmentId={timerBadgesByAppointmentId}
            stopwatchCardLabelsByAppointmentId={stopwatchCardLabelsByAppointmentId}
            onSetTimerPress={openSetTimer}
          />
          <WaitlistTitleCard
            top={VIEWPORT_TOP + VIEWPORT_HEIGHT + STYLIST_CARD_GAP}
            rightContent={
              <NotificationButtonsInline
                items={notificationItems}
                waitlistCount={waitlist.length}
              />
            }
          />
          <WaitlistSection
            items={waitlist}
            viewportTop={WAITLIST_VIEWPORT_TOP}
          />
        </View>
      </MaskedView>

      <View
        style={[
          styles.headerDateWrap,
          { top: headerDateTop, right: headerDateRight },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.headerDateWeekday}>{headerWeekday}</Text>
        <Text style={styles.headerDateDay}>{headerDayOfMonth}</Text>
      </View>

      <StylistRailCurve />

      {setTimerTarget != null ? (
        <View style={styles.timerOverlay} pointerEvents="box-none">
          <BlurView
            intensity={52}
            tint="dark"
            style={StyleSheet.absoluteFill}
            {...(Platform.OS === 'android' ? { experimentalBlurMethod: 'dimezisBlurView' as const } : {})}
          />
          <View style={styles.timerBackdropTint} pointerEvents="none" />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeSetTimer}
            accessibilityRole="button"
            accessibilityLabel="Close timer"
          />
          <Animated.View
            style={[
              styles.timerPanelOuter,
              timerPanelStyle,
              { borderColor: withAlpha(primaryColor, 0.38) },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.timerPanelInner}>
              <View style={styles.timerHeaderCenter}>
                <Text style={[styles.timerHeaderMode, { color: primaryColor }]} numberOfLines={1}>
                  {activeTimer ? 'Timer' : timerPanelMode === 'timer' ? 'Timer' : 'Stopwatch'}
                </Text>
                <Text style={styles.timerHeaderClient} numberOfLines={2}>
                  {setTimerTarget.client.trim() || '—'}
                </Text>
              </View>

              {!activeTimer ? (
                <View style={styles.timerPanelBody}>
                  <View style={styles.timerIdleMain}>
                    {timerPanelMode === 'timer' ? (
                      <View style={styles.timerPickerCenter}>
                        <View style={styles.timerPickerWrap}>
                          <DateTimePicker
                            value={pickerDate}
                            mode="time"
                            display="spinner"
                            is24Hour
                            locale="en_GB"
                            onChange={(_ev, d) => {
                              if (!d) return;
                              setPickerDate(d);
                              setPickedHour(d.getHours());
                              setPickedMinute(d.getMinutes());
                            }}
                            themeVariant="dark"
                            style={[
                              styles.timerNativePicker,
                              Platform.OS === 'android'
                                ? [styles.timerNativePickerAndroid, { borderColor: withAlpha(primaryColor, 0.35) }]
                                : undefined,
                            ]}
                          />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.timerStopwatchCenter}>
                        <Text style={styles.timerStopwatchClock} numberOfLines={1}>
                          {formatStopwatch(swElapsedMs)}
                        </Text>
                        <View style={styles.timerStopwatchBtnRow}>
                          <Pressable
                            style={[
                              styles.timerStopwatchRoundBtn,
                              { borderColor: withAlpha(primaryColor, 0.45) },
                            ]}
                            onPress={stopwatchReset}
                            accessibilityRole="button"
                            accessibilityLabel="Reset stopwatch"
                          >
                            <Text style={styles.timerStopwatchRoundBtnText}>Reset</Text>
                          </Pressable>
                          <Pressable
                            style={[
                              styles.timerStopwatchRoundBtn,
                              styles.timerStopwatchRoundBtnPrimary,
                              {
                                borderColor: withAlpha(primaryColor, 0.75),
                                backgroundColor: withAlpha(primaryColor, 0.2),
                              },
                            ]}
                            onPress={stopwatchToggleRunning}
                            accessibilityRole="button"
                            accessibilityLabel={swStartedAtEpoch != null ? 'Pause stopwatch' : 'Start stopwatch'}
                          >
                            <Text style={[styles.timerStopwatchRoundBtnText, { color: primaryColor }]}>
                              {swStartedAtEpoch != null ? 'Pause' : 'Start'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                  {timerPanelMode === 'timer' ? (
                    <Pressable
                      style={[
                        styles.timerPanelPrimaryBtn,
                        {
                          borderColor: withAlpha(primaryColor, 0.72),
                          backgroundColor: withAlpha(primaryColor, 0.2),
                        },
                      ]}
                      onPress={handleStartFromPicker}
                      accessibilityRole="button"
                      accessibilityLabel="Start service timer"
                    >
                      <Text style={[styles.timerPanelPrimaryBtnText, { color: primaryColor }]}>Start</Text>
                    </Pressable>
                  ) : null}
                  <View style={styles.timerModeSwitchRow}>
                    <Pressable
                      style={[
                        styles.timerModeSegment,
                        timerPanelMode === 'timer'
                          ? {
                              borderColor: withAlpha(primaryColor, 0.72),
                              backgroundColor: withAlpha(primaryColor, 0.24),
                            }
                          : styles.timerModeSegmentIdle,
                      ]}
                      onPress={() => setTimerPanelMode('timer')}
                      accessibilityRole="button"
                      accessibilityLabel="Timer"
                      accessibilityState={{ selected: timerPanelMode === 'timer' }}
                    >
                      <Text
                        style={[
                          styles.timerModeSegmentText,
                          timerPanelMode === 'timer' ? { color: primaryColor } : styles.timerModeSegmentTextMuted,
                        ]}
                      >
                        Timer
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.timerModeSegment,
                        timerPanelMode === 'stopwatch'
                          ? {
                              borderColor: withAlpha(primaryColor, 0.55),
                              backgroundColor: withAlpha(primaryColor, 0.14),
                            }
                          : styles.timerModeSegmentIdle,
                      ]}
                      onPress={() => setTimerPanelMode('stopwatch')}
                      accessibilityRole="button"
                      accessibilityLabel="Stopwatch"
                      accessibilityState={{ selected: timerPanelMode === 'stopwatch' }}
                    >
                      <Text
                        style={[
                          styles.timerModeSegmentText,
                          timerPanelMode === 'stopwatch' ? { color: primaryColor } : styles.timerModeSegmentTextMuted,
                        ]}
                      >
                        Stopwatch
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.timerPanelBody}>
                  <View style={styles.timerRunningWrap}>
                    <Text style={styles.timerLiveLabel}>{activeTimer.status.toUpperCase()}</Text>
                    <Text style={styles.timerLiveClock}>{formatClock(activeRemainingMs)}</Text>
                    <View style={styles.timerActionRow}>
                      <Pressable
                        style={[
                          styles.timerActionBtn,
                          styles.timerActionPrimary,
                          {
                            borderColor: withAlpha(primaryColor, 0.85),
                            backgroundColor: withAlpha(primaryColor, 0.2),
                          },
                        ]}
                        onPress={activeTimer.status === 'running' ? handleStopTimer : handleStartTimer}
                        disabled={activeTimer.status === 'done'}
                      >
                        <Text style={styles.timerActionText}>
                          {activeTimer.status === 'running' ? 'Stop' : 'Start'}
                        </Text>
                      </Pressable>
                      <Pressable style={styles.timerActionBtn} onPress={handleResetTimer}>
                        <Text style={styles.timerActionText}>Reset</Text>
                      </Pressable>
                    </View>
                    <Pressable
                      style={styles.timerChangeLink}
                      onPress={() => {
                        const apt = setTimerTarget;
                        if (!apt) return;
                        const timerId = buildTimerId(apt);
                        doneHapticsTriggeredRef.current.delete(timerId);
                        setTimersById((prev) => {
                          if (!prev[timerId]) return prev;
                          const next = { ...prev };
                          delete next[timerId];
                          return next;
                        });
                        setStopwatchByAppointmentId((prev) => {
                          if (!prev[apt.id]) return prev;
                          const next = { ...prev };
                          delete next[apt.id];
                          return next;
                        });
                        setSwAccumulatedMs(0);
                        setSwStartedAtEpoch(undefined);
                        setSwTick(0);
                        setTimerPanelMode('timer');
                      }}
                    >
                      <Text style={[styles.timerChangeLinkText, { color: primaryColor }]}>Change time</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CONTAINER_BG,
  },
  /** Stacked weekday + day (reference UI); above rail curve so text stays legible. */
  headerDateWrap: {
    position: 'absolute',
    zIndex: 101,
    alignItems: 'flex-end',
  },
  headerDateWeekday: {
    color: '#FFFFFF',
    fontSize: ms(12),
    fontWeight: '700',
    letterSpacing: ms(0.35),
    lineHeight: ms(14),
  },
  headerDateDay: {
    color: '#FFFFFF',
    fontSize: ms(30),
    fontWeight: '800',
    lineHeight: ms(32),
    marginTop: vs(-2),
    letterSpacing: ms(-0.5),
  },
  maskedView: {
    flex: 1,
  },
  maskContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  shapeFill: {
    flex: 1,
    backgroundColor: SHAPE_BG,
    paddingLeft: 0,
    paddingRight: 0,
  },
  museButtonWrap: {
    position: 'absolute',
    marginTop: MUSE_BUTTON_GAP,
    marginBottom: GAP_BELOW_MUSE,
  },
  /** Above StylistRailCurve (railStrip zIndex 100) so timer sits on top of the curve */
  timerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 150,
    elevation: 150,
  },
  /** Dark tint on top of blur (full-screen glass overlay). */
  timerBackdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  /** Glass-style card; sits above full-screen blur. */
  timerPanelOuter: {
    position: 'absolute',
    top: VIEWPORT_TOP,
    left: STYLIST_CARD_LEFT,
    right: STYLIST_CARD_LEFT,
    height: VIEWPORT_HEIGHT,
    borderRadius: ms(16),
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: 'rgba(16,14,18,0.78)',
  },
  timerPanelInner: {
    flex: 1,
    paddingLeft: STYLIST_CARD_LEFT,
    paddingRight: wp(15),
    paddingTop: hp(1.4),
    paddingBottom: hp(1.6),
  },
  timerHeaderCenter: {
    alignItems: 'center',
    paddingHorizontal: ms(8),
    paddingBottom: hp(0.6),
  },
  timerHeaderMode: {
    fontSize: RFValue(22),
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: ms(0.5),
  },
  timerHeaderClient: {
    marginTop: vs(6),
    fontSize: RFValue(16),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: RFValue(21),
  },
  /** Primary = Timer (left), secondary = Stopwatch (right), anchored to bottom of panel. */
  timerModeSwitchRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    paddingHorizontal: ms(4),
    marginTop: vs(4),
    paddingBottom: hp(0.6),
  },
  timerIdleMain: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    justifyContent: 'center',
  },
  timerPanelPrimaryBtn: {
    width: '100%',
    marginTop: vs(6),
    paddingVertical: vs(9),
    paddingHorizontal: ms(12),
    borderRadius: ms(11),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPanelPrimaryBtnText: {
    fontSize: RFValue(13),
    fontWeight: '700',
  },
  timerModeSegment: {
    flex: 1,
    minHeight: vs(36),
    borderRadius: ms(10),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(7),
    paddingHorizontal: ms(6),
  },
  timerModeSegmentIdle: {
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(22,22,22,0.92)',
  },
  timerModeSegmentText: {
    fontSize: RFValue(12),
    fontWeight: '700',
  },
  timerModeSegmentTextMuted: {
    color: 'rgba(255,255,255,0.48)',
  },
  timerPanelBody: {
    flex: 1,
    paddingTop: TIMER_BODY_TOP_INSET,
    minHeight: 0,
  },
  timerPickerCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: vs(80),
  },
  timerPickerWrap: {
    width: '100%',
    height: hp(24),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    alignSelf: 'stretch',
    borderRadius: ms(999),
    overflow: 'hidden',
  },
  timerStopwatchCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: vs(80),
    gap: vs(16),
    paddingHorizontal: ms(8),
  },
  timerStopwatchClock: {
    color: '#FFFFFF',
    fontSize: RFValue(36),
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timerStopwatchBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(14),
    flexWrap: 'wrap',
  },
  timerStopwatchRoundBtn: {
    minWidth: ms(96),
    paddingHorizontal: ms(16),
    paddingVertical: vs(10),
    borderRadius: ms(999),
    borderWidth: 1,
    backgroundColor: 'rgba(22,22,22,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerStopwatchRoundBtnPrimary: {
    backgroundColor: 'rgba(22,22,22,0.92)',
  },
  timerStopwatchRoundBtnText: {
    color: '#FFFFFF',
    fontSize: RFValue(13),
    fontWeight: '700',
  },
  timerNativePicker: {
    width: '100%',
    height: hp(24),
  },
  timerNativePickerAndroid: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderRadius: ms(999),
  },
  timerCenterHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TIMER_ITEM_HEIGHT,
    top: (TIMER_WHEEL_HEIGHT - TIMER_ITEM_HEIGHT) / 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    zIndex: 2,
    overflow: 'hidden',
  },
  timerFadeTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: hp(5),
    zIndex: 3,
  },
  timerFadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: hp(5),
    zIndex: 3,
  },
  timerColumnsRow: {
    flexDirection: 'row',
    gap: ms(8),
    width: '100%',
  },
  timerColumnsFrame: {
    width: '50%',
    alignSelf: 'flex-start',
  },
  timerFixedUnitsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (TIMER_WHEEL_HEIGHT - TIMER_ITEM_HEIGHT) / 2,
    height: TIMER_ITEM_HEIGHT,
    flexDirection: 'row',
    zIndex: 4,
  },
  timerFixedUnitCol: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: ms(6),
  },
  timerFixedUnitText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: RFValue(10),
    fontWeight: '700',
  },
  timerCol: {
    flex: 1,
    height: TIMER_WHEEL_HEIGHT,
    alignItems: 'center',
  },
  timerColInner: {
    width: '100%',
    height: TIMER_WHEEL_HEIGHT,
    position: 'relative',
  },
  timerOverlayClip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (TIMER_WHEEL_HEIGHT - TIMER_ITEM_HEIGHT) / 2,
    height: TIMER_ITEM_HEIGHT,
    overflow: 'hidden',
    zIndex: 5,
  },
  timerItem: {
    height: TIMER_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
  },
  timerWheelContent: {
    paddingVertical: (TIMER_WHEEL_HEIGHT - TIMER_ITEM_HEIGHT) / 2,
  },
  timerWheelTextBase: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: RFValue(18),
    lineHeight: TIMER_ITEM_HEIGHT,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  timerUnit: {
    marginTop: vs(1),
    color: '#A1A1A6',
    fontSize: RFValue(11),
    fontWeight: '700',
  },
  timerWheelTextOverlay: {
    color: '#FFFFFF',
    fontSize: RFValue(20),
    lineHeight: TIMER_ITEM_HEIGHT,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  timerWheelTextOverlayActive: {
    color: '#FFFFFF',
    fontSize: RFValue(20),
    lineHeight: TIMER_ITEM_HEIGHT,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(255,255,255,0.28)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: ms(4),
  },
  timerRunningWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: vs(10),
    paddingHorizontal: ms(4),
  },
  timerLiveLabel: {
    color: '#A1A1A6',
    fontSize: RFValue(11),
    fontWeight: '600',
    letterSpacing: ms(1),
    textAlign: 'center',
  },
  timerLiveClock: {
    color: '#FFFFFF',
    fontSize: RFValue(32),
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(12),
    marginTop: vs(4),
    flexWrap: 'wrap',
  },
  timerActionBtn: {
    minWidth: ms(96),
    paddingHorizontal: ms(18),
    paddingVertical: vs(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  timerActionPrimary: {
    borderColor: '#fa1bfe',
    backgroundColor: 'rgba(250, 27, 254, 0.2)',
  },
  timerActionText: {
    color: '#FFFFFF',
    fontSize: RFValue(13),
    fontWeight: '700',
  },
  timerChangeLink: {
    marginTop: vs(6),
    paddingHorizontal: ms(8),
    paddingVertical: vs(4),
  },
  timerChangeLinkText: {
    color: '#fa1bfe',
    fontSize: RFValue(11),
    fontWeight: '600',
  },
});
