import React, { createContext, useContext, useState, useCallback } from 'react';
import type { DayId, DaySchedule } from '../data/types';
import { MOCK_WORK_SCHEDULE } from '../data/mockData';

export type { DayId, DaySchedule } from '../data/types';

const DEFAULT_SCHEDULE: Record<DayId, DaySchedule> = { ...MOCK_WORK_SCHEDULE };

type WorkScheduleContextType = {
  schedule: Record<DayId, DaySchedule>;
  setDaySchedule: (dayId: DayId, update: Partial<DaySchedule>) => void;
  getDisplayValue: (dayId: DayId) => string;
};

const WorkScheduleContext = createContext<WorkScheduleContextType | null>(null);

export function WorkScheduleProvider({ children }: { children: React.ReactNode }) {
  const [schedule, setSchedule] = useState<Record<DayId, DaySchedule>>(DEFAULT_SCHEDULE);

  const setDaySchedule = useCallback((dayId: DayId, update: Partial<DaySchedule>) => {
    setSchedule((prev) => ({
      ...prev,
      [dayId]: { ...prev[dayId], ...update },
    }));
  }, []);

  const getDisplayValue = useCallback((dayId: DayId) => {
    const day = schedule[dayId];
    if (!day?.available) return 'Closed';
    return `${day.startTime} – ${day.endTime}`;
  }, [schedule]);

  return (
    <WorkScheduleContext.Provider value={{ schedule, setDaySchedule, getDisplayValue }}>
      {children}
    </WorkScheduleContext.Provider>
  );
}

export function useWorkSchedule() {
  const ctx = useContext(WorkScheduleContext);
  if (!ctx) throw new Error('useWorkSchedule must be used within WorkScheduleProvider');
  return ctx;
}
