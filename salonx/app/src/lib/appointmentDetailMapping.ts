import type { ClientDetails } from '../data/types';
import {
  getAppointment,
  listAppointments,
  type ApiAppointmentFull,
} from './appointmentApi';
import { getClient, type ApiClientRow } from './clientApi';
import { looksLikeCuid } from './serviceApi';
import { addYears } from 'date-fns';

function dollarsFromCents(n?: number | null): number {
  return n == null ? 0 : Math.round(n / 100);
}

export function fullAppointmentToClientDetails(row: ApiAppointmentFull): ClientDetails {
  const consult = row.consultation;
  const services = [...(row.services ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
  const enhancement = row.enhancement;

  const briefParts = [
    row.bookingNotes,
    consult?.personalNotes,
    ...(consult?.techniqueNotes ?? []).slice(0, 2),
  ].filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  const aiConsultationBrief =
    briefParts.length > 0 ? briefParts.join(' · ').slice(0, 400) : undefined;

  return {
    id: row.client.id,
    clientName: row.client.fullName,
    phone: row.client.phone ?? undefined,
    aiConsultationBrief,
    date: new Date(row.startAt),
    duration: Math.max(
      0,
      Math.round((new Date(row.endAt).getTime() - new Date(row.startAt).getTime()) / 60000),
    ),
    techniqueNotes: consult?.techniqueNotes ?? [],
    personalNotes: consult?.personalNotes ?? '',
    services: services.map((s) => ({
      id: s.id,
      name: s.nameSnapshot,
      price: dollarsFromCents(s.priceCentsSnapshot),
      completed: s.completed,
      catalogServiceId: s.serviceId ?? undefined,
    })),
    recommendations: enhancement
      ? [
          {
            id: `rec-${row.id}`,
            name: enhancement.serviceNameSnapshot ?? enhancement.title,
            caption: enhancement.suggestion,
            price: dollarsFromCents(enhancement.priceCents),
            completed: Boolean(enhancement.accepted),
          },
        ]
      : [],
    products: [
      ...(row.productsUsed ?? []).map((p) => ({
        id: p.id,
        brand: p.brandSnapshot,
        name: p.nameSnapshot,
        price: dollarsFromCents(p.priceCentsSnapshot),
      })),
      ...(row.productRecommendations ?? []).map((p) => ({
        id: p.id,
        brand: p.brandSnapshot ?? '—',
        name: p.nameSnapshot,
        price: dollarsFromCents(p.priceCentsSnapshot),
      })),
    ],
  };
}

export function apiClientToEmptyClientDetails(client: ApiClientRow): ClientDetails {
  return {
    id: client.id,
    clientName: client.fullName,
    phone: client.phone ?? undefined,
    date: new Date(),
    duration: 0,
    techniqueNotes: [],
    personalNotes: client.notes ?? '',
    services: [],
    recommendations: [],
    products: [],
  };
}

export async function loadClientDetailsFromApi(
  token: string,
  salonId: string,
  normalizedId: string,
): Promise<ClientDetails | null> {
  if (normalizedId.startsWith('appointment-')) {
    const aid = normalizedId.replace('appointment-', '');
    if (!looksLikeCuid(aid)) return null;
    const { data } = await getAppointment(token, salonId, aid);
    return fullAppointmentToClientDetails(data);
  }

  if (!looksLikeCuid(normalizedId)) return null;

  const { data: clientRow } = await getClient(token, salonId, normalizedId);
  const { data: apts } = await listAppointments(token, salonId, {
    from: new Date(0),
    to: addYears(new Date(), 2),
    take: 500,
  });
  const mine = apts
    .filter((a) => a.clientId === normalizedId)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())[0];

  if (mine) {
    const { data: full } = await getAppointment(token, salonId, mine.id);
    return fullAppointmentToClientDetails(full);
  }

  return apiClientToEmptyClientDetails(clientRow);
}
