import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { highlightColors } from '../theme/colors';

const STORAGE_KEY = '@theme_primary';

export type PrimaryTheme = 'pink' | 'blue' | 'orange';

const PRIMARY_TO_HEX: Record<PrimaryTheme, string> = {
  pink: highlightColors.neonPink,
  blue: highlightColors.neonBlue,
  orange: highlightColors.neonOrange,
};

type ThemeContextType = {
  primary: PrimaryTheme;
  setPrimary: (value: PrimaryTheme) => void;
  primaryColor: string;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [primary, setPrimaryState] = useState<PrimaryTheme>('pink');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored && (stored === 'pink' || stored === 'blue' || stored === 'orange')) {
        setPrimaryState(stored as PrimaryTheme);
      }
    });
  }, []);

  const setPrimary = useCallback((value: PrimaryTheme) => {
    setPrimaryState(value);
    AsyncStorage.setItem(STORAGE_KEY, value);
  }, []);

  const primaryColor = PRIMARY_TO_HEX[primary];

  return (
    <ThemeContext.Provider value={{ primary, setPrimary, primaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
