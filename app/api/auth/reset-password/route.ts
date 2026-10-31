import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAdminCredentials,
  signJwtHs256,
  updateAdminPassword,
  verifyJwtHs256,
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
      password: creds.passwordPlain,
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
    const updatedCreds = updateAdminPassword(newPassword);

    // Sync to Express backend if running
    fetch(`${BACKEND_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: currentCreds.email,
        currentPassword: currentCreds.passwordPlain,
        newPassword,
      }),
      signal: AbortSignal.timeout(2500),
    }).catch(() => {});

    const updatedUser: AuthUser = {
      id: updatedCreds.id,
      name: updatedCreds.name,
      email: updatedCreds.email,
      username: updatedCreds.username,
      phone: "",
      role: "admin",
    };

    const res = NextResponse.json({
      user: updatedUser,
      credentials: {
        name: updatedCreds.name,
        username: updatedCreds.username,
        email: updatedCreds.email,
        password: updatedCreds.passwordPlain,
      },
      message: "Admin password updated successfully!",
    });

    return attachTokenCookie(res, updatedUser);
  } catch {
    return NextResponse.json({ error: "Could not reset password." }, { status: 400 });
  }
}
