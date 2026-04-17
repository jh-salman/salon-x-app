import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { RetailCatalogItem } from '../data/types';
import { RETAIL_CATALOG } from '../data/mockData';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import { listProducts, type ApiProductRow } from '../lib/productApi';

const FALLBACK_CATEGORY = 'Retail';

function rowsToRetailItems(rows: ApiProductRow[]): RetailCatalogItem[] {
  return rows.map((r) => ({
    id: r.id,
    category: FALLBACK_CATEGORY,
    brand: r.brand,
    name: r.name,
    price: r.priceCents != null ? Math.round(r.priceCents / 100) : 0,
    imageUrl: r.imageUrl ?? undefined,
  }));
}

type RetailCatalogContextType = {
  /** Merged: API products when logged in + salon; falls back to bundled catalog when API empty. */
  items: RetailCatalogItem[];
  getRetailCategories: () => string[];
  getBrandsForCategory: (category: string) => string[];
  getProductsForCategoryAndBrand: (category: string, brand: string) => RetailCatalogItem[];
  getRetailItemById: (id: string) => RetailCatalogItem | undefined;
};

const RetailCatalogContext = createContext<RetailCatalogContextType | null>(null);

function deriveHelpers(items: RetailCatalogItem[]) {
  const getRetailCategories = () => {
    const s = new Set(items.map((r) => r.category));
    return Array.from(s).sort();
  };

  const getBrandsForCategory = (category: string) => {
    const s = new Set(items.filter((r) => r.category === category).map((r) => r.brand));
    return Array.from(s).sort();
  };

  const getProductsForCategoryAndBrand = (category: string, brand: string) =>
    items.filter((r) => r.category === category && r.brand === brand).sort((a, b) => a.name.localeCompare(b.name));

  const getRetailItemById = (id: string) => items.find((r) => r.id === id);

  return {
    getRetailCategories,
    getBrandsForCategory,
    getProductsForCategoryAndBrand,
    getRetailItemById,
  };
}

export function RetailCatalogProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { currentSalonId } = useTenant();
  const canUseApi = Boolean(token && currentSalonId);

  const [apiItems, setApiItems] = useState<RetailCatalogItem[]>([]);

  const refresh = useCallback(async () => {
    if (!token || !currentSalonId) return;
    try {
      const { data } = await listProducts(token, currentSalonId);
      setApiItems(rowsToRetailItems(data));
    } catch {
      setApiItems([]);
    }
  }, [token, currentSalonId]);

  useEffect(() => {
    if (canUseApi) void refresh();
    else setApiItems([]);
  }, [canUseApi, refresh]);

  const items = useMemo(() => {
    if (apiItems.length > 0) return apiItems;
    return RETAIL_CATALOG;
  }, [apiItems]);

  const helpers = useMemo(() => deriveHelpers(items), [items]);

  const value = useMemo(
    () => ({
      items,
      getRetailCategories: helpers.getRetailCategories,
      getBrandsForCategory: helpers.getBrandsForCategory,
      getProductsForCategoryAndBrand: helpers.getProductsForCategoryAndBrand,
      getRetailItemById: helpers.getRetailItemById,
    }),
    [items, helpers],
  );

  return <RetailCatalogContext.Provider value={value}>{children}</RetailCatalogContext.Provider>;
}

export function useRetailCatalog() {
  const ctx = useContext(RetailCatalogContext);
  if (!ctx) throw new Error('useRetailCatalog must be used within RetailCatalogProvider');
  return ctx;
}
