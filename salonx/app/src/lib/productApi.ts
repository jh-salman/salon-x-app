import { readV1ErrorMessage, v1Headers, V1_BASE } from './httpV1';

export type ApiProductRow = {
  id: string;
  salonId?: string;
  brand: string;
  name: string;
  priceCents?: number | null;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function listProducts(
  token: string,
  salonId: string,
): Promise<{ data: ApiProductRow[] }> {
  const r = await fetch(`${V1_BASE}/products`, {
    method: 'GET',
    headers: v1Headers(token, salonId),
  });
  if (!r.ok) throw new Error(await readV1ErrorMessage(r));
  return r.json() as Promise<{ data: ApiProductRow[] }>;
}
