"use client";

import { useEffect, useState } from "react";

export function truncateWords(text?: string, maxWords = 14): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ") + "...";
}

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
const SYNC_CHANNEL_NAME = "ibrew-catalog-sync";
const SYNC_STORAGE_KEY = "ibrew_catalog_sync_timestamp";

/**
 * Broadcasts catalog changes across tabs, windows, and components.
 */
export function broadcastCatalogChange(): void {
  if (typeof window === "undefined") return;

  // 1. Cross-tab BroadcastChannel
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.postMessage({ type: "CATALOG_UPDATED", timestamp: Date.now() });
      bc.close();
    }
  } catch {
    // ignore
  }

  // 2. Cross-window / cross-tab storage event
  try {
    window.localStorage.setItem(SYNC_STORAGE_KEY, String(Date.now()));
  } catch {
    // ignore
  }

  // 3. Same-window custom event
  try {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { timestamp: Date.now() } }));
  } catch {
    // ignore
  }
}

/**
 * Subscribes to catalog updates via BroadcastChannel, localStorage storage events,
 * window focus, document visibility changes, and a lightweight 15s polling fallback.
 */
export function subscribeCatalogChanges(onUpdate: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let bc: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.onmessage = () => {
        onUpdate();
      };
    }
  } catch {
    // ignore
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === SYNC_STORAGE_KEY || e.key === STORAGE_KEY || e.key === null) {
      onUpdate();
    }
  };

  const handleCustom = () => {
    onUpdate();
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      onUpdate();
    }
  };

  const handleFocus = () => {
    onUpdate();
  };

  // 15-second background sync interval when tab/window is visible
  const intervalId = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      onUpdate();
    }
  }, 15000);

  window.addEventListener("storage", handleStorage);
  window.addEventListener(UPDATE_EVENT, handleCustom);
  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    if (bc) {
      try {
        bc.close();
      } catch {
        // ignore
      }
    }
    window.clearInterval(intervalId);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(UPDATE_EVENT, handleCustom);
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}

export function readLocalCatalog(): StoreProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const deleted = new Set(readDeletedIds().map((s) => s.toLowerCase().trim()));
    if (deleted.size === 0) return parsed;
    return parsed.filter((p) => {
      const pid = String(p.id).toLowerCase().trim();
      const pslug = p.slug ? String(p.slug).toLowerCase().trim() : "";
      return !deleted.has(pid) && (!pslug || !deleted.has(pslug));
    });
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
    return Array.isArray(parsed) ? parsed.map((s) => String(s).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function writeLocalCatalog(products: StoreProduct[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    broadcastCatalogChange();
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

export function removeLocalProduct(id: string, slug?: string) {
  if (typeof window === "undefined") return;
  try {
    const deleted = new Set(readDeletedIds());
    if (id) deleted.add(String(id).trim());
    if (slug) deleted.add(String(slug).trim());
    window.localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(deleted)));
  } catch {
    // ignore
  }
  const targetId = String(id).toLowerCase().trim();
  const targetSlug = slug ? String(slug).toLowerCase().trim() : targetId;
  const list = readLocalCatalog().filter((p) => {
    const pid = String(p.id).toLowerCase().trim();
    const pslug = p.slug ? String(p.slug).toLowerCase().trim() : "";
    return pid !== targetId && pid !== targetSlug && pslug !== targetId && pslug !== targetSlug;
  });
  writeLocalCatalog(list);
  broadcastCatalogChange();
}

/**
 * Merges backend MySQL API products with static page defaults.
 * Backend MySQL products are the single source of truth.
 */
export function mergeSectionProducts<T extends { id: string; name: string; category: string; slug?: string }>(
  section: ProductSection,
  staticDefaults: T[],
  apiProducts?: StoreProduct[]
): T[] {
  const deleted = new Set(readDeletedIds().map((s) => s.toLowerCase().trim()));
  const isDeleted = (item: { id?: string; slug?: string }) => {
    if (item.id && deleted.has(String(item.id).toLowerCase().trim())) return true;
    if (item.slug && deleted.has(String(item.slug).toLowerCase().trim())) return true;
    return false;
  };

  // 1. Backend API products from MySQL (ground truth)
  // When the API has returned a list, it is authoritative. Never resurrect deleted items from staticDefaults!
  if (Array.isArray(apiProducts)) {
    const sectionApiProducts = apiProducts.filter(
      (p) => (!p.section || p.section === section) && !isDeleted(p)
    );
    return sectionApiProducts as unknown as T[];
  }

  // 2. Fallback when API products haven't loaded yet: local cache, else static defaults
  const localForSection = readLocalCatalog().filter((p) => p.section === section && !isDeleted(p));
  if (localForSection.length > 0) {
    return localForSection as unknown as T[];
  }

  return staticDefaults.filter((p) => !isDeleted(p));
}

/**
 * React hook used by each category page (/coffee, /coffee-skin, /spices, /fragrances,
 * /importedbed, /groceries, /dates) to display live products added or updated in MySQL backend.
 */
export function useSectionProducts<T extends { id: string; name: string; category: string }>(
  section: ProductSection,
  staticDefaults: T[]
): T[] {
  // Always initialize with staticDefaults so server SSR HTML matches client hydration HTML identically.
  const [items, setItems] = useState<T[]>(staticDefaults);

  useEffect(() => {
    let active = true;

    // After hydration on client, check if there are cached local items
    const local = readLocalCatalog().filter((p) => p.section === section);
    if (local.length > 0) {
      setItems(local as unknown as T[]);
    }

    const refresh = async () => {
      try {
        const res = await fetch(`/api/products?section=${section}&_t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.products) && active) {
            const merged = mergeSectionProducts(section, staticDefaults, data.products);
            setItems(merged);
            return;
          }
        }
      } catch {
        // Fallback to existing items
      }
      if (active) {
        setItems(mergeSectionProducts(section, staticDefaults));
      }
    };

    refresh();
    const unsubscribe = subscribeCatalogChanges(refresh);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [section, staticDefaults]);

  return items;
}

/**
 * Merges backend API products across all sections.
 */
export function getAllMergedProducts(apiProducts?: StoreProduct[]): StoreProduct[] {
  const deleted = new Set(readDeletedIds().map((s) => s.toLowerCase().trim()));
  const isDeleted = (item: { id?: string; slug?: string }) => {
    if (item.id && deleted.has(String(item.id).toLowerCase().trim())) return true;
    if (item.slug && deleted.has(String(item.slug).toLowerCase().trim())) return true;
    return false;
  };

  if (Array.isArray(apiProducts)) {
    return apiProducts.filter((p) => !isDeleted(p));
  }
  const local = readLocalCatalog().filter((p) => !isDeleted(p));
  if (local.length > 0) {
    return local;
  }
  return [];
}

/**
 * React hook to retrieve all storefront products across all 7 categories.
 */
export function useAllProducts(): { products: StoreProduct[]; loading: boolean } {
  // Initialize with empty array so server SSR and client hydration are identical.
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // After hydration, apply local cache if available before network returns
    const local = readLocalCatalog();
    if (local.length > 0) {
      setProducts(local);
      setLoading(false);
    }

    const refresh = async () => {
      try {
        const res = await fetch(`/api/products?_t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.products) && active) {
            setProducts(getAllMergedProducts(data.products));
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to local catalog
      }
      if (active) {
        setProducts(getAllMergedProducts());
        setLoading(false);
      }
    };

    refresh();
    const unsubscribe = subscribeCatalogChanges(refresh);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { products, loading };
}
