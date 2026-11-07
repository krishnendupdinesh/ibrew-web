"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Ubuntu } from "next/font/google";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  Lock,
  MessageCircle,
  Package,
  Printer,
  RotateCcw,
  Search,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";
import type { StoreOrder } from "../../lib/orderStore";
import { addToCart } from "../../lib/cartStore";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const INK = "#1F1A17";
const BROWN = "#7A5A3C";
const MUTED = "rgba(31,26,23,0.65)";
const LINE = "rgba(31,26,23,0.15)";
const BANNER =
  "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=70";

const formatPrice = (price: number) => `₹${Number(price || 0).toLocaleString("en-IN")}`;

const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

function getCourierTrackingUrl(courierName: string, trackingNumber: string): string {
  const c = courierName.trim().toLowerCase();
  const t = trackingNumber.trim();
  if (!t) return "";

  if (c.includes("delhivery")) return `https://www.delhivery.com/track/package/${encodeURIComponent(t)}`;
  if (c.includes("bluedart") || c.includes("blue dart"))
    return `https://www.bluedart.com/tracking?trackNumber=${encodeURIComponent(t)}`;
  if (c.includes("dtdc"))
    return `https://www.dtdc.in/tracking/tracking_results.asp?TType=awb_no&strCNNO=${encodeURIComponent(t)}`;
  if (c.includes("india post") || c.includes("speed post") || c.includes("post"))
    return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(t)}`;
  if (c.includes("shadowfax")) return `https://tracker.shadowfax.in/#/${encodeURIComponent(t)}`;
  if (c.includes("ekart")) return `https://ekartlogistics.com/shipmenttrack/${encodeURIComponent(t)}`;
  if (c.includes("xpressbees") || c.includes("xpress"))
    return `https://www.xpressbees.com/track?isAwb=Yes&trackid=${encodeURIComponent(t)}`;

  return `https://www.google.com/search?q=${encodeURIComponent(`${courierName} tracking ${t}`)}`;
}

function OrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("id") || searchParams.get("orderId") || "";

  const [searchQuery, setSearchQuery] = useState(initialOrderId);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tabFilter, setTabFilter] = useState<"all" | "active" | "delivered" | "cancelled">("all");
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleBuyAgain = async (orderId: string) => {
    setReorderingId(orderId);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/reorder`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.items || data.items.length === 0) {
        showNotice(data.error || "Could not reorder items. Please try again.");
        return;
      }

      data.items.forEach((it: {
        productId: string;
        name: string;
        size?: string;
        price: number;
        mrp?: number;
        quantity: number;
        image?: string;
        category?: string;
      }) => {
        addToCart(
          {
            productId: it.productId,
            name: it.name,
            size: it.size,
            price: it.price,
            mrp: it.mrp,
            image: it.image,
            category: it.category,
          },
          it.quantity || 1
        );
      });

      showNotice(`Added ${data.items.length} items to your cart!`);
      setTimeout(() => {
        router.push("/cart");
      }, 500);
    } catch {
      showNotice("Failed to reorder. Please check your connection.");
    } finally {
      setReorderingId(null);
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      showNotice("Generating GST invoice...");
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/invoice`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.invoice) {
        showNotice(data.error || "Invoice not available yet.");
        return;
      }
      const inv = data.invoice;
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        showNotice("Popup blocked. Please allow popups to view the invoice.");
        return;
      }
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tax Invoice - ${inv.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 32px; color: #1F1A17; max-width: 800px; margin: auto; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #7A5A3C; padding-bottom: 16px; margin-bottom: 24px; }
              .h1 { font-size: 24px; font-weight: bold; color: #7A5A3C; margin: 0; }
              .biz-info, .cust-info { font-size: 13px; line-height: 1.5; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
              table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; }
              th { background: #FAF7F2; border: 1px solid #E9DCC6; padding: 10px; text-align: left; }
              td { border: 1px solid #E9DCC6; padding: 10px; }
              .right { text-align: right; }
              .total-box { margin-left: auto; width: 280px; font-size: 13px; }
              .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
              .grand { font-size: 16px; font-weight: bold; border-top: 2px solid #7A5A3C; padding-top: 8px; margin-top: 8px; }
              .footer { margin-top: 40px; border-top: 1px solid #E9DCC6; padding-top: 16px; font-size: 11px; text-align: center; color: #666; }
              @media print { body { padding: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="no-print" style="margin-bottom: 16px; text-align: right;">
              <button onclick="window.print()" style="background:#7A5A3C;color:#fff;border:none;padding:8px 16px;font-weight:bold;cursor:pointer;border-radius:6px;">Print Invoice</button>
            </div>
            <div class="header">
              <div>
                <h1 class="h1">Imaan&apos;s Store</h1>
                <p style="margin:4px 0 0;font-size:12px;color:#666;">Artisanal Coffee, Spices & Premium Essentials</p>
                <p style="margin:2px 0 0;font-size:11px;color:#888;">GSTIN: ${inv.businessDetails?.gstin || "N/A"}</p>
              </div>
              <div class="right">
                <h2 style="margin:0;font-size:18px;color:#7A5A3C;">TAX INVOICE</h2>
                <p style="margin:4px 0 0;font-size:12px;"><b>Invoice No:</b> ${inv.invoiceNumber}</p>
                <p style="margin:2px 0 0;font-size:12px;"><b>Date:</b> ${new Date(inv.invoiceDate || inv.orderDate).toLocaleDateString("en-IN")}</p>
                <p style="margin:2px 0 0;font-size:12px;"><b>Order ID:</b> ${inv.orderId}</p>
              </div>
            </div>

            <div class="grid">
              <div class="biz-info">
                <p style="margin:0 0 4px;font-weight:bold;text-transform:uppercase;font-size:11px;color:#7A5A3C;">Sold By</p>
                <p style="margin:0;"><b>${inv.businessDetails?.companyName || "Imaan's Store"}</b></p>
                <p style="margin:0;">${inv.businessDetails?.addressLine1 || ""}</p>
                <p style="margin:0;">${inv.businessDetails?.city || ""}, ${inv.businessDetails?.state || ""} - ${inv.businessDetails?.pincode || ""}</p>
                <p style="margin:0;">Email: ${inv.businessDetails?.email || "support@imaans.com"}</p>
              </div>
              <div class="cust-info">
                <p style="margin:0 0 4px;font-weight:bold;text-transform:uppercase;font-size:11px;color:#7A5A3C;">Billed To / Delivered To</p>
                <p style="margin:0;"><b>${inv.customerDetails?.name || "Customer"}</b></p>
                <p style="margin:0;">${inv.customerDetails?.address || ""}</p>
                <p style="margin:0;">${inv.customerDetails?.city || ""}, ${inv.customerDetails?.state || ""} - ${inv.customerDetails?.pincode || ""}</p>
                <p style="margin:0;">Phone: ${inv.customerDetails?.phone || ""}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Description</th>
                  <th>Variant / Size</th>
                  <th class="right">Qty</th>
                  <th class="right">Unit Price</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(inv.items || [])
                  .map(
                    (it: { name: string; size?: string; quantity: number; price: number }, idx: number) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><b>${it.name}</b></td>
                    <td>${it.size || "Standard"}</td>
                    <td class="right">${it.quantity}</td>
                    <td class="right">₹${Number(it.price).toFixed(2)}</td>
                    <td class="right">₹${(Number(it.price) * Number(it.quantity)).toFixed(2)}</td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="total-box">
              <div class="total-row"><span>Items Subtotal:</span><span>₹${Number(inv.pricing?.subtotal || 0).toFixed(2)}</span></div>
              ${inv.pricing?.discount ? `<div class="total-row" style="color:#1B5E3A;"><span>Discount:</span><span>-₹${Number(inv.pricing.discount).toFixed(2)}</span></div>` : ""}
              <div class="total-row"><span>Shipping Charges:</span><span>${inv.pricing?.shipping === 0 ? "FREE" : `₹${Number(inv.pricing?.shipping || 0).toFixed(2)}`}</span></div>
              <div class="total-row"><span>GST Included (${inv.pricing?.gstRate || "5%"}):</span><span>₹${(Number(inv.pricing?.cgst || 0) + Number(inv.pricing?.sgst || 0) + Number(inv.pricing?.igst || 0)).toFixed(2)}</span></div>
              <div class="total-row grand"><span>Grand Total:</span><span style="color:#7A5A3C;">₹${Number(inv.pricing?.grandTotal || 0).toFixed(2)}</span></div>
            </div>

            <div class="footer">
              <p>This is a computer-generated tax invoice. No signature is required.</p>
              <p>Thank you for choosing Imaan's Store — Crafting artisanal quality for every lifestyle.</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch {
      showNotice("Could not generate invoice. Please try again.");
    }
  };

  // Sync logged in customer
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const cached =
          window.sessionStorage.getItem("ibrew_auth_user") ||
          window.localStorage.getItem("ibrew_auth_user");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.email) setUser(parsed);
        }
      } catch {
        // ignore
      }
    });

    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  // Load customer orders from server
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders/my-orders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.orders) ? data.orders : [];
        setOrders(list);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadOrders();
    });
  }, [loadOrders]);

  // Handle direct Order ID lookup
  const handleSearchOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      loadOrders();
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) => {
          const exists = prev.some((o) => o.orderId === data.order.orderId);
          return exists ? prev : [data.order, ...prev];
        });
        showNotice(`Found order ${data.order.orderId}!`);
      } else {
        showNotice(data.error || "No order found with this Order ID.");
      }
    } catch {
      showNotice("Could not reach the server. Please check your connection.");
    } finally {
      setSearching(false);
    }
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (tabFilter === "all") return true;
      if (tabFilter === "active") return ["pending", "confirmed", "packed", "shipped"].includes(order.status);
      if (tabFilter === "delivered") return order.status === "delivered";
      if (tabFilter === "cancelled") return order.status === "cancelled";
      return true;
    });
  }, [orders, tabFilter]);

  const copyAwb = (awb: string) => {
    navigator.clipboard?.writeText(awb);
    showNotice(`Copied Tracking Number: ${awb}`);
  };

  return (
    <div className={`${ubuntu.className} min-h-screen bg-[#FDFBF7] text-[#1F1A17]`}>
      {/* Toast Notification */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#7A5A3C] bg-[#1F1A17] px-4 py-3 text-xs font-semibold text-white shadow-2xl">
          <CheckCircle2 className="h-4 w-4 text-[#A7F3D0]" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="relative overflow-hidden bg-black text-white">
        <img
          src={BANNER}
          alt="Orders"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="mb-3 text-[11px] uppercase tracking-[0.25em] text-[#E9DCC6]">
            <Link href="/" className="hover:text-white">
              Home
            </Link>{" "}
            / <span className="text-white">My Orders</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            My Orders &amp; Dispatch Tracking
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">
            Check real-time order confirmation status, packaging updates, courier partner details,
            and live dispatch tracking.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Quick Order Lookup Bar */}
        <div
          className="mb-8 rounded-2xl border bg-white p-4 shadow-xs sm:p-6"
          style={{ borderColor: LINE }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1F1A17] sm:text-base">
                Track by Order Reference
              </h2>
              <p className="text-xs" style={{ color: MUTED }}>
                Enter your order ID (e.g. <code>IBREW-20261102-123456</code>) to verify confirmation &amp; courier dispatch status.
              </p>
            </div>
            <form onSubmit={handleSearchOrder} className="flex w-full items-center gap-2 md:w-auto">
              <div
                className="flex flex-1 items-center gap-2 rounded-xl border bg-[#FAF7F2] px-3.5 py-2.5 sm:w-80"
                style={{ borderColor: LINE }}
              >
                <Search size={16} className="text-[#7A5A3C] shrink-0" />
                <input
                  type="text"
                  placeholder="Enter Order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold outline-none placeholder:text-[#1F1A17]/40"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#7A5A3C] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1F1A17] disabled:opacity-60"
              >
                {searching ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Truck size={14} />
                    <span>Track</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Guest Banner if not signed in */}
        {!user && orders.length === 0 && !loading && (
          <div
            className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border bg-[#FAF3E8] p-6 sm:flex-row"
            style={{ borderColor: "#E9DCC6" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7A5A3C] text-white">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1F1A17]">Have an account with Imaan&apos;s?</h3>
                <p className="text-xs text-[#1F1A17]/70">
                  Log in to see all your past purchases, order confirmations, and saved addresses in one place.
                </p>
              </div>
            </div>
            <Link
              href="/login?next=/orders"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#7A5A3C] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1F1A17]"
            >
              <span>Login to Account</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Tab Filters */}
        {orders.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: `All Orders (${orders.length})` },
                {
                  id: "active",
                  label: `Active (${orders.filter((o) => ["pending", "confirmed", "packed", "shipped"].includes(o.status)).length})`,
                },
                {
                  id: "delivered",
                  label: `Delivered (${orders.filter((o) => o.status === "delivered").length})`,
                },
                {
                  id: "cancelled",
                  label: `Cancelled (${orders.filter((o) => o.status === "cancelled").length})`,
                },
              ].map((tab) => {
                const active = tabFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTabFilter(tab.id as typeof tabFilter)}
                    className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                      active
                        ? "bg-[#1F1A17] text-white"
                        : "border border-neutral-200 bg-white text-[#1F1A17] hover:border-[#7A5A3C]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <p className="text-xs" style={{ color: MUTED }}>
              Showing <strong>{filteredOrders.length}</strong> {filteredOrders.length === 1 ? "order" : "orders"}
            </p>
          </div>
        )}

        {/* Orders Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 size={32} className="animate-spin text-[#7A5A3C]" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-[#7A5A3C]">
              Loading your orders...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div
            className="rounded-2xl border bg-white p-12 text-center"
            style={{ borderColor: LINE }}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF3E8] text-[#7A5A3C]">
              <Package size={32} />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1F1A17]">No Orders Found</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed" style={{ color: MUTED }}>
              You haven&apos;t placed any orders yet, or your orders are associated with a different email address.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-[#7A5A3C] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1F1A17]"
              >
                <span>Browse Products</span>
                <ArrowRight size={14} />
              </Link>
              {!user && (
                <Link
                  href="/login?next=/orders"
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#1F1A17] transition-colors hover:bg-neutral-100"
                >
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Orders List */}
        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const isConfirmed = Boolean(order.confirmedAt) || ["confirmed", "packed", "shipped", "delivered"].includes(order.status);
              const isDispatched = order.status === "shipped" || order.status === "delivered" || Boolean(order.trackingNumber);
              const courierUrl = getCourierTrackingUrl(order.courierName || "", order.trackingNumber || "");

              // Status Badge Metadata
              const getBadge = () => {
                switch (order.status) {
                  case "confirmed":
                    return {
                      label: "Order Confirmed",
                      bg: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
                      icon: <CheckCircle2 size={13} />,
                    };
                  case "packed":
                    return {
                      label: "Packed & Ready",
                      bg: "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]",
                      icon: <Package size={13} />,
                    };
                  case "shipped":
                    return {
                      label: "Dispatched · In Transit",
                      bg: "bg-[#F5F3FF] text-[#5B21B6] border-[#DDD6FE]",
                      icon: <Truck size={13} />,
                    };
                  case "delivered":
                    return {
                      label: "Delivered",
                      bg: "bg-[#ECFDF5] text-[#047857] border-[#6EE7B7]",
                      icon: <CheckCircle2 size={13} />,
                    };
                  case "cancelled":
                    return {
                      label: "Cancelled",
                      bg: "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]",
                      icon: <XCircle size={13} />,
                    };
                  default:
                    return {
                      label: "Pending Confirmation",
                      bg: "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]",
                      icon: <Clock size={13} />,
                    };
                }
              };
              const badge = getBadge();

              // Stepper stages
              const stages = [
                { id: "placed", label: "Placed", date: order.createdAt, done: true },
                {
                  id: "confirmed",
                  label: "Confirmed",
                  date: order.confirmedAt,
                  done: isConfirmed,
                },
                {
                  id: "packed",
                  label: "Packed",
                  date: null,
                  done: ["packed", "shipped", "delivered"].includes(order.status),
                },
                {
                  id: "shipped",
                  label: "Dispatched",
                  date: order.shippedAt,
                  done: ["shipped", "delivered"].includes(order.status),
                },
                {
                  id: "delivered",
                  label: "Delivered",
                  date: order.deliveredAt,
                  done: order.status === "delivered",
                },
              ];

              return (
                <div
                  key={order.orderId}
                  className="overflow-hidden rounded-2xl border bg-white shadow-xs transition-shadow hover:shadow-md"
                  style={{ borderColor: LINE }}
                >
                  {/* Card Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-[#FAF7F2] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5A3C]">
                          Order Reference
                        </span>
                        <h3 className="text-sm font-extrabold text-[#1F1A17] sm:text-base">
                          {order.orderId}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${badge.bg}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1F1A17]/60">
                          Total Amount
                        </span>
                        <p className="text-sm font-bold text-[#7A5A3C] sm:text-base">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Stepper / Progress Bar */}
                  <div className="px-4 py-5 sm:px-6">
                    <div className="grid grid-cols-5 gap-1 sm:gap-2">
                      {stages.map((stage, idx) => {
                        const isCurrent =
                          (order.status === "pending" && stage.id === "placed") ||
                          (order.status === "confirmed" && stage.id === "confirmed") ||
                          (order.status === "packed" && stage.id === "packed") ||
                          (order.status === "shipped" && stage.id === "shipped") ||
                          (order.status === "delivered" && stage.id === "delivered");

                        return (
                          <div key={stage.id} className="flex flex-col items-center text-center">
                            <div className="relative mb-2 flex w-full items-center justify-center">
                              {/* Horizontal connector line */}
                              {idx > 0 && (
                                <div
                                  className={`absolute left-0 right-1/2 top-1/2 h-1 -translate-y-1/2 ${
                                    stage.done ? "bg-[#1B5E3A]" : "bg-neutral-200"
                                  }`}
                                />
                              )}
                              {idx < stages.length - 1 && (
                                <div
                                  className={`absolute left-1/2 right-0 top-1/2 h-1 -translate-y-1/2 ${
                                    stages[idx + 1].done ? "bg-[#1B5E3A]" : "bg-neutral-200"
                                  }`}
                                />
                              )}
                              {/* Milestone Circle */}
                              <div
                                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all sm:h-8 sm:w-8 ${
                                  stage.done
                                    ? "bg-[#1B5E3A] text-white shadow-xs"
                                    : "border-2 border-neutral-300 bg-white text-neutral-400"
                                } ${isCurrent ? "ring-4 ring-[#1B5E3A]/20" : ""}`}
                              >
                                {stage.done ? "✓" : idx + 1}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold tracking-tight sm:text-xs ${
                                stage.done ? "text-[#1F1A17]" : "text-neutral-400"
                              }`}
                            >
                              {stage.label}
                            </span>
                            {stage.date && (
                              <span className="hidden text-[9px] text-neutral-500 sm:block">
                                {new Date(stage.date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dispatch & Courier Tracking Banner */}
                  <div className="mx-4 mb-4 rounded-xl border bg-[#F8FAFC] p-4 sm:mx-6 sm:p-5" style={{ borderColor: "#CBD5E1" }}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5B21B6] text-white">
                          <Truck size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B21B6]">
                              Courier &amp; Dispatch Tracking
                            </span>
                            {order.courierName && (
                              <span className="rounded bg-[#5B21B6]/10 px-2 py-0.5 text-[11px] font-extrabold text-[#5B21B6]">
                                {order.courierName}
                              </span>
                            )}
                          </div>

                          {order.trackingNumber ? (
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-[#1F1A17]">
                                AWB / Tracking: <strong>{order.trackingNumber}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => copyAwb(order.trackingNumber || "")}
                                className="inline-flex cursor-pointer items-center gap-1 rounded border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17] transition hover:bg-neutral-100"
                                title="Copy tracking number"
                              >
                                <Copy size={11} />
                                <span>Copy</span>
                              </button>
                            </div>
                          ) : isConfirmed ? (
                            <p className="mt-1 text-xs text-neutral-600">
                              Order is confirmed! Courier consignment details and live tracking will appear here as soon as the package is dispatched.
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-neutral-600">
                              Order placed. Once our warehouse confirms and packs your order, dispatch details will be posted here.
                            </p>
                          )}

                          {order.shippedAt && (
                            <p className="mt-1 text-[11px] text-neutral-500">
                              Dispatched on <strong>{formatDate(order.shippedAt)}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action to open Courier Portal */}
                      {order.trackingNumber && courierUrl && (
                        <a
                          href={courierUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5B21B6] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[#4C1D95]"
                        >
                          <span>Track on {order.courierName || "Courier"}</span>
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                    <div className="border-t border-neutral-200 bg-[#FAF7F2]/40 p-4 sm:p-6">
                      <div className="grid gap-6 md:grid-cols-12">
                        {/* Ordered Items (7 cols) */}
                        <div className="space-y-3 md:col-span-7">
                          <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A5A3C]">
                            Items in this Order ({order.items.reduce((s, i) => s + (i.quantity || 1), 0)})
                          </h4>
                          <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
                            {order.items.map((item, idx) => (
                              <div
                                key={item.productId + idx}
                                className="flex items-center justify-between gap-3 p-3 sm:p-3.5"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="absolute inset-0 h-full w-full object-cover object-center"
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-neutral-400">
                                        <Package size={20} />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-[#1F1A17] sm:text-sm">
                                      {item.name}
                                    </p>
                                    <p className="text-[11px] text-neutral-500">
                                      {item.size ? `Size: ${item.size} · ` : ""}
                                      Qty: <strong>{item.quantity}</strong> × {formatPrice(item.price)}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-xs font-bold text-[#1F1A17] sm:text-sm">
                                  {formatPrice(item.price * item.quantity)}
                                </p>
                              </div>
                            ))}

                            {/* Price Breakdown */}
                            <div className="space-y-1.5 bg-[#FAF7F2] p-3 text-xs">
                              <div className="flex justify-between text-neutral-600">
                                <span>Subtotal</span>
                                <span className="font-semibold text-neutral-800">
                                  {formatPrice(order.subtotal)}
                                </span>
                              </div>
                              {order.savings > 0 && (
                                <div className="flex justify-between text-[#1B5E3A]">
                                  <span>Discount Saved</span>
                                  <span className="font-semibold">−{formatPrice(order.savings)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-neutral-600">
                                <span>Delivery Fee</span>
                                <span className="font-semibold text-neutral-800">
                                  {order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-neutral-200 pt-1.5 text-sm font-bold text-[#1F1A17]">
                                <span>Total Paid / Payable</span>
                                <span className="text-[#7A5A3C]">{formatPrice(order.total)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Shipping & Payment Details (5 cols) */}
                        <div className="space-y-4 md:col-span-5">
                          {/* Shipping Address */}
                          <div className="rounded-xl border border-neutral-200 bg-white p-4">
                            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A5A3C]">
                              Delivery Address
                            </h4>
                            <div className="mt-2 text-xs leading-relaxed text-[#1F1A17]">
                              <p className="font-bold">{order.customer.name}</p>
                              <p className="text-neutral-600">{order.customer.address}</p>
                              <p className="text-neutral-600">
                                {order.customer.city}, {order.customer.state} -{" "}
                                <strong>{order.customer.pincode}</strong>
                              </p>
                              <p className="mt-1.5 text-neutral-600">
                                Phone: <strong>{order.customer.phone}</strong>
                              </p>
                              {order.customer.email && (
                                <p className="text-neutral-600">Email: {order.customer.email}</p>
                              )}
                            </div>
                          </div>

                          {/* Payment & Support Info */}
                          <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2.5">
                            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A5A3C]">
                              Payment Details
                            </h4>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-600">Payment Mode:</span>
                              <span className="font-bold uppercase text-[#1F1A17]">
                                {order.paymentMethod}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-600">Payment Status:</span>
                              <span
                                className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                                  order.paymentStatus === "paid"
                                    ? "bg-[#ECFDF5] text-[#065F46]"
                                    : "bg-[#FFFBEB] text-[#92400E]"
                                }`}
                              >
                                {order.paymentStatus}
                              </span>
                            </div>

                            <div className="border-t border-neutral-100 pt-3 flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => handleBuyAgain(order.orderId)}
                                disabled={reorderingId === order.orderId}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#7A5A3C] py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#1F1A17] disabled:opacity-60"
                              >
                                {reorderingId === order.orderId ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Adding to Cart...</span>
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw size={14} />
                                    <span>Buy Again</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownloadInvoice(order.orderId)}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#FAF7F2] border border-[#E9DCC6] py-2 text-xs font-bold text-[#1F1A17] transition hover:bg-[#E9DCC6]"
                              >
                                <FileText size={14} className="text-[#7A5A3C]" />
                                <span>Download Tax Invoice</span>
                              </button>

                              <a
                                href={`https://wa.me/919876543210?text=${encodeURIComponent(
                                  `Hi Imaan's Store, I have a question regarding my order ${order.orderId}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#7A5A3C] bg-white py-2 text-xs font-bold text-[#7A5A3C] transition hover:bg-[#FAF3E8]"
                              >
                                <MessageCircle size={14} />
                                <span>Support via WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CustomerOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#7A5A3C]" />
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  );
}
