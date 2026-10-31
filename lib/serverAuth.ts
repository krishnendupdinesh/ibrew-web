import crypto from "crypto";
import fs from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "adrijbyfkdfkugbcjustsnriudbbdfjf";

const DEFAULT_ADMIN_USERNAME = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@ibrew.com").trim().toLowerCase();
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || "ibrew Admin";

const CREDENTIALS_FILE = path.join(process.cwd(), ".admin-credentials.json");

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
  passwordPlain: string;
}

interface StoredCustomer extends AuthUser {
  passwordPlain: string;
}

const g = globalThis as unknown as {
  __ibrewAdminCreds?: AdminCredentials;
  __ibrewCustomerStore?: Map<string, StoredCustomer>;
};

function loadPersistedAdminCreds(): AdminCredentials {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const raw = fs.readFileSync(CREDENTIALS_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.passwordPlain) {
        return {
          id: "admin-default",
          name: parsed.name || DEFAULT_ADMIN_NAME,
          username: (parsed.username || DEFAULT_ADMIN_USERNAME).trim().toLowerCase(),
          email: (parsed.email || DEFAULT_ADMIN_EMAIL).trim().toLowerCase(),
          passwordPlain: String(parsed.passwordPlain),
        };
      }
    }
  } catch {
    // ignore file read errors
  }
  return {
    id: "admin-default",
    name: DEFAULT_ADMIN_NAME,
    username: DEFAULT_ADMIN_USERNAME,
    email: DEFAULT_ADMIN_EMAIL,
    passwordPlain: DEFAULT_ADMIN_PASSWORD,
  };
}

function savePersistedAdminCreds(creds: AdminCredentials) {
  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), "utf8");
  } catch {
    // ignore file write errors
  }
}

export function getAdminCredentials(): AdminCredentials {
  if (!g.__ibrewAdminCreds) {
    g.__ibrewAdminCreds = loadPersistedAdminCreds();
  }
  return g.__ibrewAdminCreds;
}

export function updateAdminPassword(newPassword: string): AdminCredentials {
  const current = getAdminCredentials();
  const updated: AdminCredentials = {
    ...current,
    passwordPlain: newPassword,
  };
  g.__ibrewAdminCreds = updated;
  savePersistedAdminCreds(updated);
  return updated;
}

function getCustomerStore(): Map<string, StoredCustomer> {
  if (!g.__ibrewCustomerStore) {
    g.__ibrewCustomerStore = new Map<string, StoredCustomer>();
  }
  return g.__ibrewCustomerStore;
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
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username || "",
      phone: user.phone || "",
      role: user.role,
      iat: nowSec,
      exp: nowSec + 7 * 24 * 60 * 60,
    })
  );
  const signature = base64UrlEncode(
    crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest()
  );
  return `${header}.${payload}.${signature}`;
}

export function verifyJwtHs256(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = base64UrlEncode(
      crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest()
    );
    if (signature !== expectedSig) return null;
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
 * Checks if the login identifier (permanent username OR permanent admin email)
 * and current admin password match the Admin account.
 */
export function checkDefaultAdmin(identifier: string, password: string): AuthUser | null {
  const creds = getAdminCredentials();
  const normalized = identifier.trim().toLowerCase();
  const isAdminIdentifier =
    normalized === creds.username || normalized === creds.email;

  if (isAdminIdentifier && password === creds.passwordPlain) {
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
 * Prevents any customer from registering with the admin username,
 * admin email, or admin password.
 */
export function validateCustomerRegistrationNotAdmin(
  email: string,
  password: string,
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

  if (password === creds.passwordPlain || password === DEFAULT_ADMIN_PASSWORD) {
    return "This password is not allowed. Please choose a different password.";
  }

  return null;
}

export function registerLocalCustomer(
  name: string,
  email: string,
  phone: string,
  password: string
): { user?: AuthUser; error?: string } {
  const reservedErr = validateCustomerRegistrationNotAdmin(email, password, name);
  if (reservedErr) return { error: reservedErr };

  const store = getCustomerStore();
  const normEmail = email.trim().toLowerCase();
  if (store.has(normEmail)) {
    return { error: "An account with this email already exists." };
  }

  const created: StoredCustomer = {
    id: `cust-${Date.now()}`,
    name: name.trim(),
    email: normEmail,
    phone: phone.trim(),
    role: "customer",
    passwordPlain: password,
  };
  store.set(normEmail, created);

  return {
    user: {
      id: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone,
      role: "customer",
    },
  };
}

export function checkLocalCustomer(identifier: string, password: string): AuthUser | null {
  const store = getCustomerStore();
  const norm = identifier.trim().toLowerCase();
  const found = store.get(norm);
  if (found && found.passwordPlain === password) {
    return {
      id: found.id,
      name: found.name,
      email: found.email,
      phone: found.phone,
      role: "customer",
    };
  }
  return null;
}
