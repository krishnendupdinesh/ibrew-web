import { API_BASE_URL } from "./api";

/**
 * Centralized backend URL resolver for Next.js API routes, rewrites, and server components.
 * Priority: NEXT_PUBLIC_API_URL -> BACKEND_URL -> http://localhost:5001
 */
export function getBackendUrl(): string {
  return API_BASE_URL;
}
