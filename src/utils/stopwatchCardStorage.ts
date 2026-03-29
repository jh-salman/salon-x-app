import AsyncStorage from '@react-native-async-storage/async-storage';

export const STOPWATCH_CARD_STORAGE_KEY = '@stylist_stopwatch_card_v1';

type InvalidateListener = () => void;
const invalidateListeners = new Set<InvalidateListener>();

export function subscribeStopwatchCardInvalidate(listener: InvalidateListener): () => void {
  invalidateListeners.add(listener);
  return () => invalidateListeners.delete(listener);
}

function notifyInvalidate(): void {
  invalidateListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore subscriber errors.
    }
  });
}

/** Remove persisted stopwatch (card) when appointment is parked / moved / rescheduled. */
export async function purgeStopwatchForAppointmentIds(appointmentIds: string[]): Promise<void> {
  if (appointmentIds.length === 0) return;
  const idSet = new Set(appointmentIds);
  try {
    const raw = await AsyncStorage.getItem(STOPWATCH_CARD_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return;
    const next: Record<string, unknown> = { ...parsed };
    let changed = false;
    for (const id of Object.keys(parsed)) {
      if (idSet.has(id)) {
        delete next[id];
        changed = true;
      }
    }
    if (!changed) return;
    await AsyncStorage.setItem(STOPWATCH_CARD_STORAGE_KEY, JSON.stringify(next));
    notifyInvalidate();
  } catch {
    // Ignore malformed storage.
  }
}
