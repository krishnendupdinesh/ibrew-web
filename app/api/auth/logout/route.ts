import { NextResponse } from "next/server";
import { getBackendUrl } from "../../../../lib/backendConfig";

export async function POST(request: Request) {
  try {
    const backendUrl = getBackendUrl();
    await fetch(`${backendUrl}/api/auth/logout`, {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  } catch {
    // Ignore backend unreachable during logout
  }

  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.set("token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("refreshToken", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

