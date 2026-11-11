import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function POST(request: NextRequest) {
  const backendBase = getBackendUrl();
  try {
    const body = await request.json();
    const res = await fetch(`${backendBase}/api/quote`, {
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
    console.error("POST /api/quote proxy error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Could not save your request." }, { status: 500 });
  }
}

