import { API_BASE_URL, apiOrigin } from '../config/api';

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

function authHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Origin: apiOrigin(),
    Authorization: `Bearer ${token}`,
  };
}

const AUTH_PREFIX = `${API_BASE_URL}/api/auth`;

export type BaOrganization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: string;
  metadata?: unknown;
};

/** `GET /api/auth/organization/list` */
export async function listOrganizations(token: string): Promise<BaOrganization[]> {
  const r = await fetch(`${AUTH_PREFIX}/organization/list`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<BaOrganization[]>;
}

/** `POST /api/auth/organization/set-active` */
export async function setActiveOrganization(
  token: string,
  body: { organizationId: string | null; organizationSlug?: string | null },
): Promise<BaOrganization | null> {
  const r = await fetch(`${AUTH_PREFIX}/organization/set-active`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<BaOrganization | null>;
}

/** `POST /api/auth/organization/check-slug` — `true` if slug is available. */
export async function checkOrganizationSlugAvailable(token: string, slug: string): Promise<boolean> {
  const r = await fetch(`${AUTH_PREFIX}/organization/check-slug`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ slug }),
  });
  if (r.ok) {
    const j = (await r.json()) as { status?: boolean };
    return j.status === true;
  }
  return false;
}

/** `POST /api/auth/organization/create` */
export async function createOrganization(
  token: string,
  body: { name: string; slug: string; logo?: string },
): Promise<BaOrganization & { members?: unknown[] }> {
  const r = await fetch(`${AUTH_PREFIX}/organization/create`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<BaOrganization & { members?: unknown[] }>;
}
