import { useEffect, useRef, useState } from 'react';
import type { CalendarEvent } from '../data/events';
import type { ClientDetails } from '../data/types';
import { enrichClientDetailsFromEvents, resolveClientDetailsForRouteId } from '../data/clients';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { loadClientDetailsFromApi } from '../lib/appointmentDetailMapping';

/**
 * Resolves client-detail payloads from the API when signed in; falls back to mock + in-memory calendar events.
 * `events` is read from a ref so calendar sync does not remount the detail screen in a loading state.
 */
export function useResolvedClientDetails(
  normalizedId: string | undefined,
  events: CalendarEvent[],
): { details: ClientDetails | null; loading: boolean } {
  const { token } = useAuth();
  const { currentSalonId } = useTenant();
  const [details, setDetails] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!normalizedId) {
      setDetails(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      const ev = eventsRef.current;
           if (!token || !currentSalonId) {
        setDetails(resolveClientDetailsForRouteId(normalizedId, ev) ?? null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fromApi = await loadClientDetailsFromApi(token, currentSalonId, normalizedId);
        if (cancelled) return;
        if (fromApi) {
          setDetails(enrichClientDetailsFromEvents(fromApi, ev));
          return;
        }
        setDetails(resolveClientDetailsForRouteId(normalizedId, ev) ?? null);
      } catch {
        if (!cancelled) {
          setDetails(resolveClientDetailsForRouteId(normalizedId, ev) ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [normalizedId, token, currentSalonId]);

  return { details, loading };
}
