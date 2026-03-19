/**
 * Clients: types and helpers. All types in ./types.ts; mock in ./mockData.ts.
 */

import type { AppointmentLike, ClientDetails } from './types';
import { MOCK_CLIENT_DETAILS } from './mockData';

export type { ClientDetails, ClientSummary, Service, Product, AppointmentLike } from './types';
export { MOCK_CLIENTS, MOCK_CLIENT_DETAILS } from './mockData';

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
    date: safeDate,
    duration,
    techniqueNotes: safeService ? [safeService] : [],
    personalNotes: '',
    services: [{ id: 's1', name: safeService, price: 0, completed: true }],
    recommendations: [],
    products: [],
  };
}
