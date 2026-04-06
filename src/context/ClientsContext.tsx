import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CustomerOption } from '../components/CustomerDropdown';
import { MOCK_CLIENTS } from '../data/clients';

const STORAGE_KEY = '@calendar_clients';
const SEEDED_KEY = '@calendar_clients_seed_version';
const CURRENT_SEED_VERSION = 'v3';

interface ClientsContextType {
  clients: CustomerOption[];
  addClient: (client: Omit<CustomerOption, 'id'>) => CustomerOption;
  setClients: React.Dispatch<React.SetStateAction<CustomerOption[]>>;
  lastAddedClient: CustomerOption | null;
  clearLastAddedClient: () => void;
}

const ClientsContext = createContext<ClientsContextType | null>(null);

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<CustomerOption[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastAddedClient, setLastAddedClient] = useState<CustomerOption | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [json, seeded] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SEEDED_KEY),
        ]);

        // If mock seed version changed, overwrite stored clients once.
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
          } catch {}
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
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients, hydrated]);

  const addClient = (client: Omit<CustomerOption, 'id'>) => {
    const id = `c-${Date.now()}`;
    const newClient = { ...client, id } as CustomerOption;
    setClients((prev) => [...prev, newClient]);
    setLastAddedClient(newClient);
    return newClient;
  };

  const clearLastAddedClient = () => setLastAddedClient(null);

  return (
    <ClientsContext.Provider value={{ clients, addClient, setClients, lastAddedClient, clearLastAddedClient }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error('useClients must be used within ClientsProvider');
  return ctx;
}
