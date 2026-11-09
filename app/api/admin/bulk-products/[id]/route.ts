import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const backendBase = getBackendUrl();
  try {
    const body = await request.json();
    const res = await fetch(
      `${backendBase}/api/admin/bulk-products/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("PUT /api/admin/bulk-products/[id] proxy error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Failed to update bulk product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const backendBase = getBackendUrl();
  try {
    const res = await fetch(
      `${backendBase}/api/admin/bulk-products/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { cookie: request.headers.get("cookie") || "" },
      }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    console.error("DELETE /api/admin/bulk-products/[id] proxy error:", (err as Error)?.message || err);
    return NextResponse.json({ error: "Failed to delete bulk product" }, { status: 500 });
  }
}
