import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CalendarEvent } from '../data/events';
import { MOCK_EVENTS } from '../data/events';
import { LoadingScreen } from '../components/LoadingScreen';

const STORAGE_KEY = '@calendar_events';

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
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => void;
}

const EventsContext = createContext<EventsContextType | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [hydrated, setHydrated] = useState(false);
  const idCounterRef = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) {
        try {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const loaded = parsed.map(parseEvent);
            const waitlistMock = MOCK_EVENTS.filter((e) => e.waitlistAddedAt != null);
            const waitlistIds = new Set(waitlistMock.map((e) => e.id));
            const merged = loaded.map((e) => {
              if (waitlistIds.has(e.id)) {
                const fromMock = waitlistMock.find((m) => m.id === e.id);
                return fromMock ? { ...fromMock, start: e.start, end: e.end } : e;
              }
              return e;
            });
            const mergedIds = new Set(merged.map((e) => e.id));
            const toAdd = waitlistMock.filter((e) => !mergedIds.has(e.id));
            setEvents([...merged, ...toAdd]);
          }
        } catch {}
      }
      setHydrated(true);
    });
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
