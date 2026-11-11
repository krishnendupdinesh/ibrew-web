import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendUrl } from "../../../../lib/backendConfig";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    const cookieHeader = request.headers.get("cookie") || (refreshToken ? `refreshToken=${refreshToken}` : "");
    const backendUrl = getBackendUrl();

    const upstream = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await upstream.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: upstream.status });

    // Forward Set-Cookie headers from upstream backend
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) {
      res.headers.set("set-cookie", setCookie);
    }

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to reach refresh authentication service." },
      { status: 502 }
    );
  }
}

