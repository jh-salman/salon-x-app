import Constants from 'expo-constants';

/**
 * Set `EXPO_PUBLIC_API_URL` in `.env` or `app.json` → `expo.extra.apiUrl`.
 * Android emulator: use `http://10.0.2.2:4000` instead of localhost.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl) return extra.apiUrl.replace(/\/$/, '');
  return 'http://localhost:4000';
}

export const API_BASE_URL = resolveBaseUrl();

export function apiOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL;
  }
}
