import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@assigned_services';

type AssignedServicesContextType = {
  assignedIds: string[];
  setAssignedIds: (ids: string[]) => void;
  toggleAssigned: (id: string) => void;
  isAssigned: (id: string) => boolean;
};

const AssignedServicesContext = createContext<AssignedServicesContextType | null>(null);

export function AssignedServicesProvider({ children }: { children: React.ReactNode }) {
  const [assignedIds, setAssignedIdsState] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) {
        try {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed)) setAssignedIdsState(parsed);
        } catch {}
      }
      setHydrated(true);
    });
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(assignedIds));
  }, [assignedIds, hydrated]);

  const setAssignedIds = useCallback((ids: string[]) => {
    setAssignedIdsState(ids);
  }, []);

  const toggleAssigned = useCallback((id: string) => {
    setAssignedIdsState((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const isAssigned = useCallback(
    (id: string) => assignedIds.includes(id),
    [assignedIds]
  );

  return (
    <AssignedServicesContext.Provider
      value={{ assignedIds, setAssignedIds, toggleAssigned, isAssigned }}
    >
      {children}
    </AssignedServicesContext.Provider>
  );
}

export function useAssignedServices() {
  const ctx = useContext(AssignedServicesContext);
  if (!ctx) throw new Error('useAssignedServices must be used within AssignedServicesProvider');
  return ctx;
}
