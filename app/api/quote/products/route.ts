import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET() {
  const backendBase = getBackendUrl();
  try {
    const res = await fetch(`${backendBase}/api/quote/products`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("GET /api/quote/products proxy error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Failed to load bulk catalog" }, { status: 500 });
  }
}

