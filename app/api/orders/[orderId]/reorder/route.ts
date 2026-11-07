import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;
  const backendBase = getBackendUrl();

  try {
    const res = await fetch(
      `${backendBase}/api/orders/${encodeURIComponent(orderId)}/reorder`,
      {
        cache: "no-store",
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Could not prepare reorder." },
        { status: res.status || 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("GET /api/orders/[orderId]/reorder error:", (err as Error)?.message || err);
    return NextResponse.json(
      { error: "Could not connect to reorder backend." },
      { status: 500 }
    );
  }
}

