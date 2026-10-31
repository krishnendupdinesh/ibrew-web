import type { StoreOrder } from "./orderStore";

const g = globalThis as unknown as {
  __ibrewServerOrders?: StoreOrder[];
};

export function getServerOrders(): StoreOrder[] {
  if (!g.__ibrewServerOrders) {
    g.__ibrewServerOrders = [];
  }
  return g.__ibrewServerOrders;
}

export function setServerOrders(orders: StoreOrder[]): StoreOrder[] {
  g.__ibrewServerOrders = orders;
  return g.__ibrewServerOrders;
}

export function addServerOrder(order: StoreOrder): StoreOrder {
  const list = getServerOrders();
  const existingIdx = list.findIndex(
    (o) => o.orderId === order.orderId || o.id === order.id
  );
  if (existingIdx >= 0) {
    list[existingIdx] = order;
  } else {
    list.unshift(order);
  }
  return order;
}

export function patchServerOrder(
  id: string,
  patch: Partial<StoreOrder>
): StoreOrder | null {
  const list = getServerOrders();
  const idx = list.findIndex((o) => o.id === id || o.orderId === id);
  if (idx < 0) return null;

  const updated: StoreOrder = {
    ...list[idx],
    ...patch,
    confirmedAt:
      patch.status === "confirmed"
        ? new Date().toISOString()
        : list[idx].confirmedAt,
    shippedAt:
      patch.status === "shipped"
        ? new Date().toISOString()
        : list[idx].shippedAt,
    deliveredAt:
      patch.status === "delivered"
        ? new Date().toISOString()
        : list[idx].deliveredAt,
  };
  list[idx] = updated;
  return updated;
}

export function deleteServerOrder(id: string): boolean {
  const list = getServerOrders();
  const before = list.length;
  g.__ibrewServerOrders = list.filter((o) => o.id !== id && o.orderId !== id);
  return g.__ibrewServerOrders.length < before;
}

