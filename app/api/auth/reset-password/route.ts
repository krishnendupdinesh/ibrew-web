import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAdminCredentials,
  signJwtHs256,
  verifyJwtHs256,
  type AuthUser,
} from "../../../../lib/serverAuth";
import { getBackendUrl } from "../../../../lib/backendConfig";

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

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const decoded = token ? verifyJwtHs256(token) : null;

  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ error: "Admin access only." }, { status: 403 });
  }

  const creds = getAdminCredentials();
  return NextResponse.json({
    credentials: {
      name: creds.name,
      username: creds.username,
      email: creds.email,
    },
  });
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decoded = token ? verifyJwtHs256(token) : null;

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access only." }, { status: 403 });
    }

    const body = await request.json();
    const newPassword = String(body.newPassword || "").trim();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const currentCreds = getAdminCredentials();
    const backendUrl = getBackendUrl();

    // Delegate to Express MySQL backend to hash with bcrypt and persist in database
    const upstream = await fetch(`${backendUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        email: currentCreds.email,
        newPassword,
      }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { error: data.error || "Could not reset password." },
        { status: upstream.status || 400 }
      );
    }

    const updatedUser: AuthUser = {
      id: "admin-default",
      name: currentCreds.name,
      email: currentCreds.email,
      username: currentCreds.username,
      phone: "",
      role: "admin",
    };

    const res = NextResponse.json({
      user: updatedUser,
      credentials: {
        name: currentCreds.name,
        username: currentCreds.username,
        email: currentCreds.email,
      },
      message: "Admin password updated and hashed in MySQL successfully!",
    });

    return attachTokenCookie(res, updatedUser);
  } catch (err) {
    console.error("POST /api/auth/reset-password error:", err);
    return NextResponse.json({ error: "Could not reset password." }, { status: 400 });
  }
}
