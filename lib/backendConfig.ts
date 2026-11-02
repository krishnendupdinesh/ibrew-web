/**
 * Centralized backend URL resolver for Next.js API routes, rewrites, and server components.
 * In production (e.g. Vercel -> Render), reads process.env.BACKEND_URL.
 * In development, defaults to IPv4 http://127.0.0.1:5001 to prevent Windows IPv6 ::1 ECONNREFUSED.
 */
export function getBackendUrl(): string {
  const envUrl = process.env.BACKEND_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  return "http://127.0.0.1:5001";
}

