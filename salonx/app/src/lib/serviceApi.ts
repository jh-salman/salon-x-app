import { API_BASE_URL, apiOrigin } from '../config/api';
import type { PriceType as UiPriceType } from '../data/services';
import type { ServiceOption } from '../data/services';

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

export type ApiPriceType = 'FIXED' | 'STARTS_FROM' | 'VARIES';

export type ApiServiceRow = {
  id: string;
  salonId: string;
  name: string;
  description?: string | null;
  durationMin?: number | null;
  priceCents?: number | null;
  priceType: ApiPriceType;
  calendarColor?: string | null;
  requireDeposit: boolean;
  depositCents?: number | null;
  assignedUserId?: string | null;
  assignedUser?: { id: string; name: string; image?: string | null } | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateServiceBody = {
  name: string;
  description?: string | null;
  durationMin?: number | null;
  priceCents?: number | null;
  priceType?: ApiPriceType;
  calendarColor?: string | null;
  requireDeposit?: boolean;
  depositCents?: number | null;
  assignedUserId?: string | null;
};

export type UpdateServiceBody = Partial<CreateServiceBody>;

/** Prisma/Better Auth cuid — rough check to avoid sending mock ids like `tm1`. */
export function looksLikeCuid(id: string): boolean {
  return /^c[a-z0-9]{20,}$/i.test(id.trim());
}

function uiPriceTypeToApi(t?: UiPriceType): ApiPriceType {
  switch (t) {
    case 'starts_from':
      return 'STARTS_FROM';
    case 'varies':
      return 'VARIES';
    default:
      return 'FIXED';
  }
}

function apiPriceTypeToUi(t: ApiPriceType): UiPriceType {
  switch (t) {
    case 'STARTS_FROM':
      return 'starts_from';
    case 'VARIES':
      return 'varies';
    default:
      return 'fixed';
  }
}

/** Map API row → calendar `ServiceOption` (local-only fields omitted). */
export function apiServiceToOption(row: ApiServiceRow): ServiceOption {
  const price = row.priceCents != null ? row.priceCents / 100 : undefined;
  const depositAmount =
    row.depositCents != null ? row.depositCents / 100 : undefined;
  return {
    id: row.id,
    name: row.name,
    duration: row.durationMin ?? undefined,
    price,
    description: row.description ?? undefined,
    calendarColor: row.calendarColor ?? undefined,
    priceType: apiPriceTypeToUi(row.priceType),
    requireDeposit: row.requireDeposit,
    depositAmount,
    teamMemberId: row.assignedUserId ?? undefined,
    teamMemberName: row.assignedUser?.name,
  };
}

/** Build create payload from the new-service form model. */
export function serviceOptionToCreateBody(opt: Omit<ServiceOption, 'id'>): CreateServiceBody {
  const priceCents =
    opt.price != null && Number.isFinite(opt.price)
      ? Math.round(opt.price * 100)
      : undefined;
  const depositCents =
    opt.requireDeposit && opt.depositAmount != null && Number.isFinite(opt.depositAmount)
      ? Math.round(opt.depositAmount * 100)
      : opt.requireDeposit
        ? undefined
        : null;
  const assignedUserId =
    opt.teamMemberId && looksLikeCuid(opt.teamMemberId) ? opt.teamMemberId : null;
  return {
    name: opt.name.trim() || 'Service',
    description: opt.description?.trim() || null,
    durationMin: opt.duration != null && opt.duration > 0 ? Math.round(opt.duration) : null,
    priceCents: priceCents ?? null,
    priceType: uiPriceTypeToApi(opt.priceType),
    calendarColor: opt.calendarColor ?? null,
    requireDeposit: opt.requireDeposit ?? false,
    depositCents: depositCents ?? null,
    assignedUserId,
  };
}

export async function listServices(
  token: string,
  salonId: string,
): Promise<{ data: ApiServiceRow[] }> {
  const r = await fetch(`${V1}/services`, {
    method: 'GET',
    headers: v1Headers(token, salonId),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ data: ApiServiceRow[] }>;
}

export async function getService(
  token: string,
  salonId: string,
  serviceId: string,
): Promise<{ data: ApiServiceRow }> {
  const r = await fetch(`${V1}/services/${encodeURIComponent(serviceId)}`, {
    method: 'GET',
    headers: v1Headers(token, salonId),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ data: ApiServiceRow }>;
}

export async function createService(
  token: string,
  salonId: string,
  body: CreateServiceBody,
): Promise<{ data: ApiServiceRow }> {
  const r = await fetch(`${V1}/services`, {
    method: 'POST',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ data: ApiServiceRow }>;
}

export async function updateService(
  token: string,
  salonId: string,
  serviceId: string,
  body: UpdateServiceBody,
): Promise<{ data: ApiServiceRow }> {
  const r = await fetch(`${V1}/services/${encodeURIComponent(serviceId)}`, {
    method: 'PATCH',
    headers: v1Headers(token, salonId),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ data: ApiServiceRow }>;
}

export async function deleteService(
  token: string,
  salonId: string,
  serviceId: string,
): Promise<void> {
  const r = await fetch(`${V1}/services/${encodeURIComponent(serviceId)}`, {
    method: 'DELETE',
    headers: v1Headers(token, salonId),
  });
  if (r.status === 204) return;
  if (!r.ok) throw new Error(await readErrorMessage(r));
}

/** Public catalog — no auth (`Salon.slug`). */
export async function listPublicServicesBySlug(
  salonSlug: string,
): Promise<{ data: ApiServiceRow[]; salon: { id: string; name: string; slug: string } }> {
  const r = await fetch(
    `${V1}/public/salons/${encodeURIComponent(salonSlug)}/services`,
    {
      method: 'GET',
      headers: { Accept: 'application/json', Origin: apiOrigin() },
    },
  );
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{
    data: ApiServiceRow[];
    salon: { id: string; name: string; slug: string };
  }>;
}

export async function getPublicServiceBySlug(
  salonSlug: string,
  serviceId: string,
): Promise<{ data: ApiServiceRow; salon: { id: string; name: string; slug: string } }> {
  const r = await fetch(
    `${V1}/public/salons/${encodeURIComponent(salonSlug)}/services/${encodeURIComponent(serviceId)}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json', Origin: apiOrigin() },
    },
  );
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{
    data: ApiServiceRow;
    salon: { id: string; name: string; slug: string };
  }>;
}
