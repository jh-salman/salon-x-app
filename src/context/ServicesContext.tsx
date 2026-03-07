import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ServiceOption } from '../data/services';
import { MOCK_SERVICES } from '../data/services';

const STORAGE_KEY = '@calendar_services';

interface ServicesContextType {
  services: ServiceOption[];
  addService: (service: Omit<ServiceOption, 'id'>) => ServiceOption;
  setServices: React.Dispatch<React.SetStateAction<ServiceOption[]>>;
  lastAddedService: ServiceOption | null;
  clearLastAddedService: () => void;
}

const ServicesContext = createContext<ServicesContextType | null>(null);

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ServiceOption[]>(MOCK_SERVICES);
  const [hydrated, setHydrated] = useState(false);
  const [lastAddedService, setLastAddedService] = useState<ServiceOption | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) {
        try {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setServices(parsed.map((s: ServiceOption) => ({ ...s, id: s.id })));
          }
        } catch {}
      }
      setHydrated(true);
    });
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
