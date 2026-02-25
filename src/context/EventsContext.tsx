import React, { createContext, useContext, useState } from 'react';
import type { CalendarEvent } from '../data/events';
import { MOCK_EVENTS } from '../data/events';

interface EventsContextType {
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
}

const EventsContext = createContext<EventsContextType | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>(() => MOCK_EVENTS);

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
