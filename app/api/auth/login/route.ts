import { NextResponse } from "next/server";
import {
  checkDefaultAdmin,
  signJwtHs256,
  type AuthUser,
} from "../../../../lib/serverAuth";
import { getBackendUrl } from "../../../../lib/backendConfig";

function attachTokenCookie(res: NextResponse, user: AuthUser) {
  const token = signJwtHs256(user);
  const isCustomer = user.role === "customer";
  // Customers: 10 years persistent cookie; Admins: 7 days
  const maxAge = isCustomer ? 10 * 365 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAge,
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

    // 1. Admin shortcut check for configured admin credentials
    const adminUser = checkDefaultAdmin(identifier, password);
    if (adminUser) {
      const res = NextResponse.json({ user: adminUser });
      return attachTokenCookie(res, adminUser);
    }

    // 2. Authenticate customer directly against MySQL backend
    const backendUrl = getBackendUrl();
    try {
      const upstream = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
        signal: AbortSignal.timeout(5000),
      });

      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return NextResponse.json(
          { error: data.error || "Invalid email or password." },
          { status: upstream.status || 401 }
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
      attachTokenCookie(res, user);

      // Forward Set-Cookie headers from backend (including refreshToken)
      const setCookies = upstream.headers.getSetCookie ? upstream.headers.getSetCookie() : [];
      if (setCookies && setCookies.length > 0) {
        setCookies.forEach((cookieStr) => {
          res.headers.append("set-cookie", cookieStr);
        });
      } else {
        const rawSetCookie = upstream.headers.get("set-cookie");
        if (rawSetCookie) {
          res.headers.set("set-cookie", rawSetCookie);
        }
      }

      return res;
    } catch (err) {
      console.error("Backend login fetch error:", err);
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
