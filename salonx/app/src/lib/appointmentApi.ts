import type { CalendarEvent } from '../data/events';
import { readV1ErrorMessage, v1Headers, V1_BASE } from './httpV1';

export type ApiAppointmentListRow = {
  id: string;
  clientId: string;
  startAt: string;
  endAt: string;
  status: string;
  seriesId?: string | null;
  color?: string | null;
  isParked: boolean;
  bookingNotes?: string | null;
  client: { id: string; fullName: string; phone?: string | null };
  services?: {
    id: string;
    serviceId?: string | null;
    nameSnapshot: string;
    priceCentsSnapshot?: number | null;
    completed: boolean;
    orderIndex: number;
  }[];
};

/** Response shape from GET/POST/PATCH appointment with full include (nested relations). */
export type ApiAppointmentFull = ApiAppointmentListRow & {
  consultation?: {
    techniqueNotes: string[];
    personalNotes: string;
    durationMin?: number | null;
  } | null;
  services: NonNullable<ApiAppointmentListRow['services']>;
  productsUsed: {
    id: string;
    productId?: string | null;
    brandSnapshot: string;
    nameSnapshot: string;
    priceCentsSnapshot?: number | null;
  }[];
  productRecommendations: {
    id: string;
    productId?: string | null;
    brandSnapshot?: string | null;
    nameSnapshot: string;
    priceCentsSnapshot?: number | null;
    reason?: string | null;
  }[];
  enhancement?: {
    title: string;
    suggestion: string;
    serviceNameSnapshot?: string | null;
    priceCents?: number | null;
    accepted?: boolean | null;
  } | null;
  nextVisitPlan?: {
    suggestedDate?: string | null;
    suggestedAfterWeeks?: number | null;
    suggestedServiceNameSnapshot?: string | null;
    note?: string | null;
  } | null;
};

export type CreateAppointmentBody = {
  clientId: string;
  startAt: string;
  endAt: string;
  status?: string;
  seriesId?: string | null;
  color?: string | null;
  isParked?: boolean;
  bookingNotes?: string | null;
  primaryStylistId?: string | null;
  services?: {
    serviceId?: string | null;
    nameSnapshot: string;
    priceCentsSnapshot?: number | null;
    completed?: boolean;
    orderIndex?: number;
  }[];
};

export async function listAppointments(
  token: string,
  salonId: string,
  query: { from?: Date; to?: Date; take?: number },
): Promise<{ data: ApiAppointmentListRow[] }> {
  const q = new URLSearchParams();
  if (query.from) q.set('from', query.from.toISOString());
  if (query.to) q.set('to', query.to.toISOString());
  if (query.take != null) q.set('take', String(query.take));
  const qs = q.toString();
  const url = `${V1_BASE}/appointments${qs ? `?${qs}` : ''}`;
  const r = await fetch(url, { method: 'GET', headers: v1Headers(token, salonId) });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiAppointmentListRow[] }>;
}

export async function getAppointment(
  token: string,
  salonId: string,
  appointmentId: string,
): Promise<{ data: ApiAppointmentFull }> {
  const r = await fetch(`${V1_BASE}/appointments/${encodeURIComponent(appointmentId)}`, {
    method: 'GET',
    headers: v1Headers(token, salonId),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiAppointmentFull }>;
}

export async function createAppointment(
  token: string,
  salonId: string,
  body: CreateAppointmentBody,
): Promise<{ data: ApiAppointmentFull }> {
  const r = await fetch(`${V1_BASE}/appointments`, {
    method: 'POST',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiAppointmentFull }>;
}

export async function patchAppointment(
  token: string,
  salonId: string,
  appointmentId: string,
  body: Record<string, unknown>,
): Promise<{ data: ApiAppointmentFull }> {
  const r = await fetch(`${V1_BASE}/appointments/${encodeURIComponent(appointmentId)}`, {
    method: 'PATCH',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiAppointmentFull }>;
}

export type ApiAppointmentFlow = {
  appointment: ApiAppointmentFull & {
    media?: {
      beforeUrl?: string | null;
      afterUrl?: string | null;
      beforeCapturedAt?: string | null;
      afterCapturedAt?: string | null;
    } | null;
    careCardFeedback?: { rating: number; ratedAt: string } | null;
    rampPost?: { caption: string; referralUrl: string; tags: string[]; copiedAt?: string | null } | null;
    nextVisitPlan?: (NonNullable<ApiAppointmentFull['nextVisitPlan']> & { bookedAppointmentId?: string | null }) | null;
  };
  gates: {
    hasBefore: boolean;
    hasAfter: boolean;
    careRating: number | null;
    nextBookedAppointmentId: string | null;
  };
  nextBooked: { id: string; startAt: string; endAt: string; status: string } | null;
};

export async function getAppointmentFlow(
  token: string,
  salonId: string,
  appointmentId: string,
): Promise<{ data: ApiAppointmentFlow }> {
  const r = await fetch(`${V1_BASE}/appointments/${encodeURIComponent(appointmentId)}/flow`, {
    method: 'GET',
    headers: v1Headers(token, salonId),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiAppointmentFlow }>;
}

export async function patchAppointmentMedia(
  token: string,
  salonId: string,
  appointmentId: string,
  body: { beforeUrl?: string | null; afterUrl?: string | null },
): Promise<{ data: { beforeUrl?: string | null; afterUrl?: string | null } }> {
  const r = await fetch(`${V1_BASE}/appointments/${encodeURIComponent(appointmentId)}/media`, {
    method: 'PATCH',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: { beforeUrl?: string | null; afterUrl?: string | null } }>;
}

export async function bookNextAppointment(
  token: string,
  salonId: string,
  appointmentId: string,
  body: { startAt: string; endAt: string },
): Promise<{ data: { booked: { id: string; startAt: string; endAt: string; status: string } } }> {
  const r = await fetch(`${V1_BASE}/appointments/${encodeURIComponent(appointmentId)}/next-booking`, {
    method: 'POST',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: { booked: { id: string; startAt: string; endAt: string; status: string } } }>;
}

export async function submitCareRating(
  token: string,
  salonId: string,
  appointmentId: string,
  body: { rating: number },
): Promise<{ data: { rating: number } }> {
  const r = await fetch(`${V1_BASE}/appointments/${encodeURIComponent(appointmentId)}/care-card/rating`, {
    method: 'POST',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: { rating: number } }>;
}

export type ApiRampPostPayload = {
  caption: string;
  referralUrl: string;
  tags: string[];
  copiedAt?: string | null;
  beforeUrl: string | null;
  afterUrl: string | null;
};

export async function buildRampPost(
  token: string,
  salonId: string,
  appointmentId: string,
): Promise<{ data: ApiRampPostPayload }> {
  const r = await fetch(`${V1_BASE}/appointments/${encodeURIComponent(appointmentId)}/ramp-post/build`, {
    method: 'POST',
    headers: v1Headers(token, salonId),
    body: '{}',
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiRampPostPayload }>;
}

export async function markRampPostCopied(
  token: string,
  salonId: string,
  appointmentId: string,
): Promise<{ data: { copiedAt?: string | null } }> {
  const r = await fetch(`${V1_BASE}/appointments/${encodeURIComponent(appointmentId)}/ramp-post/copied`, {
    method: 'POST',
    headers: v1Headers(token, salonId),
    body: '{}',
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: { copiedAt?: string | null } }>;
}

export async function resetAppointmentFlowDemo(
  token: string,
  salonId: string,
  appointmentId: string,
): Promise<void> {
  const r = await fetch(`${V1_BASE}/appointments/${encodeURIComponent(appointmentId)}/flow/reset`, {
    method: 'POST',
    headers: v1Headers(token, salonId),
    body: '{}',
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
}

export function listRowToCalendarEvent(row: ApiAppointmentListRow): CalendarEvent {
  const primary = row.services?.[0];
  return {
    id: row.id,
    title: row.client?.fullName ?? 'Client',
    clientName: row.bookingNotes?.trim() || undefined,
    service: primary?.nameSnapshot,
    customerId: row.clientId,
    serviceId: primary?.serviceId ?? undefined,
    seriesId: row.seriesId ?? undefined,
    start: new Date(row.startAt),
    end: new Date(row.endAt),
    color: row.color ?? undefined,
    allDay: false,
    isParked: row.isParked ?? false,
    notes: row.bookingNotes ?? undefined,
  };
}

export function fullAppointmentToCalendarEvent(row: ApiAppointmentFull): CalendarEvent {
  return listRowToCalendarEvent(row);
}

export function partialEventToPatchBody(updates: Partial<Omit<CalendarEvent, 'id'>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (updates.start !== undefined) {
    const s = updates.start;
    out.startAt = s instanceof Date ? s.toISOString() : new Date(s as string).toISOString();
  }
  if (updates.end !== undefined) {
    const e = updates.end;
    out.endAt = e instanceof Date ? e.toISOString() : new Date(e as string).toISOString();
  }
  if (updates.color !== undefined) out.color = updates.color;
  if (updates.notes !== undefined) out.bookingNotes = updates.notes;
  if (updates.customerId !== undefined) out.clientId = updates.customerId;
  if (updates.isParked !== undefined) out.isParked = updates.isParked;
  return out;
}

export function calendarEventToCreateBody(
  ev: Omit<CalendarEvent, 'id'> & { title: string },
): CreateAppointmentBody {
  const clientId = ev.customerId;
  if (!clientId) {
    throw new Error('Missing client (customerId) for appointment');
  }
  const nameSnapshot = ev.service?.trim() || 'Service';
  const priceCents =
    ev.price != null && Number.isFinite(Number(ev.price))
      ? Math.round(Number(ev.price) * 100)
      : undefined;
  const lines: CreateAppointmentBody['services'] = [];
  if (ev.serviceId) {
    lines.push({
      serviceId: ev.serviceId,
      nameSnapshot,
      priceCentsSnapshot: priceCents ?? null,
      completed: false,
      orderIndex: 0,
    });
  } else {
    lines.push({
      nameSnapshot,
      priceCentsSnapshot: priceCents ?? null,
      completed: false,
      orderIndex: 0,
    });
  }
  return {
    clientId,
    startAt: ev.start.toISOString(),
    endAt: ev.end.toISOString(),
    seriesId: ev.seriesId ?? undefined,
    color: ev.color ?? undefined,
    isParked: ev.isParked ?? false,
    bookingNotes: ev.notes ?? null,
    services: lines,
  };
}
