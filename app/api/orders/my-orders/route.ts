import { NextResponse, connection } from "next/server";
import { getBackendUrl } from "../../../../lib/backendConfig";

export async function GET(request: Request) {
  await connection();
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = getBackendUrl();
    const query = searchParams.toString();
    const url = `${backendUrl}/api/orders/my-orders${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Could not load your orders." },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_")) {
      throw err;
    }
    console.error("GET /api/orders/my-orders error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Could not connect to database backend." }, { status: 500 });
  }
}
