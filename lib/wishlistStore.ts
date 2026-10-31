"use client";

import { useCallback, useEffect, useState } from "react";

export interface WishlistItem {
  productId: string;
  name: string;
  size?: string;
  price: number;
  mrp?: number;
  image?: string;
  category?: string;
  badge?: string;
  inStock?: boolean;
  addedAt: string;
}

const STORAGE_KEY = "ibrew_wishlist_items";
const WISHLIST_EVENT = "ibrew-wishlist-updated";

export function readWishlist(): WishlistItem[] {
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

export function writeWishlist(items: WishlistItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(WISHLIST_EVENT));
  } catch (err) {
    console.warn("Could not persist wishlist:", err);
  }
}

export function toggleWishlistItem(
  item: Omit<WishlistItem, "addedAt">
): { items: WishlistItem[]; added: boolean } {
  const current = readWishlist();
  const exists = current.some((x) => x.productId === item.productId);
  let next: WishlistItem[];
  if (exists) {
    next = current.filter((x) => x.productId !== item.productId);
  } else {
    next = [
      {
        ...item,
        addedAt: new Date().toISOString(),
      },
      ...current,
    ];
  }
  writeWishlist(next);
  return { items: next, added: !exists };
}

export function removeFromWishlist(productId: string): WishlistItem[] {
  const next = readWishlist().filter((x) => x.productId !== productId);
  writeWishlist(next);
  return next;
}

export function clearWishlist(): void {
  writeWishlist([]);
}

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const sync = useCallback(() => {
    setItems(readWishlist());
    setHydrated(true);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(WISHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const wishedIds = items.map((i) => i.productId);
  const isWished = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  return {
    items,
    wishedIds,
    hydrated,
    count: items.length,
    isWished,
    toggle: toggleWishlistItem,
    remove: removeFromWishlist,
    clear: clearWishlist,
  };
}

