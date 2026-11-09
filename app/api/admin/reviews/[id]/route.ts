import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const backendBase = getBackendUrl();
  try {
    const res = await fetch(`${backendBase}/api/admin/reviews/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { cookie: request.headers.get("cookie") || "" },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}

