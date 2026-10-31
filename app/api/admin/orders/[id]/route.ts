import { NextResponse } from "next/server";
import { deleteServerOrder, patchServerOrder } from "../../../../../lib/serverOrderStore";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5001";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const updatedLocal = patchServerOrder(id, body);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          patchServerOrder(id, data.order);
          return NextResponse.json({ order: data.order });
        }
      }
    } catch {
      // Backend offline; use updatedLocal
    }

    if (updatedLocal) {
      return NextResponse.json({ order: updatedLocal });
    }

    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Could not update order." }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  deleteServerOrder(id);

  fetch(`${BACKEND_URL}/api/admin/orders/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { cookie: request.headers.get("cookie") || "" },
    signal: AbortSignal.timeout(2000),
  }).catch(() => {});

  return NextResponse.json({ message: "Order deleted." });
}

