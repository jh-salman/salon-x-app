import { RETAIL_CATALOG } from './mockData';
import type { RetailCatalogItem } from './types';

export function getRetailCategories(): string[] {
  const s = new Set(RETAIL_CATALOG.map((r) => r.category));
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

export function getBrandsForCategory(category: string): string[] {
  const s = new Set(
    RETAIL_CATALOG.filter((r) => r.category === category).map((r) => r.brand)
  );
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

export function getProductsForCategoryAndBrand(category: string, brand: string): RetailCatalogItem[] {
  return RETAIL_CATALOG.filter((r) => r.category === category && r.brand === brand).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getRetailItemById(id: string): RetailCatalogItem | undefined {
  return RETAIL_CATALOG.find((r) => r.id === id);
}
