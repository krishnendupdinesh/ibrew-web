import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const backendBase = getBackendUrl();
  const searchParams = request.nextUrl.searchParams.toString();
  const queryStr = searchParams ? `?${searchParams}` : "";

  try {
    const res = await fetch(
      `${backendBase}/api/products/${encodeURIComponent(slug)}/reviews${queryStr}`,
      {
        cache: "no-store",
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch reviews." },
        { status: res.status || 400 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("GET /api/products/[slug]/reviews error:", (err as Error)?.message || err);
    return NextResponse.json(
      { error: "Could not connect to reviews backend." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const backendBase = getBackendUrl();

  try {
    const body = await request.json();
    const res = await fetch(
      `${backendBase}/api/products/${encodeURIComponent(slug)}/reviews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to submit review." },
        { status: res.status || 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/products/[slug]/reviews error:", (err as Error)?.message || err);
    return NextResponse.json(
      { error: "Could not connect to review submission backend." },
      { status: 500 }
    );
  }
}

