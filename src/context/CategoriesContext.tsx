import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVICE_CATEGORIES } from '../data/services';

const STORAGE_KEY = '@calendar_categories';

export interface Category {
  id: string;
  name: string;
}

const DEFAULT_CATEGORIES: Category[] = SERVICE_CATEGORIES.map((c) => ({
  id: c.id,
  name: c.name,
}));

interface CategoriesContextType {
  categories: Category[];
  addCategory: (name: string) => Category;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const CategoriesContext = createContext<CategoriesContextType | null>(null);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) {
        try {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCategories(parsed.map((c: Category) => ({ id: c.id, name: c.name })));
          }
        } catch {}
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories, hydrated]);

  const addCategory = (name: string): Category => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Category name is required');
    const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const id = `cat-${Date.now()}`;
    const newCat: Category = { id, name: trimmed };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  return (
    <CategoriesContext.Provider value={{ categories, addCategory, setCategories }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within CategoriesProvider');
  return ctx;
}
