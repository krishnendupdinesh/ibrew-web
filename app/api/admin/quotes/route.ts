import { NextRequest, NextResponse, connection } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET(request: NextRequest) {
  await connection();
  const backendBase = getBackendUrl();
  try {
    const res = await fetch(`${backendBase}/api/admin/quotes`, {
      cache: "no-store",
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("GET /api/admin/quotes proxy error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Failed to load quotes" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const backendBase = getBackendUrl();
  try {
    const body = await request.json();
    const res = await fetch(`${backendBase}/api/admin/quotes`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("PATCH /api/admin/quotes proxy error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}

