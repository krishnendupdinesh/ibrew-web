import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET(request: NextRequest) {
  const backendBase = getBackendUrl();
  try {
    const res = await fetch(`${backendBase}/api/admin/bulk-products`, {
      cache: "no-store",
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("GET /api/admin/bulk-products proxy error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Failed to load bulk products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const backendBase = getBackendUrl();
  try {
    const body = await request.json();
    const res = await fetch(`${backendBase}/api/admin/bulk-products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("POST /api/admin/bulk-products proxy error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Failed to create bulk product" }, { status: 500 });
  }
}
