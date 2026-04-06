import React, { createContext, useContext, useState } from 'react';

type SecurityContextType = {
  twoStepEnabled: boolean;
  setTwoStepEnabled: (v: boolean) => void;
};

const SecurityContext = createContext<SecurityContextType | null>(null);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [twoStepEnabled, setTwoStepEnabled] = useState(false);

  return (
    <SecurityContext.Provider value={{ twoStepEnabled, setTwoStepEnabled }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error('useSecurity must be used within SecurityProvider');
  return ctx;
}
