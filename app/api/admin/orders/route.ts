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
        // Backend MySQL is the single source of truth for admin orders
        setServerOrders(data.orders);
        return NextResponse.json({ orders: data.orders });
      }
    }
  } catch {
    // Fallback to in-memory orders
  }

  return NextResponse.json({ orders: localMem });
}

