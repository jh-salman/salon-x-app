import { API_BASE_URL, apiOrigin } from '../config/api';

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
};

async function readErrorMessage(r: Response): Promise<string> {
  try {
    const j = (await r.json()) as Record<string, unknown>;
    const err = j?.error as { message?: string; code?: string } | undefined;
    if (err?.message && typeof err.message === 'string') return err.message;
    if (typeof j.message === 'string') return j.message;
  } catch {
    // ignore
  }
  return `Request failed (${r.status})`;
}

const jsonHeaders = (token?: string): Record<string, string> => {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Origin: apiOrigin(),
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

export async function signupRequest(body: {
  email: string;
  password: string;
  phoneNumber: string;
  name?: string;
}): Promise<{ user: ApiUser }> {
  const r = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<{ user: ApiUser }>;
}

export async function sendOtpRequest(phoneNumber: string): Promise<void> {
  const r = await fetch(`${API_BASE_URL}/api/auth/phone-number/send-otp`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ phoneNumber }),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
}

export type VerifyResponse = {
  status: boolean;
  token: string | null;
  user: ApiUser;
};

export async function verifyOtpRequest(
  phoneNumber: string,
  code: string,
): Promise<VerifyResponse> {
  const r = await fetch(`${API_BASE_URL}/api/auth/phone-number/verify`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ phoneNumber, code }),
  });
  if (!r.ok) throw new Error(await readErrorMessage(r));
  return r.json() as Promise<VerifyResponse>;
}

export async function signOutRequest(token: string): Promise<void> {
  const r = await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: '{}',
  });
  if (!r.ok && r.status !== 401) {
    throw new Error(await readErrorMessage(r));
  }
}
