import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CalendarEvent } from '../data/events';
import { MOCK_EVENTS } from '../data/events';
import { LoadingScreen } from '../components/LoadingScreen';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import {
  listAppointments,
  createAppointment,
  patchAppointment,
  listRowToCalendarEvent,
  calendarEventToCreateBody,
  partialEventToPatchBody,
} from '../lib/appointmentApi';
import { looksLikeCuid } from '../lib/serviceApi';

const STORAGE_KEY = '@calendar_events';
const SEEDED_KEY = '@calendar_events_seed_version';
const CURRENT_SEED_VERSION = 'v5';

type PersistedCalendarEvent = Omit<CalendarEvent, 'start' | 'end' | 'waitlistAddedAt'> & {
  start: Date | string;
  end: Date | string;
  waitlistAddedAt?: number | string | Date;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function parseEvent(e: PersistedCalendarEvent): CalendarEvent {
  const waitlistAddedAt =
    e.waitlistAddedAt == null
      ? undefined
      : typeof e.waitlistAddedAt === 'number'
        ? e.waitlistAddedAt
        : new Date(e.waitlistAddedAt).getTime();

  return {
    ...e,
    start: toDate(e.start),
    end: toDate(e.end),
    waitlistAddedAt,
  };
}

interface EventsContextType {
  events: CalendarEvent[];
  setEvents: (value: React.SetStateAction<CalendarEvent[]>) => void;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => void;
  /** When logged in with a salon, reload appointments from API. */
  refreshEventsFromApi: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | null>(null);

function dedupeEventsById(input: CalendarEvent[]): CalendarEvent[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const output: CalendarEvent[] = [];
  for (const ev of input) {
    if (seen.has(ev.id)) {
      duplicates.push(ev.id);
      continue;
    }
    seen.add(ev.id);
    output.push(ev);
  }
  if (duplicates.length > 0) {
    console.error('[EventsContext] Duplicate event ids removed', {
      duplicateIds: duplicates,
      duplicateCount: duplicates.length,
    });
  }
  return output;
}

function mergeApiWithLocalWaitlist(apiMapped: CalendarEvent[], prev: CalendarEvent[]): CalendarEvent[] {
  const apiIds = new Set(apiMapped.map((e) => e.id));
  const extra = prev.filter(
    (e) => !apiIds.has(e.id) && (e.waitlistAddedAt != null || e.allDay === true),
  );
  return dedupeEventsById([...apiMapped, ...extra]);
}

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { currentSalonId } = useTenant();
  const canUseApi = Boolean(token && currentSalonId);
  const canUseApiRef = useRef(canUseApi);
  canUseApiRef.current = canUseApi;

  const [events, setEventsState] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [hydrated, setHydrated] = useState(false);
  const [apiListReady, setApiListReady] = useState(() => !canUseApi);
  const idCounterRef = useRef(0);

  const setEvents = React.useCallback((value: React.SetStateAction<CalendarEvent[]>) => {
    setEventsState((prev) => {
      const next = typeof value === 'function' ? (value as (prevState: CalendarEvent[]) => CalendarEvent[])(prev) : value;
      return dedupeEventsById(next);
    });
  }, []);

  const refreshEventsFromApi = useCallback(async () => {
    if (!token || !currentSalonId) return;
    const from = new Date();
    from.setMonth(from.getMonth() - 6);
    const to = new Date();
    to.setMonth(to.getMonth() + 12);
    const { data } = await listAppointments(token, currentSalonId, { from, to, take: 500 });
    const mapped = data.map(listRowToCalendarEvent);
    setEventsState((prev) => mergeApiWithLocalWaitlist(mapped, prev));
  }, [token, currentSalonId]);

  useEffect(() => {
    if (!canUseApi) {
      setApiListReady(true);
      return;
    }
    setApiListReady(false);
    let cancelled = false;
    (async () => {
      try {
        await refreshEventsFromApi();
      } catch {
        /** ট্রানজিয়েন্ট নেটওয়ার্ক এররে UI খালি করা যাবে না — আগের স্টেট রাখি */
      } finally {
        if (!cancelled) setApiListReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canUseApi, refreshEventsFromApi]);

  useEffect(() => {
    if (canUseApi) return;

    (async () => {
      try {
        const [json, seeded] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SEEDED_KEY),
        ]);

        if (seeded !== CURRENT_SEED_VERSION) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_EVENTS));
          await AsyncStorage.setItem(SEEDED_KEY, CURRENT_SEED_VERSION);
          setEvents(MOCK_EVENTS);
          setHydrated(true);
          return;
        }

        if (json) {
          try {
            const parsed = JSON.parse(json);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const loaded = parsed.map(parseEvent);
              const waitlistMock = MOCK_EVENTS.filter((e: CalendarEvent) => e.waitlistAddedAt != null);
              const waitlistIds = new Set(waitlistMock.map((e: CalendarEvent) => e.id));
              const merged = loaded.map((e: CalendarEvent) => {
                if (waitlistIds.has(e.id)) {
                  const fromMock = waitlistMock.find((m: CalendarEvent) => m.id === e.id);
                  return fromMock ? { ...fromMock, start: e.start, end: e.end } : e;
                }
                return e;
              });
              const mergedIds = new Set(merged.map((e: CalendarEvent) => e.id));
              const toAdd = waitlistMock.filter((e: CalendarEvent) => !mergedIds.has(e.id));
              setEvents([...merged, ...toAdd]);
            }
          } catch {
            /* ignore */
          }

          setHydrated(true);
          return;
        }

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_EVENTS));
        await AsyncStorage.setItem(SEEDED_KEY, CURRENT_SEED_VERSION);
      } catch {
        /* ignore */
      } finally {
        setHydrated(true);
      }
    })();
  }, [canUseApi, setEvents]);

  useEffect(() => {
    if (canUseApi) {
      setHydrated(true);
    }
  }, [canUseApi]);

  useEffect(() => {
    if (!hydrated || canUseApi) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events, hydrated, canUseApi]);

  const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
    if (canUseApi && token && currentSalonId) {
      const tempId = `ev-pending-${Date.now()}-${++idCounterRef.current}`;
      setEvents((prev) => [...prev, { ...event, id: tempId, title: event.title ?? 'Client' }]);
      void (async () => {
        try {
          const body = calendarEventToCreateBody({
            ...event,
            title: event.title ?? 'Client',
          } as Omit<CalendarEvent, 'id'> & { title: string });
          const { data } = await createAppointment(token, currentSalonId, body);
          const ev = listRowToCalendarEvent(data);
          setEvents((prev) => prev.map((e) => (e.id === tempId ? ev : e)));
          // Ensure server-side adjustments (time rounding, includes, etc.) show up immediately.
          // This also covers cases where another screen created an appointment and we need to resync.
          try {
            await refreshEventsFromApi();
          } catch {
            /* ignore */
          }
        } catch {
          setEvents((prev) => prev.filter((e) => e.id !== tempId));
        }
      })();
      return;
    }

    const id = `ev-${Date.now()}-${++idCounterRef.current}`;
    setEvents((prev) => [...prev, { ...event, id }]);
  };

  const updateEvent = (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));

    if (canUseApi && token && currentSalonId && looksLikeCuid(id)) {
      const body = partialEventToPatchBody(updates);
      if (Object.keys(body).length === 0) return;
      void (async () => {
        try {
          const { data } = await patchAppointment(token, currentSalonId, id, body);
          const ev = listRowToCalendarEvent(data);
          setEvents((prev) => prev.map((e) => (e.id === id ? ev : e)));
        } catch {
          try {
            await refreshEventsFromApi();
          } catch {
            /* ignore */
          }
        }
      })();
    }
  };

  const ready = hydrated && apiListReady;

  return (
    <EventsContext.Provider
      value={{ events, setEvents, addEvent, updateEvent, refreshEventsFromApi }}
    >
      {ready ? children : <LoadingScreen />}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
}
