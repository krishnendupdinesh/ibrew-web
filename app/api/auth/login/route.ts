import { NextResponse } from "next/server";
import {
  checkDefaultAdmin,
  checkLocalCustomer,
  signJwtHs256,
  type AuthUser,
} from "../../../../lib/serverAuth";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5001";

function attachTokenCookie(res: NextResponse, user: AuthUser) {
  const token = signJwtHs256(user);
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.email || body.username || body.identifier || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Enter your username/email and password." },
        { status: 400 }
      );
    }

    // 1. Instant path: Permanent Admin Username or Email + Permanent Password (< 1ms)
    const adminUser = checkDefaultAdmin(identifier, password);
    if (adminUser) {
      const res = NextResponse.json({ user: adminUser });
      return attachTokenCookie(res, adminUser);
    }

    // 2. Check local customer store
    const localCust = checkLocalCustomer(identifier, password);
    if (localCust) {
      const res = NextResponse.json({ user: localCust });
      return attachTokenCookie(res, localCust);
    }

    // 3. Proxy to Express backend on 127.0.0.1:5001
    try {
      const upstream = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
        signal: AbortSignal.timeout(4000),
      });

      const data = await upstream.json();
      if (!upstream.ok) {
        return NextResponse.json(
          { error: data.error || "Wrong username/email or password." },
          { status: upstream.status }
        );
      }

      const user: AuthUser = {
        id: String(data.user.id || data.user._id),
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || "",
        role: data.user.role || "customer",
      };

      const res = NextResponse.json({ user });
      return attachTokenCookie(res, user);
    } catch {
      return NextResponse.json(
        { error: "Wrong username/email or password." },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
