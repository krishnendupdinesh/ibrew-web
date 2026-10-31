"use client";

import { useState, useEffect, useCallback } from "react";

export interface CartItem {
  id: string; // composite key: `${productId}::${size || "default"}`
  productId: string;
  name: string;
  size?: string;
  price: number;
  mrp?: number;
  quantity: number;
  image?: string;
  category?: string;
  subtitle?: string;
}

const CART_STORAGE_KEY = "ibrew_cart_v1";
const CART_EVENT_NAME = "ibrew-cart-updated";
const CART_DRAWER_EVENT = "ibrew-open-cart-drawer";

export function makeCartItemId(productId: string, size?: string): string {
  return `${productId}::${(size || "default").trim()}`;
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        item &&
        typeof item.id === "string" &&
        typeof item.productId === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.quantity === "number" &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const clean = items.filter((item) => item.quantity > 0);
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent(CART_EVENT_NAME, { detail: clean }));
  } catch (err) {
    console.error("Failed to save cart:", err);
  }
}

export function openCartDrawer(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_DRAWER_EVENT));
}

export function addToCart(
  item: {
    productId: string;
    name: string;
    size?: string;
    price: number;
    mrp?: number;
    image?: string;
    category?: string;
    subtitle?: string;
  },
  deltaQty = 1
): CartItem[] {
  const current = readCart();
  const id = makeCartItemId(item.productId, item.size);
  const existingIdx = current.findIndex((c) => c.id === id);

  let next: CartItem[];
  if (existingIdx >= 0) {
    const updatedQty = current[existingIdx].quantity + deltaQty;
    if (updatedQty <= 0) {
      next = current.filter((_, i) => i !== existingIdx);
    } else {
      next = current.map((c, i) =>
        i === existingIdx
          ? {
              ...c,
              price: item.price,
              mrp: item.mrp ?? c.mrp,
              image: item.image || c.image,
              name: item.name || c.name,
              quantity: updatedQty,
            }
          : c
      );
    }
  } else if (deltaQty > 0) {
    next = [
      ...current,
      {
        id,
        productId: item.productId,
        name: item.name,
        size: item.size,
        price: item.price,
        mrp: item.mrp,
        quantity: deltaQty,
        image: item.image,
        category: item.category,
        subtitle: item.subtitle,
      },
    ];
  } else {
    next = current;
  }

  writeCart(next);
  return next;
}

export function setCartItemQuantity(
  item: {
    productId: string;
    name: string;
    size?: string;
    price: number;
    mrp?: number;
    image?: string;
    category?: string;
    subtitle?: string;
  },
  quantity: number
): CartItem[] {
  const current = readCart();
  const id = makeCartItemId(item.productId, item.size);
  const existingIdx = current.findIndex((c) => c.id === id);

  let next: CartItem[];
  if (quantity <= 0) {
    next = current.filter((c) => c.id !== id);
  } else if (existingIdx >= 0) {
    next = current.map((c, i) =>
      i === existingIdx
        ? {
            ...c,
            name: item.name || c.name,
            size: item.size ?? c.size,
            price: item.price,
            mrp: item.mrp ?? c.mrp,
            image: item.image || c.image,
            category: item.category ?? c.category,
            subtitle: item.subtitle ?? c.subtitle,
            quantity,
          }
        : c
    );
  } else {
    next = [
      ...current,
      {
        id,
        productId: item.productId,
        name: item.name,
        size: item.size,
        price: item.price,
        mrp: item.mrp,
        quantity,
        image: item.image,
        category: item.category,
        subtitle: item.subtitle,
      },
    ];
  }

  writeCart(next);
  return next;
}

export function updateCartQuantityById(id: string, delta: number): CartItem[] {
  const current = readCart();
  const next = current
    .map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + delta } : item
    )
    .filter((item) => item.quantity > 0);
  writeCart(next);
  return next;
}

export function removeFromCart(id: string): CartItem[] {
  const current = readCart();
  const next = current.filter((item) => item.id !== id);
  writeCart(next);
  return next;
}

export function clearCart(): void {
  writeCart([]);
}

export function getCartItemQuantity(productId: string, size?: string, items?: CartItem[]): number {
  const list = items ?? readCart();
  const id = makeCartItemId(productId, size);
  const found = list.find((item) => item.id === id);
  return found ? found.quantity : 0;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setHydrated(true);

    const handleUpdate = () => {
      setItems(readCart());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) {
        setItems(readCart());
      }
    };

    window.addEventListener(CART_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(CART_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalMrp = items.reduce(
    (sum, item) => sum + (item.mrp && item.mrp > item.price ? item.mrp : item.price) * item.quantity,
    0
  );
  const totalSavings = Math.max(0, totalMrp - subtotal);

  const updateQty = useCallback((id: string, delta: number) => {
    setItems(updateCartQuantityById(id, delta));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(removeFromCart(id));
  }, []);

  const clear = useCallback(() => {
    clearCart();
    setItems([]);
  }, []);

  return {
    items,
    hydrated,
    totalItems,
    subtotal,
    totalMrp,
    totalSavings,
    updateQty,
    removeItem,
    clear,
    openCartDrawer,
    CART_DRAWER_EVENT,
  };
}

