import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CustomerOption } from '../components/CustomerDropdown';
import { MOCK_CLIENTS } from '../data/clients';

const STORAGE_KEY = '@calendar_clients';

const mockToCustomerOption = (c: { id: string; clientName: string }): CustomerOption => ({
  id: c.id,
  name: c.clientName,
});

const DEFAULT_CLIENTS: CustomerOption[] = MOCK_CLIENTS.map(mockToCustomerOption);

interface ClientsContextType {
  clients: CustomerOption[];
  addClient: (client: Omit<CustomerOption, 'id'>) => CustomerOption;
  setClients: React.Dispatch<React.SetStateAction<CustomerOption[]>>;
  lastAddedClient: CustomerOption | null;
  clearLastAddedClient: () => void;
}

const ClientsContext = createContext<ClientsContextType | null>(null);

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<CustomerOption[]>(DEFAULT_CLIENTS);
  const [hydrated, setHydrated] = useState(false);
  const [lastAddedClient, setLastAddedClient] = useState<CustomerOption | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) {
        try {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setClients(parsed.map((c: CustomerOption) => ({ ...c, id: c.id })));
          }
        } catch {}
      }
      setHydrated(true);
    });
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
