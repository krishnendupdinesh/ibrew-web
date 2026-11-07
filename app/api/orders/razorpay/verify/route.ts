import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backendConfig";

export async function POST(request: NextRequest) {
  const backendBase = getBackendUrl();
  try {
    const body = await request.json();
    const res = await fetch(`${backendBase}/api/orders/razorpay/verify`, {
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
        { error: data.error || "Payment verification failed." },
        { status: res.status || 400 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("POST /api/orders/razorpay/verify error:", (err as Error)?.message || err);
    return NextResponse.json(
      { error: "Could not connect to verification service." },
      { status: 500 }
    );
  }
}

