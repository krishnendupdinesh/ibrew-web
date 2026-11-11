/**
 * Shared API configuration and URL resolver.
 * Priority: NEXT_PUBLIC_API_URL -> BACKEND_URL -> http://localhost:5001
 */
export const API_BASE_URL: string =
  (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:5001"
  ).replace(/\/+$/, "");

/**
 * Returns the base backend API URL.
 */
export function getApiUrl(): string {
  return API_BASE_URL;
}

/**
 * Builds a full API endpoint URL from a path.
 * If endpoint starts with "/", appends it to API_BASE_URL.
 */
export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export default API_BASE_URL;

