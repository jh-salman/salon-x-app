import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ServiceOption } from '../data/services';
import { MOCK_SERVICES } from '../data/services';

const STORAGE_KEY = '@calendar_services';
const SEEDED_KEY = '@calendar_services_seed_version';
const CURRENT_SEED_VERSION = 'v3';

interface ServicesContextType {
  services: ServiceOption[];
  addService: (service: Omit<ServiceOption, 'id'>) => ServiceOption;
  setServices: React.Dispatch<React.SetStateAction<ServiceOption[]>>;
  lastAddedService: ServiceOption | null;
  clearLastAddedService: () => void;
}

const ServicesContext = createContext<ServicesContextType | null>(null);

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastAddedService, setLastAddedService] = useState<ServiceOption | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [json, seeded] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SEEDED_KEY),
        ]);

        // If mock seed version changed, overwrite stored services once.
        if (seeded !== CURRENT_SEED_VERSION) {
          const seedServices = MOCK_SERVICES.slice(0, 4);
          setServices(seedServices);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedServices));
          await AsyncStorage.setItem(SEEDED_KEY, CURRENT_SEED_VERSION);
          setHydrated(true);
          return;
        }

        if (json) {
          try {
            const parsed = JSON.parse(json);
            if (Array.isArray(parsed)) {
              setServices(parsed.map((s: ServiceOption) => ({ ...s, id: s.id })));
            }
          } catch {}
          setHydrated(true);
          return;
        }

        const seedServices = MOCK_SERVICES.slice(0, 4);
        setServices(seedServices);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedServices));
        await AsyncStorage.setItem(SEEDED_KEY, CURRENT_SEED_VERSION);
      } catch {
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  }, [services, hydrated]);

  const addService = (service: Omit<ServiceOption, 'id'>) => {
    const id = `s-${Date.now()}`;
    const newService = { ...service, id };
    setServices((prev) => [...prev, newService]);
    setLastAddedService(newService);
    return newService;
  };

  const clearLastAddedService = () => setLastAddedService(null);

  return (
    <ServicesContext.Provider value={{ services, addService, setServices, lastAddedService, clearLastAddedService }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used within ServicesProvider');
  return ctx;
}
