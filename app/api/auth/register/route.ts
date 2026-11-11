import { NextResponse } from "next/server";
import {
  signJwtHs256,
  validateCustomerRegistrationNotAdmin,
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
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");

    if (name.length < 2) {
      return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Prevent customers from using the permanent admin username, email, or password
    const reservedError = validateCustomerRegistrationNotAdmin(email, password, name);
    if (reservedError) {
      return NextResponse.json({ error: reservedError }, { status: 403 });
    }

    // Save customer permanently to MySQL database
    const backendUrl = getBackendUrl();
    try {
      const upstream = await fetch(`${backendUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
        signal: AbortSignal.timeout(5000),
      });

      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return NextResponse.json(
          { error: data.error || "Could not create your account." },
          { status: upstream.status || 400 }
        );
      }

      const user: AuthUser = {
        id: String(data.user.id || data.user._id),
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || "",
        role: "customer",
      };

      const res = NextResponse.json({ user }, { status: 201 });
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
      console.error("Backend register fetch error:", err);
      return NextResponse.json(
        { error: "Could not reach database server. Please try again." },
        { status: 503 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
