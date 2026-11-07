"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Ubuntu } from "next/font/google";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  Lock,
  LogIn,
  MapPin,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react";
import { useCart, type CartItem } from "../../lib/cartStore";
import { prependLocalOrder, type StoreOrder } from "../../lib/orderStore";
import {
  broadcastCatalogChange,
  readLocalCatalog,
  writeLocalCatalog,
} from "../../lib/productStore";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const DARK = "#1F1A17";
const BROWN = "#7A5A3C";
const CREAM = "#FAF7F2";
const SAND = "#E9DCC6";

const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 60;

const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

export default function CartCheckoutPage() {
  const router = useRouter();
  const {
    items: cartItems,
    hydrated,
    totalItems,
    subtotal,
    totalSavings,
    updateQty,
    removeItem,
    clear,
  } = useCart();

  // Auth State (Checkout requires login)
  const [authUser, setAuthUser] = useState<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Checkout Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("Karnataka");
  const [pincode, setPincode] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi" | "card">("cod");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Saved Addresses State
  interface SavedAddress {
    id: number;
    label: string;
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
  }
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");

  // Pincode Delivery Estimator
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeEstimate, setPincodeEstimate] = useState<{
    serviceable: boolean;
    estimatedDeliveryDate?: string;
    city?: string;
    state?: string;
  } | null>(null);

  // Promo Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    description?: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const applyCouponCode = async (codeToApply?: string) => {
    const code = (codeToApply ?? couponInput).trim();
    if (!code) {
      setCouponMsg({ type: "error", text: "Please enter a coupon code." });
      return;
    }
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          subtotal,
          email: email.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.valid) {
        setCouponMsg({ type: "error", text: data.error || "Invalid coupon code." });
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: data.coupon.code,
          discountAmount: Number(data.coupon.discountAmount || 0),
          description: data.coupon.description,
        });
        setCouponMsg({
          type: "success",
          text: data.message || `Coupon "${data.coupon.code}" applied!`,
        });
        setCouponInput("");
      }
    } catch {
      setCouponMsg({ type: "error", text: "Could not validate coupon. Check connection." });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponMsg(null);
  };

  const syncAuth = useCallback(() => {
    try {
      const cached =
        window.sessionStorage.getItem("ibrew_auth_user") ||
        window.localStorage.getItem("ibrew_auth_user");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.email) {
          setAuthUser(parsed);
          setFullName((prev) => prev || parsed.name || "");
          setEmail((prev) => prev || parsed.email || "");
          setPhone((prev) => prev || parsed.phone || "");
        }
      } else {
        setAuthUser(null);
      }
    } catch {
      // ignore
    }

    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setAuthUser(data.user);
          setFullName((prev) => prev || data.user.name || "");
          setEmail((prev) => prev || data.user.email || "");
          setPhone((prev) => prev || data.user.phone || "");

          // Fetch saved customer addresses
          fetch("/api/user/addresses")
            .then((res) => (res.ok ? res.json() : null))
            .then((addrData) => {
              if (addrData && Array.isArray(addrData.addresses) && addrData.addresses.length > 0) {
                setSavedAddresses(addrData.addresses);
                const defaultAddr =
                  addrData.addresses.find((a: SavedAddress) => a.isDefault) || addrData.addresses[0];
                if (defaultAddr) {
                  setFullName((prev) => prev || defaultAddr.fullName);
                  setPhone((prev) => prev || defaultAddr.phone);
                  setAddress((prev) => prev || defaultAddr.addressLine);
                  setCity((prev) => prev || defaultAddr.city);
                  setStateName((prev) => prev || defaultAddr.state || "Karnataka");
                  setPincode((prev) => prev || defaultAddr.pincode);
                }
              }
            })
            .catch(() => {});
        } else {
          setAuthUser(null);
        }
        setAuthChecked(true);
      })
      .catch(() => {
        setAuthChecked(true);
      });
  }, []);

  const selectAddress = (addr: SavedAddress) => {
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setAddress(addr.addressLine);
    setCity(addr.city);
    setStateName(addr.state || "Karnataka");
    setPincode(addr.pincode);
  };

  // Check PIN code serviceability
  useEffect(() => {
    const cleanPin = pincode.trim().replace(/\D/g, "");
    if (cleanPin.length === 6) {
      setPincodeLoading(true);
      fetch(`/api/shipping/estimate?pincode=${cleanPin}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.serviceable) {
            setPincodeEstimate({
              serviceable: true,
              estimatedDeliveryDate: d.estimatedDeliveryDate,
              city: d.city,
              state: d.state,
            });
            if (d.city && !city) setCity(d.city);
            if (d.state && (!stateName || stateName === "Karnataka")) setStateName(d.state);
          } else {
            setPincodeEstimate({ serviceable: false });
          }
        })
        .catch(() => setPincodeEstimate(null))
        .finally(() => setPincodeLoading(false));
    } else {
      setPincodeEstimate(null);
    }
  }, [pincode]);

  useEffect(() => {
    queueMicrotask(() => syncAuth());
    window.addEventListener("ibrew-auth-changed", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("ibrew-auth-changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, [syncAuth]);

  // Order Confirmation State
  const [placedOrder, setPlacedOrder] = useState<{
    orderId: string;
    items: CartItem[];
    subtotal: number;
    shipping: number;
    total: number;
    savings: number;
    customerName: string;
    phone: string;
    address: string;
    paymentMethod: string;
  } | null>(null);

  const shippingFee =
    subtotal === 0
      ? 0
      : subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_FEE;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount + shippingFee);
  const amountForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!authUser) {
      router.push("/login?next=/cart");
      return;
    }

    if (cartItems.length === 0) {
      setFormError("Your cart is empty. Please add products before checking out.");
      return;
    }

    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      setFormError("Please fill in your name, phone number, delivery address, city, and PIN code.");
      return;
    }

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const orderId = `IBREW-${datePart}-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderPayload: StoreOrder = {
      id: orderId,
      orderId,
      customer: {
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateName.trim() || "Karnataka",
        pincode: pincode.trim(),
        notes: orderNotes.trim(),
      },
      items: cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        size: item.size || "",
        price: item.price,
        mrp: item.mrp,
        quantity: item.quantity,
        image: item.image || "",
        category: item.category || "",
      })),
      subtotal,
      shipping: shippingFee,
      savings: totalSavings + couponDiscount,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
      total: grandTotal,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "unpaid" : "paid",
      status: "pending",
      trackingNumber: "",
      courierName: "",
      adminNotes: "",
      createdAt: new Date().toISOString(),
      confirmedAt: null,
      shippedAt: null,
      deliveredAt: null,
    };

    setIsSubmitting(true);

    try {
      // If saving address
      if (saveThisAddress && authUser) {
        fetch("/api/user/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: addressLabel,
            fullName: fullName.trim(),
            phone: phone.trim(),
            addressLine: address.trim(),
            city: city.trim(),
            state: stateName.trim() || "Karnataka",
            pincode: pincode.trim(),
            isDefault: savedAddresses.length === 0,
          }),
        }).catch(() => {});
      }

      // If Razorpay payment (UPI or Card)
      let razorpayPaymentId = "";
      if (paymentMethod === "upi" || paymentMethod === "card") {
        try {
          const rzpRes = await fetch("/api/orders/razorpay/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: grandTotal,
              receipt: `rcpt_${datePart}`,
            }),
          });
          const rzpData = await rzpRes.json();
          if (rzpRes.ok && rzpData.orderId) {
            orderPayload.razorpayOrderId = rzpData.orderId;
            if (rzpData.isDemo) {
              // Simulated instant verified checkout for test keys
              orderPayload.razorpayPaymentId = `pay_demo_${Date.now()}`;
              orderPayload.paymentStatus = "paid";
            } else if (typeof window !== "undefined" && (window as unknown as { Razorpay: unknown }).Razorpay) {
              const RazorpayConstructor = (window as unknown as {
                Razorpay: new (opts: Record<string, unknown>) => { open: () => void };
              }).Razorpay;
              const paymentSuccess = await new Promise<{ paymentId: string; signature: string } | null>((resolve) => {
                const rzp = new RazorpayConstructor({
                  key: rzpData.key,
                  amount: rzpData.amount,
                  currency: "INR",
                  name: "Imaan's Store",
                  description: `Order #${orderId}`,
                  order_id: rzpData.orderId,
                  prefill: {
                    name: fullName.trim(),
                    email: email.trim(),
                    contact: phone.trim(),
                  },
                  theme: { color: "#7A5A3C" },
                  handler: (response: { razorpay_payment_id: string; razorpay_signature: string }) => {
                    resolve({
                      paymentId: response.razorpay_payment_id,
                      signature: response.razorpay_signature,
                    });
                  },
                  modal: {
                    ondismiss: () => resolve(null),
                  },
                });
                rzp.open();
              });

              if (!paymentSuccess) {
                setFormError("Payment cancelled. You can change payment method or retry.");
                setIsSubmitting(false);
                return;
              }

              orderPayload.razorpayPaymentId = paymentSuccess.paymentId;
              orderPayload.razorpaySignature = paymentSuccess.signature;
              orderPayload.paymentStatus = "paid";
            }
          }
        } catch {
          // Fall back gracefully to direct order submission
        }
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormError(data.error || "Could not place order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const savedOrder = data.order || orderPayload;
      prependLocalOrder(savedOrder);

      // 1. Immediately deduct stock counter in local catalog cache
      try {
        const localCatalog = readLocalCatalog();
        if (localCatalog.length > 0) {
          const updatedCatalog = localCatalog.map((product) => {
            let changed = false;
            const nextSizes = (product.sizes || []).map((s) => {
              const matched = cartItems.find((ci) => {
                const idMatches =
                  ci.productId === product.id ||
                  (product.slug && ci.productId === product.slug) ||
                  (product.name && ci.name && ci.name.toLowerCase().trim() === product.name.toLowerCase().trim());
                const sizeMatches =
                  !ci.size ||
                  !s.label ||
                  ci.size.toLowerCase().trim() === s.label.toLowerCase().trim() ||
                  ci.size.replace(/\s+/g, "").toLowerCase() === s.label.replace(/\s+/g, "").toLowerCase();
                return idMatches && sizeMatches;
              });
              if (matched) {
                changed = true;
                return {
                  ...s,
                  stock: Math.max(0, (Number(s.stock) || 0) - Number(matched.quantity || 1)),
                };
              }
              return s;
            });
            return changed ? { ...product, sizes: nextSizes } : product;
          });
          writeLocalCatalog(updatedCatalog);
        }
      } catch {
        // ignore
      }

      // 2. Broadcast change so every open window, tab, and storefront card re-fetches latest stock immediately
      broadcastCatalogChange();

      setPlacedOrder({
        orderId: savedOrder.orderId || orderId,
        items: [...cartItems],
        subtotal,
        shipping: shippingFee,
        total: grandTotal,
        savings: totalSavings,
        customerName: fullName.trim(),
        phone: phone.trim(),
        address: `${address.trim()}, ${city.trim()}, ${stateName.trim()} - ${pincode.trim()}`,
        paymentMethod:
          paymentMethod === "cod"
            ? "Cash on Delivery (COD)"
            : paymentMethod === "upi"
            ? "UPI / QR Payment"
            : "Credit / Debit Card",
      });

      clear();
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setFormError("Could not connect to database backend. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hydrated) {
    return (
      <div
        className={`${ubuntu.className} min-h-[70vh] flex items-center justify-center`}
        style={{ background: CREAM, color: DARK }}
      >
        <p className="text-sm opacity-70">Loading your cart…</p>
      </div>
    );
  }

  return (
    <div
      className={`${ubuntu.className} min-h-screen antialiased`}
      style={{ background: CREAM, color: DARK }}
    >
      {/* Top Banner / Breadcrumb */}
      <section
        className="border-b"
        style={{ borderColor: SAND, background: "#F5EDE0" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#7A5A3C]">
                <Link href="/" className="hover:underline">
                  Home
                </Link>
                <span>/</span>
                <span>Cart &amp; Checkout</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1F1A17] sm:text-3xl">
                {placedOrder ? "Order Confirmed" : "Your Shopping Cart & Checkout"}
              </h1>
              <p className="mt-1 text-sm text-[#1F1A17]/70">
                {placedOrder
                  ? `Thank you for shopping with Imaan's Store!`
                  : totalItems > 0
                  ? `You have ${totalItems} ${totalItems === 1 ? "item" : "items"} ready for checkout.`
                  : "Review your selected items and complete your order below."}
              </p>
            </div>

            <Link
              href="/coffee"
              className="inline-flex items-center gap-2 rounded-full border border-[#7A5A3C] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* ORDER PLACED CONFIRMATION */}
        {placedOrder ? (
          <div
            className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm sm:p-10"
            style={{ borderColor: SAND }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2E5A36]/10 text-[#2E5A36]">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <span className="mt-4 rounded-full bg-[#FAF3E8] px-3.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#7A5A3C]">
                Order #{placedOrder.orderId}
              </span>
              <h2 className="mt-3 text-2xl font-bold text-[#1F1A17] sm:text-3xl">
                Thank you, {placedOrder.customerName}!
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#1F1A17]/70">
                Your order has been received and is being freshly packed at our Coorg estate warehouse.
                We will send dispatch updates to <span className="font-semibold text-[#1F1A17]">{placedOrder.phone}</span>.
              </p>
            </div>

            {/* Delivery & Payment Info */}
            <div
              className="mt-8 grid grid-cols-1 gap-4 rounded-xl border p-5 sm:grid-cols-2"
              style={{ borderColor: SAND, background: CREAM }}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A5A3C]">
                  Delivery Address
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[#1F1A17]">
                  {placedOrder.customerName}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#1F1A17]/75">
                  {placedOrder.address}
                </p>
                <p className="mt-1 text-xs text-[#1F1A17]/75">Phone: {placedOrder.phone}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A5A3C]">
                  Payment &amp; Summary
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[#1F1A17]">
                  {placedOrder.paymentMethod}
                </p>
                <p className="mt-1 text-xs text-[#1F1A17]/75">
                  Total Paid / Payable:{" "}
                  <span className="font-bold text-[#1F1A17]">{formatPrice(placedOrder.total)}</span>
                </p>
                {placedOrder.savings > 0 && (
                  <p className="mt-1 text-xs font-medium text-[#2E5A36]">
                    Total Saved: {formatPrice(placedOrder.savings)}
                  </p>
                )}
              </div>
            </div>

            {/* Ordered Items */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A5A3C]">
                Items Ordered ({placedOrder.items.reduce((s, i) => s + i.quantity, 0)})
              </h3>
              <div className="mt-3 divide-y rounded-xl border" style={{ borderColor: SAND }}>
                {placedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-[#FAF7F2]">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="absolute inset-0 h-full w-full object-cover object-center" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-5 w-5 text-[#7A5A3C]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1F1A17]">{item.name}</p>
                        <p className="text-xs text-[#1F1A17]/65">
                          {item.size ? `Size: ${item.size} · ` : ""}Qty: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[#1F1A17]">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={`/orders?id=${encodeURIComponent(placedOrder.orderId)}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1B5E3A] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#14472C]"
              >
                <Truck className="h-4 w-4" />
                <span>Track &amp; View Order Status</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-[#7A5A3C] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#1F1A17]"
              >
                Back to Home
              </Link>
              <Link
                href="/coffee"
                className="inline-flex items-center justify-center rounded-full border border-[#7A5A3C] bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
              >
                Explore More Products
              </Link>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          /* EMPTY CART STATE */
          <div
            className="mx-auto max-w-2xl rounded-2xl border bg-white p-8 text-center shadow-sm sm:p-12"
            style={{ borderColor: SAND }}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FAF3E8] text-[#7A5A3C]">
              <ShoppingBag className="h-9 w-9" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-[#1F1A17]">Your cart is currently empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#1F1A17]/70">
              Explore our freshly roasted Coorg coffees, artisanal spices, Arabian dates, and skincare essentials, and click{" "}
              <span className="font-semibold text-[#7A5A3C]">&ldquo;Add&rdquo;</span> on any product to see it here!
            </p>

            {/* Quick Category Links */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
              {[
                { label: "Shop Coffee", href: "/coffee" },
                { label: "Shop Spices", href: "/spices" },
                { label: "Shop Dates", href: "/dates" },
                { label: "Coffee Skincare", href: "/coffee-skin" },
                { label: "Fragrances", href: "/fragrances" },
                { label: "Groceries", href: "/groceries" },
                { label: "Imported Bed", href: "/importedbed" },
              ].map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="rounded-full border border-[#7A5A3C] bg-white px-4 py-2 text-xs font-semibold text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          /* ACTIVE CART + CHECKOUT GRID */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* LEFT COLUMN: Cart Products List (7 cols) */}
            <div className="space-y-6 lg:col-span-7">
              {/* Free Shipping Progress Bar */}
              <div
                className="rounded-xl border bg-white p-4 shadow-xs"
                style={{ borderColor: SAND }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FAF3E8] text-[#7A5A3C]">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    {amountForFreeShipping > 0 ? (
                      <p className="text-xs sm:text-sm text-[#1F1A17]">
                        Add <span className="font-bold text-[#7A5A3C]">{formatPrice(amountForFreeShipping)}</span> more to unlock{" "}
                        <span className="font-bold text-[#2E5A36]">FREE Delivery</span>!
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm font-semibold text-[#2E5A36]">
                        Congratulations! Your order qualifies for FREE Standard Delivery.
                      </p>
                    )}
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F5EDE0]">
                      <div
                        className="h-full rounded-full bg-[#7A5A3C] transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cart Items Card */}
              <div
                className="overflow-hidden rounded-2xl border bg-white shadow-xs"
                style={{ borderColor: SAND }}
              >
                <div
                  className="flex items-center justify-between border-b px-5 py-4 sm:px-6"
                  style={{ borderColor: SAND, background: "#FAF7F2" }}
                >
                  <h2 className="text-base font-bold text-[#1F1A17]">
                    Cart Items ({totalItems})
                  </h2>
                  <button
                    type="button"
                    onClick={clear}
                    className="cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="divide-y" style={{ borderColor: SAND }}>
                  {cartItems.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#E9DCC6] bg-[#FAF7F2] sm:h-24 sm:w-24">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="absolute inset-0 h-full w-full object-cover object-center"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ShoppingBag className="h-7 w-7 text-[#7A5A3C]/50" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="min-w-0 flex-1">
                          {item.category && (
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A5A3C]">
                              {item.category}
                            </span>
                          )}
                          <h3 className="text-base font-semibold text-[#1F1A17]">
                            {item.name}
                          </h3>
                          {item.subtitle && (
                            <p className="mt-0.5 text-xs text-[#1F1A17]/65 line-clamp-1">
                              {item.subtitle}
                            </p>
                          )}

                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {item.size && (
                              <span className="inline-block rounded-md border border-[#E9DCC6] bg-[#FAF3E8] px-2.5 py-0.5 text-xs font-semibold text-[#7A5A3C]">
                                Size: {item.size}
                              </span>
                            )}
                            <span className="text-sm font-bold text-[#1F1A17]">
                              {formatPrice(item.price)}
                            </span>
                            {item.mrp && item.mrp > item.price && (
                              <>
                                <span className="text-xs text-[#1F1A17]/45 line-through">
                                  {formatPrice(item.mrp)}
                                </span>
                                <span className="rounded bg-[#2E5A36]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#2E5A36]">
                                  Save {formatPrice((item.mrp - item.price) * item.quantity)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls + Line Total */}
                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center rounded-lg border border-[#7A5A3C] bg-white">
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, -1)}
                              aria-label={`Decrease quantity of ${item.name}`}
                              className="cursor-pointer rounded-l-lg px-2.5 py-1.5 text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-8 text-center text-sm font-bold tabular-nums text-[#1F1A17]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, 1)}
                              aria-label={`Increase quantity of ${item.name}`}
                              className="cursor-pointer rounded-r-lg px-2.5 py-1.5 text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="cursor-pointer rounded-lg border border-neutral-200 p-2 text-neutral-500 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-base font-bold text-[#1F1A17]">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <p className="text-[11px] text-[#1F1A17]/55">
                            {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: Sparkles,
                    title: "Estate Fresh Quality",
                    desc: "Small-batch roasted & hygienically packed",
                  },
                  {
                    icon: ShieldCheck,
                    title: "100% Secure Checkout",
                    desc: "Safe payment options including COD & UPI",
                  },
                  {
                    icon: Truck,
                    title: "Fast Pan-India Dispatch",
                    desc: "Dispatched within 24–48 hours of order",
                  },
                ].map((badge, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border bg-white p-4"
                    style={{ borderColor: SAND }}
                  >
                    <badge.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#7A5A3C]" />
                    <div>
                      <p className="text-xs font-bold text-[#1F1A17]">{badge.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#1F1A17]/65">
                        {badge.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary & Checkout Form (5 cols) */}
            <div className="space-y-6 lg:col-span-5">
              {/* Order Summary Card */}
              <div
                className="rounded-2xl border bg-white p-6 shadow-xs"
                style={{ borderColor: SAND }}
              >
                <h2 className="text-base font-bold uppercase tracking-[0.12em] text-[#1F1A17]">
                  Order Summary
                </h2>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-[#1F1A17]/80">
                    <span>Items Subtotal ({totalItems} items)</span>
                    <span className="font-semibold text-[#1F1A17]">{formatPrice(subtotal)}</span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex items-center justify-between text-[#2E5A36]">
                      <span>Total MRP Discount</span>
                      <span className="font-semibold">−{formatPrice(totalSavings)}</span>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-[#2E5A36]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Sparkles size={13} />
                        Coupon ({appliedCoupon.code})
                      </span>
                      <span className="font-semibold">−{formatPrice(appliedCoupon.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[#1F1A17]/80">
                    <span>Delivery Charges</span>
                    {shippingFee === 0 ? (
                      <span className="font-semibold text-[#2E5A36]">FREE</span>
                    ) : (
                      <span className="font-semibold text-[#1F1A17]">{formatPrice(shippingFee)}</span>
                    )}
                  </div>

                  <div
                    className="border-t pt-3 flex items-baseline justify-between"
                    style={{ borderColor: SAND }}
                  >
                    <div>
                      <span className="text-base font-bold text-[#1F1A17]">Grand Total</span>
                      <p className="text-[11px] text-[#1F1A17]/55">Inclusive of all taxes</p>
                    </div>
                    <span className="text-2xl font-bold text-[#7A5A3C]">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Promo Coupon Card */}
                <div
                  className="mt-5 rounded-xl border p-4"
                  style={{ borderColor: SAND, background: "#FAF7F2" }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#7A5A3C]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F1A17]">
                      Have a Promo Coupon?
                    </span>
                  </div>

                  {appliedCoupon ? (
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] p-2.5">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#065F46]">
                          <CheckCircle2 size={14} />
                          <span>Code &ldquo;{appliedCoupon.code}&rdquo; Applied</span>
                        </div>
                        <p className="text-[11px] text-[#065F46]/80">
                          Saving {formatPrice(appliedCoupon.discountAmount)} on this order
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="cursor-pointer text-xs font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              applyCouponCode();
                            }
                          }}
                          placeholder="e.g. WELCOME10, FLAT100"
                          className="flex-1 rounded-lg border border-[#E9DCC6] bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#1F1A17] outline-none focus:border-[#7A5A3C]"
                        />
                        <button
                          type="button"
                          onClick={() => applyCouponCode()}
                          disabled={couponLoading || !couponInput.trim()}
                          className="cursor-pointer rounded-lg bg-[#7A5A3C] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#1F1A17] disabled:opacity-50"
                        >
                          {couponLoading ? "Checking..." : "Apply"}
                        </button>
                      </div>

                      {/* Coupon suggestions pill */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-neutral-500">Popular:</span>
                        {["WELCOME10", "FLAT100", "FREESHIP"].map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => applyCouponCode(code)}
                            className="cursor-pointer rounded border border-dashed border-[#7A5A3C] bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#7A5A3C] hover:bg-[#7A5A3C] hover:text-white"
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {couponMsg && (
                    <p
                      className={`mt-2 text-xs font-medium ${
                        couponMsg.type === "success" ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {couponMsg.text}
                    </p>
                  )}
                </div>

                {/* Shipping & Checkout Form (Requires Login) */}
                {!authUser ? (
                  <div
                    className="mt-6 rounded-xl border p-5 text-center"
                    style={{ borderColor: SAND, background: "#FAF7F2" }}
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#7A5A3C]/10 text-[#7A5A3C]">
                      <Lock className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 text-base font-bold text-[#1F1A17]">
                      Login Required to Checkout
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#1F1A17]/70">
                      Please log in to your account to enter your delivery address and place your order.
                    </p>
                    <Link
                      href="/login?next=/cart"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7A5A3C] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-sm transition-colors hover:bg-[#1F1A17]"
                    >
                      <LogIn className="h-4 w-4" />
                      Log in to Checkout · {formatPrice(grandTotal)}
                    </Link>
                    <p className="mt-3 text-xs text-[#1F1A17]/70">
                      Don&apos;t have an account?{" "}
                      <Link
                        href="/register?next=/cart"
                        className="font-bold text-[#7A5A3C] underline underline-offset-4 hover:text-[#1F1A17]"
                      >
                        Create an account
                      </Link>
                    </p>
                  </div>
                ) : (
                <form onSubmit={handlePlaceOrder} className="mt-6 space-y-4 border-t pt-6" style={{ borderColor: SAND }}>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#1F1A17]">
                      Delivery &amp; Payment Details
                    </h3>
                  </div>

                  {/* Saved Address Selector */}
                  {savedAddresses.length > 0 && (
                    <div className="rounded-xl border border-[#E9DCC6] bg-[#FAF7F2] p-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <Bookmark size={14} className="text-[#7A5A3C]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#7A5A3C]">
                          Use Saved Address
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => selectAddress(addr)}
                            className="cursor-pointer text-left rounded-lg border border-[#E9DCC6] bg-white p-2.5 transition hover:border-[#7A5A3C] hover:shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="rounded bg-[#FAF3E8] px-2 py-0.5 text-[10px] font-bold text-[#7A5A3C]">
                                {addr.label || "Home"}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[9px] font-semibold text-neutral-500">Default</span>
                              )}
                            </div>
                            <p className="mt-1 text-xs font-bold text-[#1F1A17] line-clamp-1">{addr.fullName}</p>
                            <p className="text-[11px] text-neutral-600 line-clamp-1">{addr.addressLine}, {addr.city}</p>
                            <p className="text-[10px] text-neutral-500">PIN: {addr.pincode}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {formError && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-700">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17]">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1 w-full rounded-lg border border-[#E9DCC6] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#1F1A17]">
                        Phone / WhatsApp <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="mt-1 w-full rounded-lg border border-[#E9DCC6] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1F1A17]">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="mt-1 w-full rounded-lg border border-[#E9DCC6] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17]">
                      Street Address / Flat / Landmark <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House/Flat No., Building, Street, Area"
                      className="mt-1 w-full rounded-lg border border-[#E9DCC6] bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1F1A17]">
                        City <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Bengaluru"
                        className="mt-1 w-full rounded-lg border border-[#E9DCC6] bg-[#FAF7F2] px-3 py-2 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1F1A17]">
                        State <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="Karnataka"
                        className="mt-1 w-full rounded-lg border border-[#E9DCC6] bg-[#FAF7F2] px-3 py-2 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1F1A17]">
                        PIN Code <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="560001"
                        className="mt-1 w-full rounded-lg border border-[#E9DCC6] bg-[#FAF7F2] px-3 py-2 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Delivery Serviceability & Date Estimate */}
                  {pincodeLoading && (
                    <p className="text-xs text-neutral-500">Checking delivery date for PIN {pincode}...</p>
                  )}
                  {pincodeEstimate && (
                    <div
                      className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${
                        pincodeEstimate.serviceable
                          ? "border border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]"
                          : "border border-amber-300 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {pincodeEstimate.serviceable ? (
                        <>
                          <Clock size={14} className="shrink-0 text-emerald-600" />
                          <span>
                            Delivery available! Estimated delivery by{" "}
                            <strong>
                              {new Date(pincodeEstimate.estimatedDeliveryDate || "").toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <MapPin size={14} className="shrink-0 text-amber-600" />
                          <span>Standard delivery (4–7 business days) via India Post / Surface courier</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Save address checkbox */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E9DCC6] bg-[#FAF7F2] p-2.5">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#1F1A17]">
                      <input
                        type="checkbox"
                        checked={saveThisAddress}
                        onChange={(e) => setSaveThisAddress(e.target.checked)}
                        className="accent-[#7A5A3C]"
                      />
                      <span>Save this address for fast 1-click checkout</span>
                    </label>
                    {saveThisAddress && (
                      <div className="flex items-center gap-1">
                        {(["Home", "Work", "Other"] as const).map((lbl) => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setAddressLabel(lbl)}
                            className={`cursor-pointer rounded px-2 py-0.5 text-[10px] font-bold ${
                              addressLabel === lbl
                                ? "bg-[#7A5A3C] text-white"
                                : "bg-white text-[#7A5A3C] border border-[#E9DCC6]"
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1F1A17]">
                      Order Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Grind preference, delivery instructions, etc."
                      className="mt-1 w-full rounded-lg border border-[#E9DCC6] bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1F1A17] outline-none focus:border-[#7A5A3C] focus:bg-white"
                    />
                  </div>

                  {/* Payment Method Selection */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-[#1F1A17]">
                      Select Payment Method
                    </label>
                    <div className="mt-2 space-y-2">
                      {[
                        {
                          id: "cod" as const,
                          title: "Cash on Delivery (COD)",
                          desc: "Pay in cash or UPI when your order arrives at your doorstep",
                        },
                        {
                          id: "upi" as const,
                          title: "UPI (GPay, PhonePe, Paytm)",
                          desc: "Instant zero-fee payment via UPI QR or ID",
                        },
                        {
                          id: "card" as const,
                          title: "Credit / Debit Card",
                          desc: "Visa, Mastercard, RuPay",
                        },
                      ].map((method) => {
                        const selected = paymentMethod === method.id;
                        return (
                          <label
                            key={method.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                              selected
                                ? "border-[#7A5A3C] bg-[#FAF3E8]"
                                : "border-[#E9DCC6] bg-white hover:border-[#7A5A3C]/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={selected}
                              onChange={() => setPaymentMethod(method.id)}
                              className="mt-1 accent-[#7A5A3C]"
                            />
                            <div>
                              <p className="text-xs font-bold text-[#1F1A17]">{method.title}</p>
                              <p className="text-[11px] text-[#1F1A17]/65">{method.desc}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#7A5A3C] px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-sm transition-colors hover:bg-[#1F1A17] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Lock className="h-4 w-4" />
                    {isSubmitting ? "Placing Order..." : `Place Order · ${formatPrice(grandTotal)}`}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[#1F1A17]/60">
                    <CreditCard className="h-3.5 w-3.5 text-[#7A5A3C]" />
                    Safe &amp; encrypted checkout powered by Imaan&apos;s Store
                  </p>
                </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </div>
  );
}

