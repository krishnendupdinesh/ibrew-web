"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Ubuntu } from "next/font/google";
import { Eye, EyeOff, LogIn } from "lucide-react";

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
const BANNER = "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D";

const inputClass =
  "w-full min-w-0 rounded-md border bg-white px-3 py-3 text-sm outline-none focus:border-[#7A5A3C]";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not log in. Try again.");
        setLoading(false);
        return;
      }

      // Admins go to the dashboard, everyone else to where they were headed
      const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(data.user.role === "admin" ? safe ?? "/admin" : safe ?? "/");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          style={{ borderColor: LINE }}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-medium">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-11`}
            style={{ borderColor: LINE }}
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
      </div>

      {error && (
        <p role="alert" className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: ERROR, color: ERROR }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold uppercase tracking-wider text-white transition active:scale-[0.98] disabled:opacity-60"
        style={{ background: BROWN }}
      >
        <LogIn aria-hidden className="h-4 w-4" />
        {loading ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
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
            <span aria-current="page">Log in</span>
          </nav>
          <h1 className="text-3xl font-bold sm:text-4xl">Welcome back</h1>
          <p className="mt-2 text-sm md:text-base">Log in to track your quotation requests.</p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
        <div className="rounded-xl border bg-white p-6 sm:p-8" style={{ borderColor: LINE }}>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: MUTED }}>
          New here?{" "}
          <Link href="/register" className="font-medium underline underline-offset-4" style={{ color: BROWN }}>
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}