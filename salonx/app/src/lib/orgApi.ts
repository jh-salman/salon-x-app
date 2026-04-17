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

/** Better Auth organization member row (includes joined user). */
export type BaOrgMember = {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt?: string;
  user: { id: string; name: string | null; email: string; image?: string | null };
};

/** `GET /api/auth/organization/list-members` */
export async function listOrgMembers(
  token: string,
  organizationId: string,
): Promise<{ members: BaOrgMember[]; total: number }> {
  const q = new URLSearchParams({ organizationId });
  const r = await fetch(`${AUTH_PREFIX}/organization/list-members?${q}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ members: BaOrgMember[]; total: number }>;
}

/** `GET /api/auth/organization/get-active-member-role` */
export async function getActiveOrgMemberRole(
  token: string,
  organizationId: string,
): Promise<{ role: string }> {
  const q = new URLSearchParams({ organizationId });
  const r = await fetch(`${AUTH_PREFIX}/organization/get-active-member-role?${q}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ role: string }>;
}

/** `POST /api/auth/organization/invite-member` — roles: e.g. `member`, `admin` */
export async function inviteOrgMember(
  token: string,
  body: { email: string; role: string; organizationId: string; resend?: boolean },
): Promise<Record<string, unknown>> {
  const r = await fetch(`${AUTH_PREFIX}/organization/invite-member`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<Record<string, unknown>>;
}

/** `GET /api/auth/organization/list-invitations` — pending invites for org */
export async function listOrgInvitations(
  token: string,
  organizationId: string,
): Promise<
  Array<{
    id: string;
    email: string;
    role: string | null;
    status: string;
    organizationId: string;
    expiresAt: string;
    createdAt: string;
  }>
> {
  const q = new URLSearchParams({ organizationId });
  const r = await fetch(`${AUTH_PREFIX}/organization/list-invitations?${q}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<
    Array<{
      id: string;
      email: string;
      role: string | null;
      status: string;
      organizationId: string;
      expiresAt: string;
      createdAt: string;
    }>
  >;
}

/** `GET /api/auth/organization/list-user-invitations` — invites for signed-in user’s email */
export async function listUserInvitations(token: string): Promise<
  Array<{
    id: string;
    email: string;
    role: string;
    organizationId: string;
    organizationName: string;
    status: string;
    expiresAt: string;
    createdAt: string;
  }>
> {
  const r = await fetch(`${AUTH_PREFIX}/organization/list-user-invitations`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<
    Array<{
      id: string;
      email: string;
      role: string;
      organizationId: string;
      organizationName: string;
      status: string;
      expiresAt: string;
      createdAt: string;
    }>
  >;
}

/** `POST /api/auth/organization/cancel-invitation` */
export async function cancelOrgInvitation(token: string, invitationId: string): Promise<unknown> {
  const r = await fetch(`${AUTH_PREFIX}/organization/cancel-invitation`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ invitationId }),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json();
}

/** `POST /api/auth/organization/accept-invitation` */
export async function acceptOrgInvitation(token: string, invitationId: string): Promise<unknown> {
  const r = await fetch(`${AUTH_PREFIX}/organization/accept-invitation`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ invitationId }),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json();
}

/** `POST /api/auth/organization/reject-invitation` */
export async function rejectOrgInvitation(token: string, invitationId: string): Promise<unknown> {
  const r = await fetch(`${AUTH_PREFIX}/organization/reject-invitation`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ invitationId }),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json();
}

/** `POST /api/auth/organization/update-member-role` */
export async function updateOrgMemberRole(
  token: string,
  body: { memberId: string; role: string; organizationId: string },
): Promise<BaOrgMember> {
  const r = await fetch(`${AUTH_PREFIX}/organization/update-member-role`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<BaOrgMember>;
}

/** `POST /api/auth/organization/remove-member` */
export async function removeOrgMember(
  token: string,
  body: { memberIdOrEmail: string; organizationId: string },
): Promise<unknown> {
  const r = await fetch(`${AUTH_PREFIX}/organization/remove-member`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json();
}

/** `POST /api/auth/organization/leave` */
export async function leaveOrganization(token: string, organizationId: string): Promise<unknown> {
  const r = await fetch(`${AUTH_PREFIX}/organization/leave`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ organizationId }),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json();
}
