import React, { createContext, useContext, useState } from 'react';
import type { DurationValues } from '../components/DurationSetupSection';

interface DurationResultContextType {
  pendingResult: DurationValues | null;
  setPendingResult: (values: DurationValues | null) => void;
}

const DurationResultContext = createContext<DurationResultContextType | null>(null);

export function DurationResultProvider({ children }: { children: React.ReactNode }) {
  const [pendingResult, setPendingResult] = useState<DurationValues | null>(null);
  return (
    <DurationResultContext.Provider value={{ pendingResult, setPendingResult }}>
      {children}
    </DurationResultContext.Provider>
  );
}

export function useDurationResult() {
  const ctx = useContext(DurationResultContext);
  if (!ctx) throw new Error('useDurationResult must be used within DurationResultProvider');
  return ctx;
}
