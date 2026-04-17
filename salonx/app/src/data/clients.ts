/**
 * Clients: types and helpers. All types in ./types.ts; mock in ./mockData.ts.
 */

import type { AppointmentLike, CalendarEvent, ClientDetails } from './types';
import { MOCK_CLIENT_DETAILS } from './mockData';

export type { ClientDetails, ClientSummary, Service, Product, AppointmentLike } from './types';
export { MOCK_CLIENTS, MOCK_CLIENT_DETAILS } from './mockData';

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Merge calendar events + detail id to fill visitCount when missing.
 * Matches by client name on event title or `customerId === details.id`.
 */
export function enrichClientDetailsFromEvents(details: ClientDetails, events: CalendarEvent[]): ClientDetails {
  const name = norm(details.clientName);
  const fromEvents = events.filter(
    (e) =>
      norm(e.title) === name ||
      (e.customerId != null && e.customerId === details.id) ||
      (e.clientName != null && norm(e.clientName) === name),
  ).length;
  const visitCount =
    details.visitCount ??
    (fromEvents > 0 ? fromEvents : 1);
  const aiConsultationBrief =
    details.aiConsultationBrief?.trim() ||
    (details.techniqueNotes[0]?.trim()
      ? `Today’s focus: ${details.techniqueNotes[0]}`
      : undefined);
  return {
    ...details,
    visitCount,
    ...(aiConsultationBrief ? { aiConsultationBrief } : {}),
  };
}

/** Build ClientDetails from an appointment when client not in mock data */
export function getClientDetailsForAppointment(apt: AppointmentLike): ClientDetails {
  const hasValidStart =
    apt.startTime instanceof Date && !Number.isNaN(apt.startTime.getTime());
  const hasValidEnd =
    apt.endTime instanceof Date && !Number.isNaN(apt.endTime.getTime());
  const duration =
    hasValidStart && hasValidEnd
      ? Math.max(
          0,
          Math.round((apt.endTime.getTime() - apt.startTime.getTime()) / (1000 * 60))
        )
      : 0;
  const safeClientName =
    typeof apt.clientName === 'string' && apt.clientName.trim().length > 0
      ? apt.clientName.trim()
      : 'Client';
  const safeService =
    typeof apt.service === 'string' && apt.service.trim().length > 0
      ? apt.service.trim()
      : 'Service';
  const safeDate = hasValidStart ? apt.startTime : new Date();
  const matching = Object.values(MOCK_CLIENT_DETAILS).find(
    (c) => c.clientName === safeClientName
  );
  if (matching) {
    return { ...matching, date: safeDate, duration };
  }
  return {
    id: `appointment-${apt.id}`,
    clientName: safeClientName,
    phone: undefined,
    aiConsultationBrief: safeService ? `Booked service: ${safeService}` : undefined,
    date: safeDate,
    duration,
    techniqueNotes: safeService ? [safeService] : [],
    personalNotes: '',
    services: [{ id: 's1', name: safeService, price: 0, completed: true }],
    recommendations: [],
    products: [],
  };
}

/**
 * Resolve `ClientDetails` for a client route id (`client-*` or `appointment-*`) + live calendar events.
 */
export function resolveClientDetailsForRouteId(
  normalizedId: string,
  events: CalendarEvent[]
): ClientDetails | null {
  if (normalizedId.startsWith('appointment-')) {
    const eventId = normalizedId.replace('appointment-', '');
    const event = events.find((e) => e.id === eventId);
    if (!event) {
      return null;
    }
    const hasValidStart =
      event.start instanceof Date && !Number.isNaN(event.start.getTime());
    const hasValidEnd = event.end instanceof Date && !Number.isNaN(event.end.getTime());
    if (!hasValidStart || !hasValidEnd) {
      return null;
    }
    return enrichClientDetailsFromEvents(
      getClientDetailsForAppointment({
        id: event.id,
        clientName: event.title,
        service: event.clientName || event.service || '',
        startTime: event.start,
        endTime: event.end,
      }),
      events,
    );
  }
  const base = MOCK_CLIENT_DETAILS[normalizedId] ?? null;
  return base ? enrichClientDetailsFromEvents(base, events) : null;
}
