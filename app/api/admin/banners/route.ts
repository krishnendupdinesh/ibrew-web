import { NextRequest, NextResponse, connection } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET(request: NextRequest) {
  await connection();
  const backendBase = getBackendUrl();
  try {
    const res = await fetch(`${backendBase}/api/admin/banners`, {
      cache: "no-store",
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to connect to banners backend" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const backendBase = getBackendUrl();
  try {
    const body = await request.json();
    const res = await fetch(`${backendBase}/api/admin/banners`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to connect to banners backend" }, { status: 500 });
  }
}

