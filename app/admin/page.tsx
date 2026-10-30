"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ubuntu } from "next/font/google";
import { ChevronDown, FileText, LogOut, Mail, MessageCircle, RefreshCw, Search, Users } from "lucide-react";

// ---------------------------------------------------------------------------
// STYLE TOKENS (same as the other pages)
// ---------------------------------------------------------------------------
const INK = "#1F1A17";
const BROWN = "#7A5A3C";
const PASTEL = "#E9DCC6";
const MUTED = "rgba(31,26,23,0.65)";
const LINE = "rgba(31,26,23,0.15)";
const ERROR = "#B42318";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

// ---------------------------------------------------------------------------
// TYPES (match lib/store.ts)
// ---------------------------------------------------------------------------
type QuoteStatus = "new" | "contacted" | "quoted" | "closed";

type Quote = {
  id: string;
  createdAt: string;
  status: QuoteStatus;
  contact: {
    name: string;
    company?: string;
    email: string;
    phone: string;
    city?: string;
    timeline?: string;
    notes?: string;
  };
  items: { id: string; name: string; category: string; quantity: number; unit: string }[];
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
  createdAt: string;
};

const STATUS_OPTIONS: { value: QuoteStatus; label: string; color: string; bg: string }[] = [
  { value: "new", label: "New", color: "#fff", bg: BROWN },
  { value: "contacted", label: "Contacted", color: "#8A4B08", bg: "#FDE8C8" },
  { value: "quoted", label: "Quote sent", color: "#1B5E3A", bg: "#D6F0E0" },
  { value: "closed", label: "Closed", color: "#4B4540", bg: "#E6E2DD" },
];

const statusMeta = (s: QuoteStatus) => STATUS_OPTIONS.find((o) => o.value === s) ?? STATUS_OPTIONS[0];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const digits = (s: string) => s.replace(/\D/g, "");

// ---------------------------------------------------------------------------
// ADMIN DASHBOARD
// ---------------------------------------------------------------------------
export default function AdminPage() {
  const router = useRouter();

  const [adminName, setAdminName] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<"quotes" | "customers">("quotes");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user || me.user.role !== "admin") {
        router.replace("/login?next=/admin");
        return;
      }
      setAdminName(me.user.name);

      const [q, u] = await Promise.all([fetch("/api/admin/quotes"), fetch("/api/admin/users")]);
      if (q.status === 401 || q.status === 403 || u.status === 401 || u.status === 403) {
        router.replace("/login?next=/admin");
        return;
      }
      if (!q.ok || !u.ok) throw new Error("Request failed");

      setQuotes((await q.json()).quotes);
      setCustomers((await u.json()).users);
    } catch {
      setError("Could not load the dashboard data. Check your connection and refresh.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (id: string, status: QuoteStatus) => {
    const previous = quotes;
    setQuotes((list) => list.map((q) => (q.id === id ? { ...q, status } : q)));
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setQuotes(previous); // put it back if saving failed
      setError("Could not update the status. Try again.");
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const stats = useMemo(
    () => ({
      total: quotes.length,
      fresh: quotes.filter((q) => q.status === "new").length,
      inProgress: quotes.filter((q) => q.status === "contacted" || q.status === "quoted").length,
      customers: customers.filter((c) => c.role === "customer").length,
    }),
    [quotes, customers]
  );

  const visibleQuotes = useMemo(() => {
    const search = query.trim().toLowerCase();
    return quotes.filter((q) => {
      if (statusFilter !== "all" && q.status !== statusFilter) return false;
      if (!search) return true;
      const haystack = [
        q.id,
        q.contact.name,
        q.contact.company,
        q.contact.email,
        q.contact.phone,
        ...q.items.map((i) => i.name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [quotes, statusFilter, query]);

  const visibleCustomers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return customers.filter((c) => !search || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(search));
  }, [customers, query]);

  const statCards = [
    { label: "Total requests", value: stats.total },
    { label: "New requests", value: stats.fresh },
    { label: "In progress", value: stats.inProgress },
    { label: "Customers", value: stats.customers },
  ];

  return (
    <div className={`${ubuntu.className} min-h-screen`} style={{ background: "#FAF7F2", color: INK }}>
      {/* ---------- TOP BAR ---------- */}
      <header className="border-b bg-white" style={{ borderColor: LINE }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Admin dashboard</h1>
            {adminName && (
              <p className="text-xs" style={{ color: MUTED }}>
                Signed in as {adminName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border px-4 py-2 text-xs uppercase tracking-widest transition-colors hover:bg-[#7A5A3C] hover:text-[#F5EDE0]"
              style={{ borderColor: BROWN, color: BROWN }}
            >
              View site
            </Link>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              aria-label="Refresh data"
              className="flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-50"
              style={{ borderColor: LINE }}
            >
              <RefreshCw aria-hidden className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs uppercase tracking-widest text-white"
              style={{ background: BROWN }}
            >
              <LogOut aria-hidden className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {error && (
          <p role="alert" className="mb-5 rounded-md border bg-white px-4 py-3 text-sm" style={{ borderColor: ERROR, color: ERROR }}>
            {error}
          </p>
        )}

        {/* ---------- STATS ---------- */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4" style={{ borderColor: LINE }}>
              <p className="text-xs" style={{ color: MUTED }}>
                {s.label}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{loading ? "-" : s.value}</p>
            </div>
          ))}
        </div>

        {/* ---------- TABS + SEARCH ---------- */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: LINE }}>
          <div className="flex gap-2" role="tablist" aria-label="Dashboard sections">
            {(
              [
                { id: "quotes", label: "Quotation requests", Icon: FileText },
                { id: "customers", label: "Customers", Icon: Users },
              ] as const
            ).map(({ id, label, Icon }) => {
              const on = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(id)}
                  className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition-colors"
                  style={{ borderColor: BROWN, background: on ? BROWN : "transparent", color: on ? "#fff" : BROWN }}
                >
                  <Icon aria-hidden className="h-4 w-4" /> {label}
                </button>
              );
            })}
          </div>

          <label
            className="flex w-full items-center gap-2 rounded-md border bg-white px-3 focus-within:border-[#7A5A3C] sm:w-72"
            style={{ borderColor: LINE }}
          >
            <Search aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: MUTED }} />
            <span className="sr-only">Search</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "quotes" ? "Search name, email, reference, item..." : "Search name, email, phone..."}
              className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none placeholder:text-[#1F1A17]/40"
            />
          </label>
        </div>

        {/* ---------- QUOTATION REQUESTS ---------- */}
        {tab === "quotes" && (
          <section className="mt-5" role="tabpanel">
            <div className="mb-4 flex flex-wrap gap-2">
              {(["all", ...STATUS_OPTIONS.map((o) => o.value)] as const).map((s) => {
                const on = statusFilter === s;
                const count = s === "all" ? quotes.length : quotes.filter((q) => q.status === s).length;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    aria-pressed={on}
                    className="rounded-full border px-3 py-1.5 text-xs transition-colors"
                    style={{ borderColor: on ? INK : LINE, background: on ? INK : "#fff", color: on ? "#fff" : INK }}
                  >
                    {s === "all" ? "All" : statusMeta(s).label} ({count})
                  </button>
                );
              })}
            </div>

            {loading ? (
              <p className="py-12 text-center text-sm" style={{ color: MUTED }}>
                Loading requests...
              </p>
            ) : visibleQuotes.length === 0 ? (
              <div className="rounded-xl border bg-white py-14 text-center" style={{ borderColor: LINE }}>
                <p className="text-lg font-medium" style={{ color: BROWN }}>
                  {quotes.length === 0 ? "No quotation requests yet" : "No requests match"}
                </p>
                <p className="mt-1 text-sm" style={{ color: MUTED }}>
                  {quotes.length === 0
                    ? "Requests sent from the bulk order page will appear here."
                    : "Try another status or search."}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {visibleQuotes.map((q) => {
                  const open = openId === q.id;
                  const meta = statusMeta(q.status);
                  const totalUnits = q.items.length;
                  const message = `Hello ${q.contact.name}, thank you for your bulk order request ${q.id}.`;
                  return (
                    <li key={q.id} className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: LINE }}>
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : q.id)}
                        aria-expanded={open}
                        className="flex w-full items-center gap-3 p-4 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-sm font-bold">{q.contact.name}</span>
                            {q.contact.company && (
                              <span className="text-xs" style={{ color: MUTED }}>
                                {q.contact.company}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                            {q.id} · {formatDate(q.createdAt)} · {totalUnits} {totalUnits === 1 ? "item" : "items"}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <ChevronDown aria-hidden className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
                      </button>

                      {open && (
                        <div className="border-t px-4 pb-5 pt-4" style={{ borderColor: LINE }}>
                          <div className="grid gap-6 md:grid-cols-2">
                            {/* Items */}
                            <div>
                              <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.2em]">Items requested</h3>
                              {q.items.length === 0 ? (
                                <p className="text-sm" style={{ color: MUTED }}>
                                  No items selected. See the notes.
                                </p>
                              ) : (
                                <ul className="divide-y rounded-lg border text-sm" style={{ borderColor: LINE }}>
                                  {q.items.map((i) => (
                                    <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2" style={{ borderColor: LINE }}>
                                      <span className="min-w-0">
                                        <span className="block truncate font-medium">{i.name}</span>
                                        <span className="text-xs" style={{ color: MUTED }}>
                                          {i.category}
                                        </span>
                                      </span>
                                      <span className="shrink-0 font-bold tabular-nums">
                                        {i.quantity} {i.unit}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* Contact */}
                            <div>
                              <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.2em]">Customer</h3>
                              <dl className="space-y-1.5 text-sm">
                                <div className="flex gap-2">
                                  <dt className="w-20 shrink-0" style={{ color: MUTED }}>Email</dt>
                                  <dd className="min-w-0 break-words">{q.contact.email}</dd>
                                </div>
                                <div className="flex gap-2">
                                  <dt className="w-20 shrink-0" style={{ color: MUTED }}>Phone</dt>
                                  <dd>{q.contact.phone}</dd>
                                </div>
                                {q.contact.city && (
                                  <div className="flex gap-2">
                                    <dt className="w-20 shrink-0" style={{ color: MUTED }}>City</dt>
                                    <dd>{q.contact.city}</dd>
                                  </div>
                                )}
                                {q.contact.timeline && (
                                  <div className="flex gap-2">
                                    <dt className="w-20 shrink-0" style={{ color: MUTED }}>Needed</dt>
                                    <dd>{q.contact.timeline}</dd>
                                  </div>
                                )}
                                {q.contact.notes && (
                                  <div className="flex gap-2">
                                    <dt className="w-20 shrink-0" style={{ color: MUTED }}>Notes</dt>
                                    <dd className="min-w-0 whitespace-pre-wrap break-words">{q.contact.notes}</dd>
                                  </div>
                                )}
                              </dl>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4" style={{ borderColor: LINE }}>
                            <label className="flex items-center gap-2 text-xs font-medium">
                              Status
                              <select
                                value={q.status}
                                onChange={(e) => changeStatus(q.id, e.target.value as QuoteStatus)}
                                className="rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-[#7A5A3C]"
                                style={{ borderColor: LINE }}
                              >
                                {STATUS_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <a
                              href={`mailto:${q.contact.email}?subject=${encodeURIComponent(`Your quotation ${q.id}`)}&body=${encodeURIComponent(message)}`}
                              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider"
                              style={{ borderColor: BROWN, color: BROWN }}
                            >
                              <Mail aria-hidden className="h-4 w-4" /> Reply by email
                            </a>
                            {digits(q.contact.phone).length >= 8 && (
                              <a
                                href={`https://wa.me/${digits(q.contact.phone)}?text=${encodeURIComponent(message)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider"
                                style={{ borderColor: BROWN, color: BROWN }}
                              >
                                <MessageCircle aria-hidden className="h-4 w-4" /> WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* ---------- CUSTOMERS ---------- */}
        {tab === "customers" && (
          <section className="mt-5" role="tabpanel">
            {loading ? (
              <p className="py-12 text-center text-sm" style={{ color: MUTED }}>
                Loading customers...
              </p>
            ) : visibleCustomers.length === 0 ? (
              <div className="rounded-xl border bg-white py-14 text-center" style={{ borderColor: LINE }}>
                <p className="text-lg font-medium" style={{ color: BROWN }}>
                  {customers.length === 0 ? "No accounts yet" : "No customers match"}
                </p>
                <p className="mt-1 text-sm" style={{ color: MUTED }}>
                  {customers.length === 0 ? "New registrations will appear here." : "Try a different search."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-white" style={{ borderColor: LINE }}>
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead style={{ background: PASTEL }}>
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Name</th>
                      <th scope="col" className="px-4 py-3 font-medium">Email</th>
                      <th scope="col" className="px-4 py-3 font-medium">Phone</th>
                      <th scope="col" className="px-4 py-3 font-medium">Role</th>
                      <th scope="col" className="px-4 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCustomers.map((c) => (
                      <tr key={c.id} className="border-t" style={{ borderColor: LINE }}>
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3">{c.email}</td>
                        <td className="px-4 py-3">{c.phone || "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={c.role === "admin" ? { background: BROWN, color: "#fff" } : { background: "#E6E2DD", color: "#4B4540" }}
                          >
                            {c.role === "admin" ? "Admin" : "Customer"}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ color: MUTED }}>
                          {formatDate(c.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}