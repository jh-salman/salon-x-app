import { readV1ErrorMessage, v1Headers, V1_BASE } from './httpV1';

export type ApiClientRow = {
  id: string;
  salonId?: string;
  fullName: string;
  phone?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function listClients(
  token: string,
  salonId: string,
  query?: { q?: string; take?: number },
): Promise<{ data: ApiClientRow[] }> {
  const q = new URLSearchParams();
  if (query?.q) q.set('q', query.q);
  if (query?.take != null) q.set('take', String(query.take));
  const qs = q.toString();
  const r = await fetch(`${V1_BASE}/clients${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: v1Headers(token, salonId),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiClientRow[] }>;
}

export async function getClient(
  token: string,
  salonId: string,
  clientId: string,
): Promise<{ data: ApiClientRow }> {
  const r = await fetch(`${V1_BASE}/clients/${encodeURIComponent(clientId)}`, {
    method: 'GET',
    headers: v1Headers(token, salonId),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiClientRow }>;
}

export async function createClient(
  token: string,
  salonId: string,
  body: { fullName: string; phone?: string | null; photoUrl?: string | null; notes?: string | null },
): Promise<{ data: ApiClientRow }> {
  const r = await fetch(`${V1_BASE}/clients`, {
    method: 'POST',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiClientRow }>;
}

export type ApiClientVisitHistoryItem = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  bookingNotes?: string | null;
  services: { nameSnapshot: string; completed: boolean; orderIndex: number }[];
  consultation: { personalNotes: string; techniqueNotes: string[] } | null;
};


/** Ghost Notes — prior visits (`GET /api/v1/clients/:clientId/history`). */
export async function getClientVisitHistory(
  token: string,
  salonId: string,
  clientId: string,
  query?: { page?: number; take?: number },
): Promise<{
  data: {
    items: ApiClientVisitHistoryItem[];
    page: number;
    take: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}> {
  const q = new URLSearchParams();
  if (query?.page != null) q.set('page', String(query.page));
  if (query?.take != null) q.set('take', String(query.take));
  const qs = q.toString();
  const r = await fetch(
    `${V1_BASE}/clients/${encodeURIComponent(clientId)}/history${qs ? `?${qs}` : ''}`,
    {
      method: 'GET',
      headers: v1Headers(token, salonId),
    },
  );
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{
    data: {
      items: ApiClientVisitHistoryItem[];
      page: number;
      take: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  }>;
}
