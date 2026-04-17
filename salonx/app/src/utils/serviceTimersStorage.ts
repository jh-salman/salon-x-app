import AsyncStorage from '@react-native-async-storage/async-storage';

export const SERVICE_TIMERS_STORAGE_KEY = '@stylist_service_timers_v1';

type InvalidateListener = () => void;
const invalidateListeners = new Set<InvalidateListener>();

/** Stylist (or other screens) reload timers when storage is purged so stale in-memory state is not re-saved. */
export function subscribeServiceTimersInvalidate(listener: InvalidateListener): () => void {
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

/** Remove service timer entries tied to these appointment ids (park, move slot, etc.). */
export async function purgeServiceTimersForAppointmentIds(appointmentIds: string[]): Promise<void> {
  if (appointmentIds.length === 0) return;
  const idSet = new Set(appointmentIds);
  try {
    const raw = await AsyncStorage.getItem(SERVICE_TIMERS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, { appointmentId?: string }>;
    if (!parsed || typeof parsed !== 'object') return;
    const next: Record<string, unknown> = {};
    let changed = false;
    for (const [key, entry] of Object.entries(parsed)) {
      const aid =
        entry && typeof entry === 'object' ? (entry as { appointmentId?: string }).appointmentId : undefined;
      if (typeof aid === 'string' && idSet.has(aid)) {
        changed = true;
        continue;
      }
      next[key] = entry;
    }
    if (!changed) return;
    await AsyncStorage.setItem(SERVICE_TIMERS_STORAGE_KEY, JSON.stringify(next));
    notifyInvalidate();
  } catch {
    // Ignore malformed storage.
  }
}
