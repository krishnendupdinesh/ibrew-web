import { NextResponse } from "next/server";
import { addServerOrder } from "../../../lib/serverOrderStore";
import type { StoreOrder } from "../../../lib/orderStore";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5001";

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
    const total = typeof body.total === "number" ? body.total : subtotal + shipping;

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

    // 1. Save immediately in server memory
    addServerOrder(newOrder);

    // 2. Sync with Express backend asynchronously
    fetch(`${BACKEND_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOrder),
      signal: AbortSignal.timeout(2500),
    }).catch(() => {});

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not place order." }, { status: 400 });
  }
}

