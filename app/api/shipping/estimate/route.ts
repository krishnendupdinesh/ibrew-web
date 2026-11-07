import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET(request: NextRequest) {
  const backendBase = getBackendUrl();
  const searchParams = request.nextUrl.searchParams.toString();
  const queryStr = searchParams ? `?${searchParams}` : "";

  try {
    const res = await fetch(`${backendBase}/api/shipping/estimate${queryStr}`, {
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to estimate delivery." },
        { status: res.status || 400 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("GET /api/shipping/estimate error:", (err as Error)?.message || err);
    return NextResponse.json(
      { error: "Could not connect to shipping backend." },
      { status: 500 }
    );
  }
}

