import { NextResponse } from "next/server";
import { getServerOrders, setServerOrders } from "../../../../lib/serverOrderStore";
import type { StoreOrder } from "../../../../lib/orderStore";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5001";

export async function GET(request: Request) {
  const localMem = getServerOrders();

  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/orders`, {
      headers: { cookie: request.headers.get("cookie") || "" },
      cache: "no-store",
      signal: AbortSignal.timeout(1800),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        // Merge backend orders with any in-memory orders placed in this session
        const mergedMap = new Map<string, StoreOrder>();
        for (const o of localMem) mergedMap.set(o.orderId, o);
        for (const o of data.orders) mergedMap.set(o.orderId || o.id, o);
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setServerOrders(merged);
        return NextResponse.json({ orders: merged });
      }
    }
  } catch {
    // Fallback to in-memory orders
  }

  return NextResponse.json({ orders: localMem });
}

