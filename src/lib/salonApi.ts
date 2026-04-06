import { API_BASE_URL, apiOrigin } from '../config/api';
import type { LocalSalonSummary, SalonMembershipRole } from '../data/types';

async function readErrorMessage(r: Response): Promise<string> {
  try {
    const j = (await r.json()) as Record<string, unknown>;
    const err = j?.error as { message?: string } | undefined;
    if (err?.message && typeof err.message === 'string') return err.message;
    if (typeof j.message === 'string') return j.message;
  } catch {
    // ignore
  }
  return `Request failed (${r.status})`;
}

function v1Headers(token: string, salonId: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Origin: apiOrigin(),
    Authorization: `Bearer ${token}`,
    'x-salon-id': salonId,
  };
}

const V1 = `${API_BASE_URL}/api/v1`;

/** Low-level JSON call for `/api/v1/*` with tenant header. */
export async function v1Json<T>(
  token: string,
  salonId: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${V1}${path.startsWith('/') ? path : `/${path}`}`;
  const r = await fetch(url, {
    ...init,
    headers: {
      ...v1Headers(token, salonId),
      ...init.headers,
    },
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<T>;
}

export type MeSalonRow = {
  salon: LocalSalonSummary;
  role: SalonMembershipRole;
};

/** `GET /api/v1/me/salons` — no `x-salon-id`. */
export async function listMySalons(token: string): Promise<{ data: MeSalonRow[] }> {
  const r = await fetch(`${V1}/me/salons`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Origin: apiOrigin(),
      Authorization: `Bearer ${token}`,
    },
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ data: MeSalonRow[] }>;
}

export type MemberWorkspace = {
  id: string;
  salonId: string;
  userId: string;
  displayNameOverride: string | null;
  info: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getWorkspace(
  token: string,
  salonId: string,
): Promise<{ data: MemberWorkspace | null }> {
  const r = await fetch(`${V1}/workspace`, {
    method: 'GET',
    headers: v1Headers(token, salonId),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ data: MemberWorkspace | null }>;
}

export async function patchWorkspace(
  token: string,
  salonId: string,
  body: { displayNameOverride?: string | null; info?: string | null },
): Promise<{ data: MemberWorkspace }> {
  const r = await fetch(`${V1}/workspace`, {
    method: 'PATCH',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ data: MemberWorkspace }>;
}

export type SalonBusinessProfile = {
  id: string;
  salonId: string;
  legalName: string | null;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getBusiness(
  token: string,
  salonId: string,
): Promise<{ data: SalonBusinessProfile | null }> {
  const r = await fetch(`${V1}/business`, {
    method: 'GET',
    headers: v1Headers(token, salonId),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ data: SalonBusinessProfile | null }>;
}

export async function patchBusiness(
  token: string,
  salonId: string,
  body: Partial<{
    legalName: string | null;
    taxId: string | null;
    phone: string | null;
    email: string | null;
    websiteUrl: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    country: string | null;
  }>,
): Promise<{ data: SalonBusinessProfile }> {
  const r = await fetch(`${V1}/business`, {
    method: 'PATCH',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ data: SalonBusinessProfile }>;
}

export type SalonSettingsRow = {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO';
};

/** `PATCH /api/v1/salon` — plan (OWNER/ADMIN). */
export async function patchSalonSettings(
  token: string,
  salonId: string,
  body: { plan: 'FREE' | 'PRO' },
): Promise<{ data: SalonSettingsRow }> {
  const r = await fetch(`${V1}/salon`, {
    method: 'PATCH',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ data: SalonSettingsRow }>;
}

/** Invites & org CRUD: `../lib/orgApi` → `/api/auth/organization/*`. */
