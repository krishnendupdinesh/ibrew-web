"use client";

import { useEffect, useState } from "react";

export type ProductSection =
  | "coffee"
  | "coffee-skin"
  | "spices"
  | "fragrances"
  | "importedbed"
  | "groceries"
  | "dates";

export type ProductSize = {
  label: string;
  price: number;
  mrp?: number;
  stock: number;
};

export type StoreProduct = {
  id: string;
  slug?: string;
  name: string;
  section: ProductSection;
  category: string;
  description: string;
  detail: string;
  image: string;
  badge?: string;
  tags?: string[];
  isBestSeller?: boolean;
  isMostSelling?: boolean;
  featuredOnHome?: boolean;
  rating: number;
  reviewCount: number;
  sizes: ProductSize[];
  createdAt?: string;
};

const STORAGE_KEY = "ibrew_catalog_v1";
const DELETED_KEY = "ibrew_deleted_ids_v1";
const UPDATE_EVENT = "ibrew-products-updated";

export function readLocalCatalog(): StoreProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readDeletedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DELETED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalCatalog(products: StoreProduct[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event(UPDATE_EVENT));
  } catch {
    // ignore storage quota errors
  }
}

export function upsertLocalProduct(product: StoreProduct) {
  const list = readLocalCatalog();
  const idx = list.findIndex(
    (p) => p.id === product.id || (p.slug && product.slug && p.slug === product.slug)
  );
  const next =
    idx >= 0
      ? list.map((p, i) => (i === idx ? product : p))
      : [product, ...list];
  writeLocalCatalog(next);
  return next;
}

export function removeLocalProduct(id: string) {
  if (typeof window === "undefined") return;
  try {
    const deleted = new Set(readDeletedIds());
    deleted.add(id);
    window.localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(deleted)));
  } catch {
    // ignore
  }
  const list = readLocalCatalog().filter((p) => p.id !== id && p.slug !== id);
  writeLocalCatalog(list);
}

/**
 * Merges static page defaults, locally saved admin products, and backend API products
 * for a given storefront section (e.g. "coffee", "spices", "dates").
 * Newly added products for that section always appear at the top.
 */
export function mergeSectionProducts<T extends { id: string; name: string; category: string }>(
  section: ProductSection,
  staticDefaults: T[],
  apiProducts?: StoreProduct[]
): T[] {
  const deleted = new Set(readDeletedIds());
  const localForSection = readLocalCatalog().filter(
    (p) => p.section === section && !deleted.has(p.id)
  );

  // Build map keyed by normalized id/slug/name so edited default products replace their static version
  // and brand new products appear first
  const sourceList: StoreProduct[] = [];
  const seenKeys = new Set<string>();

  const keyFor = (item: { id?: string; slug?: string; name: string }) =>
    (item.slug || item.id || item.name).toLowerCase().trim();

  const nameKeyFor = (item: { name: string }) => item.name.toLowerCase().trim();
  const seenNames = new Set<string>();

  // 1. Local admin changes & additions first
  for (const item of localForSection) {
    const k = keyFor(item);
    const nk = nameKeyFor(item);
    if (!seenKeys.has(k) && !seenNames.has(nk)) {
      seenKeys.add(k);
      seenNames.add(nk);
      sourceList.push(item);
    }
  }

  // 2. Backend API products for this section
  if (Array.isArray(apiProducts)) {
    for (const item of apiProducts) {
      if (item.section && item.section !== section) continue;
      if (deleted.has(item.id)) continue;
      const k = keyFor(item);
      const nk = nameKeyFor(item);
      if (!seenKeys.has(k) && !seenNames.has(nk)) {
        seenKeys.add(k);
        seenNames.add(nk);
        sourceList.push(item);
      }
    }
  }

  // 3. Static defaults on the page (if not already overridden or deleted)
  for (const def of staticDefaults) {
    if (deleted.has(def.id)) continue;
    const k = keyFor(def);
    const nk = nameKeyFor(def);
    if (!seenKeys.has(k) && !seenNames.has(nk)) {
      seenKeys.add(k);
      seenNames.add(nk);
      sourceList.push(def as unknown as StoreProduct);
    }
  }

  return sourceList as unknown as T[];
}

/**
 * React hook used by each category page (/coffee, /coffee-skin, /spices, /fragrances,
 * /importedbed, /groceries, /dates) to display live products added or updated in Admin.
 */
export function useSectionProducts<T extends { id: string; name: string; category: string }>(
  section: ProductSection,
  staticDefaults: T[]
): T[] {
  const [items, setItems] = useState<T[]>(staticDefaults);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      // Immediately apply any local admin products
      const initialMerged = mergeSectionProducts(section, staticDefaults);
      if (active) setItems(initialMerged);

      try {
        const res = await fetch(`/api/products?section=${section}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.products) && active) {
            const merged = mergeSectionProducts(section, staticDefaults, data.products);
            setItems(merged);
          }
        }
      } catch {
        // Fallback to local + static defaults already set above
      }
    };

    refresh();

    const handleStorageOrCustom = () => {
      refresh();
    };

    window.addEventListener("storage", handleStorageOrCustom);
    window.addEventListener(UPDATE_EVENT, handleStorageOrCustom);
    return () => {
      active = false;
      window.removeEventListener("storage", handleStorageOrCustom);
      window.removeEventListener(UPDATE_EVENT, handleStorageOrCustom);
    };
  }, [section, staticDefaults]);

  return items;
}

