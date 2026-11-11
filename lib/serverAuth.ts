import crypto from "crypto";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  role: "admin" | "customer";
}

export interface AdminCredentials {
  id: string;
  name: string;
  username: string;
  email: string;
}

/**
 * Lazy getter for JWT secret. Evaluated at request time so Next.js build
 * does not fail when JWT_SECRET is not supplied during static asset generation.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is missing.");
  }
  return secret;
}

/**
 * Constant-time string equality check using SHA-256 digests.
 * Hashing fixed-size buffers completely prevents length mismatch exceptions
 * while ensuring constant execution time against side-channel timing attacks.
 */
export function safeCompareStrings(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function getAdminCredentials(): AdminCredentials {
  return {
    id: "admin-default",
    name: process.env.ADMIN_NAME || "ibrew Admin",
    username: (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase(),
    email: (process.env.ADMIN_EMAIL || "admin@ibrew.com").trim().toLowerCase(),
  };
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  return Buffer.from(base64, "base64").toString("utf8");
}

export function signJwtHs256(user: AuthUser): string {
  const secret = getJwtSecret();
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const nowSec = Math.floor(Date.now() / 1000);
  const isCustomer = user.role === "customer";
  // Customers: 10 years persistent JWT validity; Admins: 7 days
  const expDurationSec = isCustomer ? 10 * 365 * 24 * 60 * 60 : 7 * 24 * 60 * 60;

  const payload = base64UrlEncode(
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username || "",
      phone: user.phone || "",
      role: user.role,
      iat: nowSec,
      exp: nowSec + expDurationSec,
    })
  );
  const signature = base64UrlEncode(
    crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest()
  );
  return `${header}.${payload}.${signature}`;
}

export function verifyJwtHs256(token: string): Record<string, unknown> | null {
  try {
    const secret = getJwtSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = base64UrlEncode(
      crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest()
    );

    // Constant-time comparison
    if (!safeCompareStrings(signature, expectedSig)) return null;

    const decoded = JSON.parse(base64UrlDecode(payload));
    if (decoded.exp && Math.floor(Date.now() / 1000) > Number(decoded.exp)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Checks if the login identifier and password match configured admin environment variables.
 * Safe against timing attacks.
 */
export function checkDefaultAdmin(identifier: string, password: string): AuthUser | null {
  const creds = getAdminCredentials();
  const normalized = identifier.trim().toLowerCase();
  const isAdminIdentifier =
    normalized === creds.username || normalized === creds.email;

  const envAdminPassword = process.env.ADMIN_PASSWORD;
  if (!isAdminIdentifier || !envAdminPassword) {
    return null;
  }

  if (safeCompareStrings(password, envAdminPassword)) {
    return {
      id: creds.id,
      name: creds.name,
      email: creds.email,
      username: creds.username,
      phone: "",
      role: "admin",
    };
  }
  return null;
}

/**
 * Prevents any customer from registering with the admin username or email.
 */
export function validateCustomerRegistrationNotAdmin(
  email: string,
  _password: string,
  name?: string
): string | null {
  const creds = getAdminCredentials();
  const normEmail = email.trim().toLowerCase();
  const normName = (name || "").trim().toLowerCase();
  const emailPrefix = normEmail.split("@")[0];

  if (
    normEmail === creds.email ||
    normEmail === creds.username ||
    emailPrefix === creds.username ||
    normName === creds.username
  ) {
    return "This username or email is reserved and cannot be used.";
  }

  const envAdminPassword = process.env.ADMIN_PASSWORD;
  if (envAdminPassword && safeCompareStrings(_password, envAdminPassword)) {
    return "This password is not allowed. Please choose a different password.";
  }

  return null;
}
