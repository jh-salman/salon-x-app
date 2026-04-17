import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { DayId, DaySchedule } from '../data/types';
import { MOCK_WORK_SCHEDULE } from '../data/mockData';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import { getMyWorkSchedule, putMyWorkSchedule } from '../lib/workScheduleApi';
import { apiRowsToScheduleRecord, scheduleRecordToApiDays } from '../lib/workScheduleBridge';

export type { DayId, DaySchedule } from '../data/types';

const DEFAULT_SCHEDULE: Record<DayId, DaySchedule> = { ...MOCK_WORK_SCHEDULE };

type WorkScheduleContextType = {
  schedule: Record<DayId, DaySchedule>;
  setDaySchedule: (dayId: DayId, update: Partial<DaySchedule>) => void;
  getDisplayValue: (dayId: DayId) => string;
};

const WorkScheduleContext = createContext<WorkScheduleContextType | null>(null);

export function WorkScheduleProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { currentSalonId } = useTenant();
  const canUseApi = Boolean(token && currentSalonId);

  const [schedule, setSchedule] = useState<Record<DayId, DaySchedule>>(DEFAULT_SCHEDULE);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipPushRef = useRef(false);

  useEffect(() => {
    if (!canUseApi || !token || !currentSalonId) {
      skipPushRef.current = false;
      setSchedule(DEFAULT_SCHEDULE);
      return;
    }

    let cancelled = false;
    skipPushRef.current = true;
    void (async () => {
      try {
        const { data } = await getMyWorkSchedule(token, currentSalonId);
        if (!cancelled && data.length > 0) {
          setSchedule(apiRowsToScheduleRecord(data));
        } else if (!cancelled) {
          setSchedule(DEFAULT_SCHEDULE);
        }
      } catch {
        if (!cancelled) setSchedule(DEFAULT_SCHEDULE);
      } finally {
        if (!cancelled) {
          skipPushRef.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canUseApi, token, currentSalonId]);

  const flushRemote = useCallback(
    (next: Record<DayId, DaySchedule>) => {
      if (!canUseApi || !token || !currentSalonId || skipPushRef.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void putMyWorkSchedule(token, currentSalonId, scheduleRecordToApiDays(next)).catch(() => {
          /* best-effort */
        });
      }, 500);
    },
    [canUseApi, token, currentSalonId],
  );

  const setDaySchedule = useCallback(
    (dayId: DayId, update: Partial<DaySchedule>) => {
      setSchedule((prev) => {
        const next = {
          ...prev,
          [dayId]: { ...prev[dayId], ...update },
        };
        flushRemote(next);
        return next;
      });
    },
    [flushRemote],
  );

  const getDisplayValue = useCallback(
    (dayId: DayId) => {
      const day = schedule[dayId];
      if (!day?.available) return 'Closed';
      return `${day.startTime} – ${day.endTime}`;
    },
    [schedule],
  );

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
