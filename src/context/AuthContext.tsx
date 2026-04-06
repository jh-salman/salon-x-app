import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { LocalAuthSession } from '../data/types';
import {
  sendOtpRequest,
  signupRequest,
  signOutRequest,
  verifyOtpRequest,
} from '../lib/authApi';
import {
  clearPersistedAuth,
  loadPersistedAuth,
  savePersistedAuth,
  type PersistedAuth,
} from '../lib/authStorage';
import { normalizeUsE164 } from '../lib/phone';

type AuthContextType = {
  user: LocalAuthSession | null;
  /** Bearer token for API calls (avoid logging). */
  token: string | null;
  isReady: boolean;
  /** Register account (no session until OTP verify). */
  signUp: (
    name: string,
    email: string,
    password: string,
    phoneRaw: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Send SMS / dev-console OTP to a registered phone. */
  requestOtp: (phoneRaw: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Complete login — stores token + user. */
  verifyOtp: (
    phoneRaw: string,
    code: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function mapApiUserToSession(u: {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string | null;
}): LocalAuthSession {
  return {
    userId: u.id,
    email: u.email,
    name: u.name,
    phoneNumber: u.phoneNumber ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalAuthSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const persisted = await loadPersistedAuth();
        if (!mounted || !persisted) return;
        setToken(persisted.token);
        setUser(persisted.user);
      } catch {
        await clearPersistedAuth();
      } finally {
        if (mounted) setIsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (next: PersistedAuth | null) => {
    if (!next) {
      await clearPersistedAuth();
      setToken(null);
      setUser(null);
      return;
    }
    await savePersistedAuth(next);
    setToken(next.token);
    setUser(next.user);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string, phoneRaw: string) => {
      const emailT = email.trim().toLowerCase();
      const phoneNumber = normalizeUsE164(phoneRaw);
      if (!emailT || !password || password.length < 8) {
        return { ok: false as const, message: 'Valid email and password (8+ chars) required.' };
      }
      if (!phoneNumber.startsWith('+1') || phoneNumber.length < 12) {
        return { ok: false as const, message: 'Use a valid US phone number (+1…).' };
      }
      try {
        await signupRequest({
          email: emailT,
          password,
          phoneNumber,
          name: name.trim() || undefined,
        });
        return { ok: true as const };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Sign up failed.';
        return { ok: false as const, message: msg };
      }
    },
    [],
  );

  const requestOtp = useCallback(async (phoneRaw: string) => {
    const phoneNumber = normalizeUsE164(phoneRaw);
    if (!phoneNumber.startsWith('+1')) {
      return { ok: false as const, message: 'Use a valid US phone number (+1…).' };
    }
    try {
      await sendOtpRequest(phoneNumber);
      return { ok: true as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not send code.';
      return { ok: false as const, message: msg };
    }
  }, []);

  const verifyOtp = useCallback(
    async (phoneRaw: string, code: string) => {
      const phoneNumber = normalizeUsE164(phoneRaw);
      const trimmed = code.trim();
      if (!trimmed) {
        return { ok: false as const, message: 'Enter the verification code.' };
      }
      try {
        const res = await verifyOtpRequest(phoneNumber, trimmed);
        const t = res.token;
        if (!t) {
          return { ok: false as const, message: 'No session token returned.' };
        }
        await persist({
          token: t,
          user: mapApiUserToSession(res.user),
        });
        return { ok: true as const };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Verification failed.';
        return { ok: false as const, message: msg };
      }
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    const t = token;
    try {
      if (t) await signOutRequest(t);
    } catch {
      // still clear local session
    }
    await persist(null);
  }, [token, persist]);

  const value = useMemo(
    () => ({
      user,
      token,
      isReady,
      signUp,
      requestOtp,
      verifyOtp,
      signOut,
    }),
    [user, token, isReady, signUp, requestOtp, verifyOtp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
