import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function POST(request: NextRequest) {
  const backendBase = getBackendUrl();
  try {
    const body = await request.json();
    const res = await fetch(`${backendBase}/api/coupons/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("POST /api/coupons/apply proxy error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Failed to apply coupon" }, { status: 500 });
  }
}
