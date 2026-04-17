import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { getGhostNotesSession, type GhostNotesSessionData } from '../lib/ghostNotesApi';

export function useGhostNotesSession(appointmentId: string | undefined) {
  const { token } = useAuth();
  const { currentSalonId } = useTenant();
  const [data, setData] = useState<GhostNotesSessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!appointmentId || !token || !currentSalonId) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getGhostNotesSession(token, currentSalonId, appointmentId);
      setData(res.data);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Failed to load Ghost Notes');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, token, currentSalonId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
