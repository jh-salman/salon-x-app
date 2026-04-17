import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

export type AppointmentMedia = {
  beforeUri?: string;
  afterUri?: string;
  beforeCapturedAt?: number;
  afterCapturedAt?: number;
};

function mediaKey(detailId: string) {
  return `@appointment_media:${detailId}`;
}

async function readMedia(detailId: string): Promise<AppointmentMedia | null> {
  const raw = await AsyncStorage.getItem(mediaKey(detailId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AppointmentMedia;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

async function writeMedia(detailId: string, next: AppointmentMedia): Promise<void> {
  await AsyncStorage.setItem(mediaKey(detailId), JSON.stringify(next));
}

export function useAppointmentMedia(detailId: string | null | undefined) {
  const [media, setMedia] = useState<AppointmentMedia | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!detailId) return;
    setLoading(true);
    try {
      const m = await readMedia(detailId);
      setMedia(m);
    } finally {
      setLoading(false);
    }
  }, [detailId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upsert = useCallback(
    async (patch: Partial<AppointmentMedia>) => {
      if (!detailId) return;
      const existing = (await readMedia(detailId)) ?? {};
      const next: AppointmentMedia = { ...existing, ...patch };
      await writeMedia(detailId, next);
      setMedia(next);
    },
    [detailId],
  );

  const hasBefore = useMemo(() => !!media?.beforeUri, [media?.beforeUri]);
  const hasAfter = useMemo(() => !!media?.afterUri, [media?.afterUri]);

  return { media, loading, refresh, upsert, hasBefore, hasAfter };
}

