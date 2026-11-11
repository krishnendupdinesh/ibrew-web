import { NextRequest, NextResponse, connection } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function GET(request: NextRequest) {
  await connection();
  const backendBase = getBackendUrl();
  try {
    const res = await fetch(`${backendBase}/api/admin/export/orders.csv`, {
      cache: "no-store",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to export orders CSV" }, { status: res.status || 401 });
    }

    const csvData = await res.text();
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="imaans_orders.csv"',
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/admin/export/orders.csv error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Failed to connect to export backend" }, { status: 500 });
  }
}

