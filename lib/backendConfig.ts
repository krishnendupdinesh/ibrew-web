import { getApiUrl } from "./api";

/**
 * Centralized backend URL resolver for Next.js API routes, rewrites, and server components.
 * Priority: NEXT_PUBLIC_API_URL -> BACKEND_URL -> (production default https://ibrew-backend.onrender.com or localhost in dev)
 */
export function getBackendUrl(): string {
  return getApiUrl();
}

