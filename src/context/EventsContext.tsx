import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CalendarEvent } from '../data/events';
import { MOCK_EVENTS } from '../data/events';
import { LoadingScreen } from '../components/LoadingScreen';

const STORAGE_KEY = '@calendar_events';
const SEEDED_KEY = '@calendar_events_seed_version';
const CURRENT_SEED_VERSION = 'v3';

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
    // #region agent log
    fetch('http://127.0.0.1:7699/ingest/8c2592ef-b362-4f49-875c-0da790bfbf73', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '53aca5' },
      body: JSON.stringify({
        sessionId: '53aca5',
        runId: `run-${Date.now()}`,
        hypothesisId: 'H6',
        location: 'EventsContext.tsx:dedupeEventsById',
        message: 'Duplicate event ids detected and removed',
        data: { duplicateIds: duplicates, duplicateCount: duplicates.length },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    console.error('[EventsContext] Duplicate event ids removed', {
      duplicateIds: duplicates,
      duplicateCount: duplicates.length,
    });
  }
  return output;
}

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEventsState] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [hydrated, setHydrated] = useState(false);
  const idCounterRef = useRef(0);

  const setEvents = React.useCallback((value: React.SetStateAction<CalendarEvent[]>) => {
    setEventsState((prev) => {
      const next = typeof value === 'function' ? (value as (prevState: CalendarEvent[]) => CalendarEvent[])(prev) : value;
      return dedupeEventsById(next);
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [json, seeded] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SEEDED_KEY),
        ]);

        // If mock seed version changed, overwrite stored events once.
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
          } catch {}

          setHydrated(true);
          return;
        }

        // First-launch seed (no stored data yet)
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_EVENTS));
        await AsyncStorage.setItem(SEEDED_KEY, CURRENT_SEED_VERSION);
      } catch {
        // If storage is unavailable, fall back to in-memory MOCK_EVENTS.
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events, hydrated]);

  const addEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const id = `ev-${Date.now()}-${++idCounterRef.current}`;
    setEvents((prev) => [...prev, { ...event, id }]);
  };

  const updateEvent = (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  return (
    <EventsContext.Provider value={{ events, setEvents, addEvent, updateEvent }}>
      {hydrated ? children : <LoadingScreen />}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
}
