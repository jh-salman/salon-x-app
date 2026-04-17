import { format, parse } from 'date-fns';
import type { DayId, DaySchedule } from '../data/types';
import type { ApiDayOfWeek, ApiWorkSchedulePutDay, ApiWorkScheduleRow } from './workScheduleApi';

const BASE_DATE = new Date(2000, 0, 1);

const UI_DAY_TO_API: Record<DayId, ApiDayOfWeek> = {
  mon: 'MON',
  tue: 'TUE',
  wed: 'WED',
  thu: 'THU',
  fri: 'FRI',
  sat: 'SAT',
  sun: 'SUN',
};

const API_DAY_TO_UI: Record<ApiDayOfWeek, DayId> = {
  MON: 'mon',
  TUE: 'tue',
  WED: 'wed',
  THU: 'thu',
  FRI: 'fri',
  SAT: 'sat',
  SUN: 'sun',
};

const ORDER: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function apiHHmmToDisplay(hhmm: string): string {
  const parts = hhmm.split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '9:00 AM';
  const d = new Date(2000, 0, 1, h, m);
  return format(d, 'h:mm a');
}

export function displayToApiHHmm(display: string): string {
  try {
    const d = parse(display.trim(), 'h:mm a', BASE_DATE);
    if (Number.isNaN(d.getTime())) return '09:00';
    return format(d, 'HH:mm');
  } catch {
    return '09:00';
  }
}

export function apiRowsToScheduleRecord(rows: ApiWorkScheduleRow[]): Record<DayId, DaySchedule> {
  const byUi: Partial<Record<DayId, DaySchedule>> = {};
  for (const r of rows) {
    const id = API_DAY_TO_UI[r.dayOfWeek];
    byUi[id] = {
      available: r.available,
      startTime: apiHHmmToDisplay(r.startTime),
      endTime: apiHHmmToDisplay(r.endTime),
    };
  }
  const out = {} as Record<DayId, DaySchedule>;
  for (const d of ORDER) {
    out[d] = byUi[d] ?? { available: false, startTime: '9:00 AM', endTime: '5:00 PM' };
  }
  return out;
}

export function scheduleRecordToApiDays(schedule: Record<DayId, DaySchedule>): ApiWorkSchedulePutDay[] {
  return ORDER.map((d) => {
    const s = schedule[d];
    return {
      dayOfWeek: UI_DAY_TO_API[d],
      available: s.available,
      startTime: displayToApiHHmm(s.startTime),
      endTime: displayToApiHHmm(s.endTime),
    };
  });
}
