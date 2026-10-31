"use client";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type PaymentMethod = "cod" | "upi" | "card";

export interface OrderItem {
  productId: string;
  name: string;
  size?: string;
  price: number;
  mrp?: number;
  quantity: number;
  image?: string;
  category?: string;
}

export interface OrderCustomer {
  name: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
}

export interface StoreOrder {
  id: string;
  orderId: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  savings: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  trackingNumber?: string;
  courierName?: string;
  adminNotes?: string;
  createdAt: string;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

const ORDERS_STORAGE_KEY = "ibrew_orders_v1";
const ORDERS_EVENT_NAME = "ibrew-orders-updated";

export function readLocalOrders(): StoreOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalOrders(orders: StoreOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent(ORDERS_EVENT_NAME, { detail: orders }));
  } catch (err) {
    console.error("Failed to save local orders:", err);
  }
}

export function prependLocalOrder(order: StoreOrder): StoreOrder[] {
  const current = readLocalOrders();
  const filtered = current.filter((o) => o.orderId !== order.orderId && o.id !== order.id);
  const next = [order, ...filtered];
  writeLocalOrders(next);
  return next;
}

export function updateLocalOrder(
  id: string,
  patch: Partial<StoreOrder>
): StoreOrder[] {
  const current = readLocalOrders();
  const next = current.map((o) =>
    o.id === id || o.orderId === id ? { ...o, ...patch } : o
  );
  writeLocalOrders(next);
  return next;
}

export function removeLocalOrder(id: string): StoreOrder[] {
  const current = readLocalOrders();
  const next = current.filter((o) => o.id !== id && o.orderId !== id);
  writeLocalOrders(next);
  return next;
}

