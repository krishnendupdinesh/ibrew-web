import { NextResponse } from "next/server";
import { getServerOrders, setServerOrders } from "../../../../lib/serverOrderStore";
import type { StoreOrder } from "../../../../lib/orderStore";
import { getBackendUrl } from "../../../../lib/backendConfig";

export async function GET(request: Request) {
  const localMem = getServerOrders();
  const backendUrl = getBackendUrl();

  try {
    const res = await fetch(`${backendUrl}/api/admin/orders`, {
      headers: { cookie: request.headers.get("cookie") || "" },
      cache: "no-store",
      signal: AbortSignal.timeout(1800),
    });

    if (res.status === 401 || res.status === 403) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error || "Admins only." },
        { status: res.status }
      );
    }
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

