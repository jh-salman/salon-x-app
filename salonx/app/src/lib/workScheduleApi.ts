import { readV1ErrorMessage, v1Headers, V1_BASE } from './httpV1';

export type ApiDayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type ApiWorkScheduleRow = {
  id: string;
  dayOfWeek: ApiDayOfWeek;
  available: boolean;
  startTime: string;
  endTime: string;
};

export type ApiWorkSchedulePutDay = {
  dayOfWeek: ApiDayOfWeek;
  available: boolean;
  startTime?: string;
  endTime?: string;
};

export async function getMyWorkSchedule(
  token: string,
  salonId: string,
): Promise<{ data: ApiWorkScheduleRow[] }> {
  const r = await fetch(`${V1_BASE}/work-schedule/me`, {
    method: 'GET',
    headers: v1Headers(token, salonId),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiWorkScheduleRow[] }>;
}

export async function putMyWorkSchedule(
  token: string,
  salonId: string,
  days: ApiWorkSchedulePutDay[],
): Promise<{ data: ApiWorkScheduleRow[] }> {
  const r = await fetch(`${V1_BASE}/work-schedule/me`, {
    method: 'PUT',
    headers: v1Headers(token, salonId),
    body: JSON.stringify({ days }),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiWorkScheduleRow[] }>;
}
