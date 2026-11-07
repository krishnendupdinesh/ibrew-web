import { NextResponse } from "next/server";
import { addServerOrder } from "../../../lib/serverOrderStore";
import type { StoreOrder } from "../../../lib/orderStore";
import { getBackendUrl } from "../../../lib/backendConfig";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = getBackendUrl();
    const query = searchParams.toString();
    const url = `${backendUrl}/api/orders/my-orders${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Could not load orders." },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_")) {
      throw err;
    }
    console.error("GET /api/orders error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Could not connect to database backend." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customer = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];

    if (!customer.name || !customer.phone || !customer.address || !customer.city || !customer.pincode) {
      return NextResponse.json(
        { error: "Customer name, phone, address, city, and PIN code are required." },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty." },
        { status: 400 }
      );
    }

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(100000 + Math.random() * 900000);
    const orderId = String(body.orderId || `IBREW-${datePart}-${rand}`);

    const subtotal =
      typeof body.subtotal === "number"
        ? body.subtotal
        : items.reduce((s: number, i: { price?: number; quantity?: number }) => s + Number(i.price || 0) * Number(i.quantity || 1), 0);
    const shipping = typeof body.shipping === "number" ? body.shipping : subtotal >= 999 ? 0 : 60;
    const savings = typeof body.savings === "number" ? body.savings : 0;
    const couponDiscount = typeof body.couponDiscount === "number" ? body.couponDiscount : 0;
    const couponCode = body.couponCode ? String(body.couponCode).trim().toUpperCase() : undefined;
    const total = typeof body.total === "number" ? body.total : Math.max(0, subtotal - couponDiscount + shipping);

    const newOrder: StoreOrder = {
      id: orderId,
      orderId,
      customer: {
        name: String(customer.name).trim(),
        email: String(customer.email || "").trim(),
        phone: String(customer.phone).trim(),
        address: String(customer.address).trim(),
        city: String(customer.city).trim(),
        state: String(customer.state || "Karnataka").trim(),
        pincode: String(customer.pincode).trim(),
        notes: String(customer.notes || "").trim(),
      },
      items: items.map((item: Record<string, unknown>) => ({
        productId: String(item.productId || item.id || "item"),
        name: String(item.name || "Product"),
        size: String(item.size || ""),
        price: Number(item.price || 0),
        mrp: item.mrp !== undefined ? Number(item.mrp) : undefined,
        quantity: Math.max(1, Number(item.quantity || 1)),
        image: String(item.image || ""),
        category: String(item.category || ""),
      })),
      subtotal,
      shipping,
      savings,
      couponCode,
      couponDiscount,
      total,
      paymentMethod: ["cod", "upi", "card"].includes(body.paymentMethod) ? body.paymentMethod : "cod",
      paymentStatus: body.paymentStatus === "paid" ? "paid" : "unpaid",
      status: "pending",
      trackingNumber: "",
      courierName: "",
      adminNotes: "",
      createdAt: new Date().toISOString(),
      confirmedAt: null,
      shippedAt: null,
      deliveredAt: null,
    };

    // 1. Save in Express + MySQL backend (validates & deducts stock transactionally)
    const backendUrl = getBackendUrl();
    try {
      const upstream = await fetch(`${backendUrl}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify(newOrder),
        signal: AbortSignal.timeout(6000),
      });

      const upstreamData = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return NextResponse.json(
          { error: upstreamData.error || "Could not place order." },
          { status: upstream.status || 400 }
        );
      }

      const savedOrder: StoreOrder = upstreamData.order || newOrder;
      addServerOrder(savedOrder);
      return NextResponse.json({ order: savedOrder }, { status: 201 });
    } catch (err) {
      console.error("Order backend proxy error:", err);
      return NextResponse.json(
        { error: "Could not connect to database backend to place order." },
        { status: 503 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Could not place order." }, { status: 400 });
  }
}

