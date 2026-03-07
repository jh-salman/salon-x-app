/**
 * Clients: types and helpers. All types in ./types.ts; mock in ./mockData.ts.
 */

import type { AppointmentLike, ClientDetails } from './types';
import { MOCK_CLIENT_DETAILS } from './mockData';

export type { ClientDetails, ClientSummary, Service, Product, AppointmentLike } from './types';
export { MOCK_CLIENTS, MOCK_CLIENT_DETAILS } from './mockData';

/** Build ClientDetails from an appointment when client not in mock data */
export function getClientDetailsForAppointment(apt: AppointmentLike): ClientDetails {
  const duration = Math.round((apt.endTime.getTime() - apt.startTime.getTime()) / (1000 * 60));
  const matching = Object.values(MOCK_CLIENT_DETAILS).find((c) => c.clientName === apt.clientName);
  if (matching) {
    return { ...matching, date: apt.startTime, duration };
  }
  return {
    id: `appointment-${apt.id}`,
    clientName: apt.clientName,
    phone: undefined,
    date: apt.startTime,
    duration,
    techniqueNotes: apt.service ? [apt.service] : [],
    personalNotes: '',
    services: [{ id: 's1', name: apt.service || 'Service', price: 0, completed: true }],
    recommendations: [],
    products: [],
  };
}
