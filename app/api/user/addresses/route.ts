import { NextRequest, NextResponse, connection } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET(request: NextRequest) {
  await connection();
  const backendBase = getBackendUrl();
  try {
    const res = await fetch(`${backendBase}/api/user/addresses`, {
      cache: "no-store",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch addresses." },
        { status: res.status || 401 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("GET /api/user/addresses error:", (err as Error)?.message || err);
    return NextResponse.json(
      { error: "Could not connect to address backend." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const backendBase = getBackendUrl();
  try {
    const body = await request.json();
    const res = await fetch(`${backendBase}/api/user/addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to save address." },
        { status: res.status || 400 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("POST /api/user/addresses error:", (err as Error)?.message || err);
    return NextResponse.json(
      { error: "Could not connect to address backend." },
      { status: 500 }
    );
  }
}

