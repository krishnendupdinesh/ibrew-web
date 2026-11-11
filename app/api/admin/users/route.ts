import { NextRequest, NextResponse, connection } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET(request: NextRequest) {
  await connection();
  const backendBase = getBackendUrl();
  try {
    const res = await fetch(`${backendBase}/api/admin/users`, {
      cache: "no-store",
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("GET /api/admin/users proxy error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

