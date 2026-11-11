import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;
  const backendBase = getBackendUrl();

  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(
      `${backendBase}/api/orders/${encodeURIComponent(orderId)}/cancel`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Could not cancel order." },
        { status: res.status || 400 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("POST /api/orders/[orderId]/cancel error:", (err as Error)?.message || err);
    return NextResponse.json(
      { error: "Could not connect to backend to cancel order." },
      { status: 500 }
    );
  }
}

