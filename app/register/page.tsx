"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ubuntu } from "next/font/google";
import { Eye, EyeOff, UserPlus } from "lucide-react";

// ---------------------------------------------------------------------------
// STYLE TOKENS (same as the other pages)
// ---------------------------------------------------------------------------
const INK = "#1F1A17";
const BROWN = "#7A5A3C";
const MUTED = "rgba(31,26,23,0.65)";
const LINE = "rgba(31,26,23,0.15)";
const ERROR = "#B42318";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

// Banner image behind the page title - paste your own link
const BANNER = "https://your-image-url.com/register-banner.jpg";

const inputClass =
  "w-full min-w-0 rounded-md border bg-white px-3 py-3 text-sm outline-none focus:border-[#7A5A3C]";

type Fields = { name: string; email: string; phone: string; password: string; confirm: string };
type FieldErrors = Partial<Record<keyof Fields, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<Fields>({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const setField = (key: keyof Fields, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next: FieldErrors = {};
    if (form.name.trim().length < 2) next.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (form.phone && form.phone.replace(/\D/g, "").length < 8) next.phone = "Enter a phone number with at least 8 digits.";
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    if (form.confirm !== form.password) next.confirm = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Could not create your account. Try again.");
        setLoading(false);
        return;
      }
      router.push(data.user.role === "admin" ? "/admin" : "/");
      router.refresh();
    } catch {
      setServerError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  const fieldError = (key: keyof Fields) =>
    errors[key] ? (
      <p id={`err-${key}`} className="mt-1 text-xs" style={{ color: ERROR }}>
        {errors[key]}
      </p>
    ) : null;

  const fieldProps = (key: keyof Fields) => ({
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `err-${key}` : undefined,
    style: { borderColor: errors[key] ? ERROR : LINE },
  });

  return (
    <div className={`${ubuntu.className} min-h-screen`} style={{ background: "#FFFFFF", color: INK }}>
      <section className="relative overflow-hidden bg-black text-white">
        <img src={BANNER} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 px-4 py-12 text-center sm:py-16">
          <nav aria-label="Breadcrumb" className="mb-3 text-[11px] uppercase tracking-[0.25em] sm:text-xs">
            <Link href="/" className="transition-colors hover:text-white/70">
              Home
            </Link>
            <span className="mx-2 sm:mx-3" aria-hidden>
              /
            </span>
            <span aria-current="page">Register</span>
          </nav>
          <h1 className="text-3xl font-bold sm:text-4xl">Create your account</h1>
          <p className="mt-2 text-sm md:text-base">Save your details and follow your bulk orders.</p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
        <div className="rounded-xl border bg-white p-6 sm:p-8" style={{ borderColor: LINE }}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-medium">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={inputClass}
                {...fieldProps("name")}
              />
              {fieldError("name")}
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={inputClass}
                {...fieldProps("email")}
              />
              {fieldError("email")}
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-xs font-medium">
                Phone / WhatsApp (optional)
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className={inputClass}
                {...fieldProps("phone")}
              />
              {fieldError("phone")}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  className={`${inputClass} pr-11`}
                  {...fieldProps("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-0 flex h-full w-11 items-center justify-center"
                  style={{ color: MUTED }}
                >
                  {showPassword ? <EyeOff aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? fieldError("password") : (
                <p className="mt-1 text-xs" style={{ color: MUTED }}>
                  At least 8 characters.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirm" className="mb-1 block text-xs font-medium">
                Confirm password
              </label>
              <input
                id="confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setField("confirm", e.target.value)}
                className={inputClass}
                {...fieldProps("confirm")}
              />
              {fieldError("confirm")}
            </div>

            {serverError && (
              <p role="alert" className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: ERROR, color: ERROR }}>
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold uppercase tracking-wider text-white transition active:scale-[0.98] disabled:opacity-60"
              style={{ background: BROWN }}
            >
              <UserPlus aria-hidden className="h-4 w-4" />
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: MUTED }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium underline underline-offset-4" style={{ color: BROWN }}>
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
}