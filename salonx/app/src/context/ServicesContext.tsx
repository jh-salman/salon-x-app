import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ServiceOption } from '../data/services';
import { MOCK_SERVICES } from '../data/services';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import {
  apiServiceToOption,
  createService as createServiceRequest,
  deleteService as deleteServiceRequest,
  listServices,
  serviceOptionToCreateBody,
  updateService as updateServiceRequest,
  type ApiServiceRow,
  type UpdateServiceBody,
} from '../lib/serviceApi';

const STORAGE_KEY = '@calendar_services';
const SEEDED_KEY = '@calendar_services_seed_version';
const CURRENT_SEED_VERSION = 'v3';

interface ServicesContextType {
  services: ServiceOption[];
  /** True while fetching catalog from API (logged-in + salon). */
  isLoading: boolean;
  /** Last sync error message, if any. */
  syncError: string | null;
  /** Pull catalog from `GET /api/v1/services` when token + salon are set. */
  refreshServices: () => Promise<void>;
  addService: (service: Omit<ServiceOption, 'id'>) => Promise<ServiceOption>;
  updateServiceById: (serviceId: string, body: UpdateServiceBody) => Promise<ServiceOption>;
  removeService: (serviceId: string) => Promise<void>;
  setServices: React.Dispatch<React.SetStateAction<ServiceOption[]>>;
  lastAddedService: ServiceOption | null;
  clearLastAddedService: () => void;
}

const ServicesContext = createContext<ServicesContextType | null>(null);

function mapApiList(rows: ApiServiceRow[]): ServiceOption[] {
  return rows.map(apiServiceToOption);
}

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { currentSalonId } = useTenant();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastAddedService, setLastAddedService] = useState<ServiceOption | null>(null);

  const canUseApi = Boolean(token && currentSalonId);

  const refreshServices = useCallback(async () => {
    if (!token || !currentSalonId) return;
    setIsLoading(true);
    setSyncError(null);
    try {
      const { data } = await listServices(token, currentSalonId);
      const mapped = mapApiList(data);
      setServices(mapped);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load services';
      setSyncError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [token, currentSalonId]);

  // Offline / guest: hydrate from AsyncStorage + mock seed.
  useEffect(() => {
    if (canUseApi) {
      setHydrated(true);
      return;
    }
    (async () => {
      try {
        const [json, seeded] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SEEDED_KEY),
        ]);

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
          } catch {
            /* ignore */
          }
          setHydrated(true);
          return;
        }

        const seedServices = MOCK_SERVICES.slice(0, 4);
        setServices(seedServices);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedServices));
        await AsyncStorage.setItem(SEEDED_KEY, CURRENT_SEED_VERSION);
      } catch {
        /* ignore */
      } finally {
        setHydrated(true);
      }
    })();
  }, [canUseApi]);

  // Logged-in tenant: load from API when salon/token available.
  useEffect(() => {
    if (!canUseApi || !hydrated) return;
    void refreshServices();
  }, [canUseApi, hydrated, currentSalonId, token, refreshServices]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  }, [services, hydrated]);

  const addService = useCallback(
    async (service: Omit<ServiceOption, 'id'>): Promise<ServiceOption> => {
      if (token && currentSalonId) {
        const body = serviceOptionToCreateBody(service);
        const { data } = await createServiceRequest(token, currentSalonId, body);
        const opt = apiServiceToOption(data);
        setServices((prev) => [...prev, opt]);
        setLastAddedService(opt);
        return opt;
      }
      const id = `s-${Date.now()}`;
      const newService = { ...service, id };
      setServices((prev) => [...prev, newService]);
      setLastAddedService(newService);
      return newService;
    },
    [token, currentSalonId],
  );

  const updateServiceById = useCallback(
    async (serviceId: string, body: UpdateServiceBody): Promise<ServiceOption> => {
      if (!token || !currentSalonId) {
        throw new Error('Sign in and select a salon to update services');
      }
      const { data } = await updateServiceRequest(token, currentSalonId, serviceId, body);
      const opt = apiServiceToOption(data);
      setServices((prev) => prev.map((s) => (s.id === serviceId ? opt : s)));
      return opt;
    },
    [token, currentSalonId],
  );

  const removeService = useCallback(
    async (serviceId: string): Promise<void> => {
      if (token && currentSalonId) {
        await deleteServiceRequest(token, currentSalonId, serviceId);
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
        return;
      }
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    },
    [token, currentSalonId],
  );

  const clearLastAddedService = () => setLastAddedService(null);

  return (
    <ServicesContext.Provider
      value={{
        services,
        isLoading,
        syncError,
        refreshServices,
        addService,
        updateServiceById,
        removeService,
        setServices,
        lastAddedService,
        clearLastAddedService,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used within ServicesProvider');
  return ctx;
}
