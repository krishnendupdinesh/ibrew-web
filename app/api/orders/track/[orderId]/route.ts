import { NextResponse } from "next/server";
import { getBackendUrl } from "../../../../../lib/backendConfig";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/api/orders/track/${encodeURIComponent(orderId)}`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Order not found. Please check your Order ID." },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/orders/track/:orderId error:", err);
    return NextResponse.json({ error: "Could not track order." }, { status: 500 });
  }
}

