import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CalendarEvent } from '../data/events';
import { MOCK_EVENTS } from '../data/events';

const STORAGE_KEY = '@calendar_events';

function parseEvent(e: CalendarEvent & { start?: string; end?: string; waitlistAddedAt?: number | string }): CalendarEvent {
  const waitlistAddedAt =
    e.waitlistAddedAt == null
      ? undefined
      : typeof e.waitlistAddedAt === 'number'
        ? e.waitlistAddedAt
        : new Date(e.waitlistAddedAt as string).getTime();
  return {
    ...e,
    start: e.start instanceof Date ? e.start : new Date(e.start as unknown as string),
    end: e.end instanceof Date ? e.end : new Date(e.end as unknown as string),
    waitlistAddedAt,
  };
}

interface EventsContextType {
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
}

const EventsContext = createContext<EventsContextType | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [hydrated, setHydrated] = useState(false);

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
    const id = `ev-${Date.now()}`;
    setEvents((prev) => [...prev, { ...event, id }]);
  };

  return (
    <EventsContext.Provider value={{ events, setEvents, addEvent }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
}
