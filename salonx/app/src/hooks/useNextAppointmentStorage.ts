import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type NextAppointmentStored = {
  startAtIso: string;
  endAtIso: string;
  updatedAt: number;
};

function nextKey(detailId: string) {
  return `@next_appt:${detailId}`;
}

async function readStored(detailId: string): Promise<NextAppointmentStored | null> {
  const raw = await AsyncStorage.getItem(nextKey(detailId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as NextAppointmentStored;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.startAtIso !== 'string' || typeof parsed.endAtIso !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeStored(detailId: string, next: NextAppointmentStored): Promise<void> {
  await AsyncStorage.setItem(nextKey(detailId), JSON.stringify(next));
}

export function useNextAppointmentStorage(detailId: string | null | undefined) {
  const [stored, setStored] = useState<NextAppointmentStored | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!detailId) return;
    setLoading(true);
    try {
      setStored(await readStored(detailId));
    } finally {
      setLoading(false);
    }
  }, [detailId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setNextAppointment = useCallback(
    async (input: { startAt: Date; endAt: Date }) => {
      if (!detailId) return;
      const payload: NextAppointmentStored = {
        startAtIso: input.startAt.toISOString(),
        endAtIso: input.endAt.toISOString(),
        updatedAt: Date.now(),
      };
      await writeStored(detailId, payload);
      setStored(payload);
    },
    [detailId],
  );

  const clear = useCallback(async () => {
    if (!detailId) return;
    await AsyncStorage.removeItem(nextKey(detailId));
    setStored(null);
  }, [detailId]);

  const resolved = useMemo(() => {
    const startAt = stored?.startAtIso ? new Date(stored.startAtIso) : null;
    const endAt = stored?.endAtIso ? new Date(stored.endAtIso) : null;
    const valid =
      startAt instanceof Date &&
      endAt instanceof Date &&
      !Number.isNaN(startAt.getTime()) &&
      !Number.isNaN(endAt.getTime()) &&
      startAt < endAt;
    return { startAt: valid ? startAt : null, endAt: valid ? endAt : null };
  }, [stored]);

  return { stored, resolved, loading, refresh, setNextAppointment, clear };
}

