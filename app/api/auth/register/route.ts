import { NextResponse } from "next/server";
import {
  registerLocalCustomer,
  signJwtHs256,
  validateCustomerRegistrationNotAdmin,
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

    // Try Express backend first, fallback to local customer store
    try {
      const upstream = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
        signal: AbortSignal.timeout(4000),
      });

      const data = await upstream.json();
      if (!upstream.ok) {
        return NextResponse.json(
          { error: data.error || "Could not create your account." },
          { status: upstream.status }
        );
      }

      const user: AuthUser = {
        id: String(data.user.id || data.user._id),
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || "",
        role: "customer",
      };
      registerLocalCustomer(name, email, phone, password);
      const res = NextResponse.json({ user }, { status: 201 });
      return attachTokenCookie(res, user);
    } catch {
      const localResult = registerLocalCustomer(name, email, phone, password);
      if (localResult.error || !localResult.user) {
        return NextResponse.json(
          { error: localResult.error || "Could not create your account." },
          { status: 409 }
        );
      }
      const res = NextResponse.json({ user: localResult.user }, { status: 201 });
      return attachTokenCookie(res, localResult.user);
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

