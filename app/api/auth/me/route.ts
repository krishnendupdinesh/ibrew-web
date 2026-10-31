import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyJwtHs256 } from "../../../../lib/serverAuth";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5001";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = verifyJwtHs256(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json({ user: null });
    }

    // Fast path: JWT already carries full profile (< 1ms, no DB round-trip!)
    if (decoded.email && decoded.role) {
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

    // Fallback for legacy tokens that only stored { id }
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
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
