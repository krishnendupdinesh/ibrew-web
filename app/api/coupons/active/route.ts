import { NextResponse, connection } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET() {
  await connection();
  const backendBase = getBackendUrl();
  try {
    const res = await fetch(`${backendBase}/api/coupons/active`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("GET /api/coupons/active proxy error:", (err as Error)?.message || err);
    return NextResponse.json({ coupons: [] }, { status: 200 });
  }
}

