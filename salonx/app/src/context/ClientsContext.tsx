import React, { useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CustomerOption } from '../components/CustomerDropdown';
import { MOCK_CLIENTS } from '../data/clients';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import { listClients, createClient as createClientApi } from '../lib/clientApi';

const STORAGE_KEY = '@calendar_clients';
const SEEDED_KEY = '@calendar_clients_seed_version';
const CURRENT_SEED_VERSION = 'v3';

interface ClientsContextType {
  clients: CustomerOption[];
  addClient: (client: Omit<CustomerOption, 'id'>) => Promise<CustomerOption>;
  setClients: React.Dispatch<React.SetStateAction<CustomerOption[]>>;
  lastAddedClient: CustomerOption | null;
  clearLastAddedClient: () => void;
  refreshClients: () => Promise<void>;
  isLoading: boolean;
  syncError: string | null;
}

const ClientsContext = React.createContext<ClientsContextType | null>(null);

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { currentSalonId } = useTenant();
  const canUseApi = Boolean(token && currentSalonId);

  const [clients, setClients] = useState<CustomerOption[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastAddedClient, setLastAddedClient] = useState<CustomerOption | null>(null);

  const mapRowsToOptions = useCallback(
    (rows: { id: string; fullName: string }[]): CustomerOption[] =>
      rows.map((r) => ({ id: r.id, name: r.fullName })),
    [],
  );

  const refreshClients = useCallback(async () => {
    if (!token || !currentSalonId) return;
    setIsLoading(true);
    setSyncError(null);
    try {
      const { data } = await listClients(token, currentSalonId, { take: 500 });
      const mapped = mapRowsToOptions(data);
      setClients(mapped);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load clients';
      setSyncError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [token, currentSalonId, mapRowsToOptions]);

  useEffect(() => {
    if (canUseApi) {
      setHydrated(true);
      void refreshClients();
      return;
    }

    (async () => {
      try {
        const [json, seeded] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SEEDED_KEY),
        ]);

        if (seeded !== CURRENT_SEED_VERSION) {
          const seedClients: CustomerOption[] = MOCK_CLIENTS.slice(0, 4).map((c) => ({
            id: c.id,
            name: c.clientName,
          }));
          setClients(seedClients);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedClients));
          await AsyncStorage.setItem(SEEDED_KEY, CURRENT_SEED_VERSION);
          setHydrated(true);
          return;
        }

        if (json) {
          try {
            const parsed = JSON.parse(json);
            if (Array.isArray(parsed)) {
              setClients(parsed.map((c: CustomerOption) => ({ ...c, id: c.id })));
            }
          } catch {
            /* ignore */
          }
          setHydrated(true);
          return;
        }

        const seedClients: CustomerOption[] = MOCK_CLIENTS.slice(0, 4).map((c) => ({
          id: c.id,
          name: c.clientName,
        }));
        setClients(seedClients);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedClients));
        await AsyncStorage.setItem(SEEDED_KEY, CURRENT_SEED_VERSION);
      } catch {
        /* ignore */
      } finally {
        setHydrated(true);
      }
    })();
  }, [canUseApi, refreshClients]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients, hydrated]);

  const addClient = async (client: Omit<CustomerOption, 'id'>): Promise<CustomerOption> => {
    if (canUseApi && token && currentSalonId) {
      const { data } = await createClientApi(token, currentSalonId, {
        fullName: client.name.trim() || 'Client',
        phone: null,
        photoUrl: null,
        notes: null,
      });
      const opt = { id: data.id, name: data.fullName };
      setClients((prev) => {
        const withoutDup = prev.filter((c) => c.id !== opt.id);
        return [...withoutDup, opt];
      });
      setLastAddedClient(opt);
      return opt;
    }

    const id = `c-${Date.now()}`;
    const newClient = { ...client, id } as CustomerOption;
    setClients((prev) => [...prev, newClient]);
    setLastAddedClient(newClient);
    return newClient;
  };

  const clearLastAddedClient = () => setLastAddedClient(null);

  return (
    <ClientsContext.Provider
      value={{
        clients,
        addClient,
        setClients,
        lastAddedClient,
        clearLastAddedClient,
        refreshClients,
        isLoading,
        syncError,
      }}
    >
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error('useClients must be used within ClientsProvider');
  return ctx;
}
