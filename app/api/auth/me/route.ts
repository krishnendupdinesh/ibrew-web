import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyJwtHs256 } from "../../../../lib/serverAuth";
import { getBackendUrl } from "../../../../lib/backendConfig";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (token) {
      const decoded = verifyJwtHs256(token);
      if (decoded && decoded.id && decoded.email && decoded.role) {
        return NextResponse.json({
          user: {
            id: String(decoded.id),
            name: String(decoded.name || "User"),
            email: String(decoded.email),
            phone: String(decoded.phone || ""),
            role: String(decoded.role),
            mustResetPassword: Boolean(decoded.mustResetPassword),
          },
        });
      }
    }

    // If access token is expired/missing but refresh token exists, ask backend to refresh session
    if (refreshToken) {
      const backendUrl = getBackendUrl();
      const upstream = await fetch(`${backendUrl}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || `refreshToken=${refreshToken}`,
        },
        body: JSON.stringify({ refreshToken }),
        signal: AbortSignal.timeout(4000),
      });

      if (upstream.ok) {
        const data = await upstream.json();
        if (data?.user) {
          const res = NextResponse.json({ user: data.user });
          const setCookie = upstream.headers.get("set-cookie");
          if (setCookie) {
            res.headers.set("set-cookie", setCookie);
          }
          return res;
        }
      }
    }

    // Direct fallback for backend verification
    const res = await fetch(`${getBackendUrl()}/api/auth/me`, {
      headers: { cookie: request.headers.get("cookie") || "" },
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ user: data.user || null });
    }
    return NextResponse.json({ user: null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
