import { NextRequest, NextResponse, connection } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  await connection();
  const { orderId } = await context.params;
  const backendBase = getBackendUrl();
  const url = new URL(request.url);
  const search = url.search;

  try {
    const res = await fetch(
      `${backendBase}/api/orders/${encodeURIComponent(orderId)}/invoice${search}`,
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
        { error: data.error || "Could not generate invoice." },
        { status: res.status || 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("GET /api/orders/[orderId]/invoice error:", (err as Error)?.message || err);
    return NextResponse.json(
      { error: "Could not connect to invoice backend." },
      { status: 500 }
    );
  }
}
