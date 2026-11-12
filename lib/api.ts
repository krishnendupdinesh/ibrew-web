/**
 * Shared API configuration and URL resolver.
 * Priority: NEXT_PUBLIC_API_URL -> BACKEND_URL -> (production error or localhost in dev)
 */
function resolveBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || process.env.BACKEND_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  if (isProduction) {
    console.error(
      "[ibrew-web] CRITICAL: Neither NEXT_PUBLIC_API_URL nor BACKEND_URL is set in production! Falling back to localhost is forbidden in production."
    );
    // In production without an explicit backend URL, point to the known production backend rather than localhost
    return "https://ibrew-backend.onrender.com";
  }

  return "http://localhost:5001";
}

export const API_BASE_URL: string = resolveBaseUrl();

/**
 * Returns the base backend API URL.
 */
export function getApiUrl(): string {
  return resolveBaseUrl();
}

/**
 * Builds a full API endpoint URL from a path.
 * If endpoint starts with "/", appends it to API_BASE_URL.
 */
export function buildApiUrl(path: string): string {
  const base = getApiUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export default API_BASE_URL;


