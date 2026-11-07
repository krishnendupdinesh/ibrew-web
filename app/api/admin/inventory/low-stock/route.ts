import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET(request: NextRequest) {
  const backendBase = getBackendUrl();
  try {
    const res = await fetch(`${backendBase}/api/admin/inventory/low-stock`, {
      cache: "no-store",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to load low stock alerts" },
        { status: res.status || 401 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("GET /api/admin/inventory/low-stock error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Failed to connect to inventory backend" }, { status: 500 });
  }
}

