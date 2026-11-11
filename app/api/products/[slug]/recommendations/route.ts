import { NextRequest, NextResponse, connection } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  await connection();
  const { slug } = await context.params;
  const backendBase = getBackendUrl();

  try {
    const res = await fetch(
      `${backendBase}/api/products/${encodeURIComponent(slug)}/recommendations`,
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
        { error: data.error || "Recommendations not found." },
        { status: res.status || 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("GET /api/products/[slug]/recommendations error:", (err as Error)?.message || err);
    return NextResponse.json(
      { error: "Could not connect to recommendations backend." },
      { status: 500 }
    );
  }
}

