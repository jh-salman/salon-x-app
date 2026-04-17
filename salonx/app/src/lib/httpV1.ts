import { API_BASE_URL, apiOrigin } from '../config/api';

export const V1_BASE = `${API_BASE_URL}/api/v1`;

export async function readV1ErrorMessage(r: Response): Promise<string> {
  try {
    const j = (await r.json()) as Record<string, unknown>;
    const err = j?.error as { message?: string } | undefined;
    if (err?.message && typeof err.message === 'string') return err.message;
    if (typeof j.message === 'string') return j.message;
  } catch {
    /* ignore */
  }
  return `Request failed (${r.status})`;
}

export function v1Headers(token: string, salonId: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Origin: apiOrigin(),
    Authorization: `Bearer ${token}`,
    'x-salon-id': salonId,
  };
}
