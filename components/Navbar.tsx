"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  Loader2,
  Lock,
  LogOut,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useCart } from "../lib/cartStore";
import { useWishlist } from "../lib/wishlistStore";
import { useAllProducts, type StoreProduct } from "../lib/productStore";

// ---------------------------------------------------------------------------
// SETTINGS - change these to match your site
// ---------------------------------------------------------------------------
const LOGIN_PAGE = "/login";
const SEARCH_PAGE = "/search";
const CART_PAGE = "/cart";

const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

const SECTION_LABELS: Record<string, string> = {
  coffee: "Coffee",
  "coffee-skin": "Skincare",
  spices: "Spices",
  fragrances: "Fragrances",
  importedbed: "Imported Mattresses",
  groceries: "Groceries",
  dates: "Dates",
};

const CATEGORY_NAV = [
  { label: "All Products", href: "/search" },
  { label: "Coffee", href: "/coffee" },
  { label: "Skincare", href: "/coffee-skin" },
  { label: "Spices", href: "/spices" },
  { label: "Fragrances", href: "/fragrances" },
  { label: "Mattresses", href: "/importedbed" },
  { label: "Groceries", href: "/groceries" },
  { label: "Dates", href: "/dates" },
  { label: "Bulk Order", href: "/bulk-order" },
];

interface LoggedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "customer";
}

// ---------------------------------------------------------------------------
// NAVBAR
// ---------------------------------------------------------------------------
export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [searchText, setSearchText] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [authUser, setAuthUser] = useState<LoggedUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isFetchingAuthRef = useRef(false);
  const { products: allProducts } = useAllProducts();

  const {
    items: cartItems,
    totalItems: cartCount,
    subtotal,
    totalSavings,
    updateQty,
    removeItem,
    CART_DRAWER_EVENT,
  } = useCart();

  const { count: wishlistCount } = useWishlist();

  const syncAuthUser = useCallback(() => {
    // 1. Synchronously read cached session for instantaneous rendering (<1ms)
    try {
      const cached =
        window.sessionStorage.getItem("ibrew_auth_user") ||
        window.localStorage.getItem("ibrew_auth_user");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.email) {
          setAuthUser(parsed);
        }
      } else {
        setAuthUser(null);
      }
    } catch {
      // ignore storage errors
    }

    // 2. Prevent redundant concurrent /api/auth/me requests
    if (isFetchingAuthRef.current) return;
    isFetchingAuthRef.current = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setAuthUser(data.user);
          try {
            window.sessionStorage.setItem("ibrew_auth_user", JSON.stringify(data.user));
            window.localStorage.setItem("ibrew_auth_user", JSON.stringify(data.user));
          } catch {
            // ignore
          }
        } else {
          setAuthUser(null);
          try {
            window.sessionStorage.removeItem("ibrew_auth_user");
            window.localStorage.removeItem("ibrew_auth_user");
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        isFetchingAuthRef.current = false;
      });
  }, []);

  // Sync auth once on mount and on storage / custom auth events
  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      syncAuthUser();
    });
  }, [syncAuthUser]);

  // Fast synchronous cache read on pathname change (avoids repeated network calls)
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const cached =
          window.sessionStorage.getItem("ibrew_auth_user") ||
          window.localStorage.getItem("ibrew_auth_user");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.email) {
            setAuthUser(parsed);
          }
        }
      } catch {
        // ignore
      }
    });
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("ibrew-auth-changed", syncAuthUser);
    window.addEventListener("storage", syncAuthUser);
    return () => {
      window.removeEventListener("ibrew-auth-changed", syncAuthUser);
      window.removeEventListener("storage", syncAuthUser);
    };
  }, [syncAuthUser]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    // 1. Instantly wipe client state and storage (< 1ms UI response)
    try {
      window.sessionStorage.removeItem("ibrew_auth_user");
      window.localStorage.removeItem("ibrew_auth_user");
      window.dispatchEvent(new Event("ibrew-auth-changed"));
    } catch {
      // ignore
    }
    setAuthUser(null);

    // 2. Clear cookie in parallel without delaying user feedback
    fetch("/api/auth/logout", { method: "POST" })
      .catch(() => {})
      .finally(() => {
        setIsLoggingOut(false);
      });

    // 3. Immediately redirect away from admin/protected pages or refresh
    if (pathname.startsWith("/admin") || pathname.startsWith("/orders") || pathname.startsWith("/profile")) {
      router.replace("/login");
    } else {
      router.refresh();
    }
  };

  // Listen for custom open-cart-drawer events
  useEffect(() => {
    const handleOpenDrawer = () => setCartOpen(true);
    window.addEventListener(CART_DRAWER_EVENT, handleOpenDrawer);
    return () => window.removeEventListener(CART_DRAWER_EVENT, handleOpenDrawer);
  }, [CART_DRAWER_EVENT]);

  // While the cart drawer is open: lock page scroll and close on Escape
  useEffect(() => {
    if (!cartOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCartOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cartOpen]);

  // Close search dropdown on click outside or Escape
  useEffect(() => {
    if (!showSearchDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSearchDropdown(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [showSearchDropdown]);

  // Live matching products
  const matchingProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    return allProducts.filter((p) => {
      const text = [
        p.name,
        p.category,
        p.section,
        p.description,
        p.detail,
        p.badge,
        ...(p.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return tokens.every((token) => text.includes(token));
    });
  }, [searchText, allProducts]);

  const dropdownPreview = useMemo(() => {
    return matchingProducts.slice(0, 5);
  }, [matchingProducts]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setShowSearchDropdown(false);
    const query = searchText.trim();
    if (!query) {
      router.push(SEARCH_PAGE);
      return;
    }
    router.push(`${SEARCH_PAGE}?q=${encodeURIComponent(query)}`);
  };

  const handleClearSearch = () => {
    setSearchText("");
    setShowSearchDropdown(false);
    searchInputRef.current?.focus();
  };

  const handleSelectProduct = (product: StoreProduct) => {
    setShowSearchDropdown(false);
    router.push(`${SEARCH_PAGE}?q=${encodeURIComponent(product.name)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-200/90 bg-white/95 text-black backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          {/* Main navigation row */}
          <nav className="flex flex-wrap items-center justify-between gap-y-2 py-2 sm:gap-4 md:flex-nowrap md:py-3">
            {/* 1. Logo */}
            <Link href="/" className="order-1 shrink-0 transition-opacity hover:opacity-85">
              <img
                src="/images/logo.png"
                alt="Imaan's Online"
                className="h-9 w-auto object-contain sm:h-11 md:h-14"
              />
            </Link>

          {/* 2. Search bar with instant live dropdown */}
          <div ref={searchContainerRef} className="relative order-3 w-full md:order-2 md:flex-1">
            <form
              onSubmit={handleSearch}
              role="search"
              className="flex w-full items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-100 px-3.5 py-2.5 transition-all focus-within:border-[#7A5A3C] focus-within:bg-white focus-within:shadow-xs"
            >
              <Search size={18} className="shrink-0 text-neutral-500" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => {
                  if (searchText.trim().length > 0) setShowSearchDropdown(true);
                }}
                placeholder="Search coffee, spices, dates, fragrances..."
                aria-label="Search products"
                className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-full p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </form>

            {/* Instant search popup */}
            {showSearchDropdown && searchText.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
                {dropdownPreview.length > 0 ? (
                  <div className="py-2">
                    <div className="px-3.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Products ({matchingProducts.length})
                    </div>
                    {dropdownPreview.map((item) => {
                      const minPrice = Math.min(...item.sizes.map((s) => s.price));
                      const isOutOfStock = item.sizes.every((s) => s.stock === 0);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectProduct(item)}
                          className="flex w-full items-center gap-3 px-3.5 py-2 text-left transition hover:bg-[#FAF7F2]"
                        >
                          {/* Thumbnail */}
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="absolute inset-0 h-full w-full object-cover object-center"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-neutral-400">IB</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-xs font-semibold text-neutral-900">
                                {item.name}
                              </span>
                              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                                {SECTION_LABELS[item.section] || item.section}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                              <span className="font-bold text-[#7A5A3C]">
                                {minPrice > 0 ? `From ${formatPrice(minPrice)}` : "Price on request"}
                              </span>
                              <span
                                className={`text-[10px] ${
                                  isOutOfStock ? "text-red-500" : "text-emerald-600 font-medium"
                                }`}
                              >
                                {isOutOfStock ? "Out of Stock" : "In Stock"}
                              </span>
                            </div>
                          </div>

                          <ChevronRight size={14} className="text-neutral-400 shrink-0" />
                        </button>
                      );
                    })}

                    <div className="border-t border-neutral-100 mt-1 pt-1 px-2">
                      <button
                        type="button"
                        onClick={handleSearch}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-center text-xs font-bold text-[#7A5A3C] hover:bg-[#FAF3E8] transition"
                      >
                        <span>
                          View all {matchingProducts.length} results for &ldquo;
                          {searchText.trim()}&rdquo;
                        </span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-neutral-600">
                      No products found for &ldquo;<span className="font-semibold">{searchText.trim()}</span>&rdquo;
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      Try searching for coffee, oud, dates, cardamom, pepper, mattress...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Login / Logout + Cart buttons */}
          <div className="order-2 flex shrink-0 items-center gap-1.5 sm:gap-2.5 md:order-3">
            {mounted && authUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {authUser?.role === "admin" ? (
                  <Link
                    href="/admin"
                    className="flex h-9 items-center gap-1 rounded-lg border border-[#7A5A3C] bg-[#FAF3E8] px-2.5 text-xs font-bold uppercase tracking-wider text-[#7A5A3C] transition hover:bg-[#7A5A3C] hover:text-white sm:h-10 sm:px-3.5"
                  >
                    Admin
                  </Link>
                ) : (
                  <Link
                    href="/orders"
                    aria-label="My Orders"
                    title="My Orders"
                    className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition sm:h-10 sm:px-3 sm:text-sm ${
                      pathname.startsWith("/orders")
                        ? "border-[#7A5A3C] bg-[#FAF3E8] text-[#7A5A3C]"
                        : "border-neutral-200 bg-white text-neutral-800 hover:border-[#7A5A3C] hover:bg-[#FAF3E8] hover:text-[#7A5A3C]"
                    }`}
                  >
                    <Package size={16} strokeWidth={1.8} className="shrink-0 text-[#7A5A3C]" />
                    <span>Orders</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title={authUser ? `Signed in as ${authUser.name} — Logout` : "Logout"}
                  aria-label="Logout"
                  className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-3"
                >
                  {isLoggingOut ? (
                    <Loader2 size={16} className="animate-spin text-[#7A5A3C]" />
                  ) : (
                    <LogOut size={16} strokeWidth={1.8} className="shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm font-semibold">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href={LOGIN_PAGE}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-2.5 text-xs font-semibold text-neutral-800 transition hover:border-[#7A5A3C] hover:bg-[#7A5A3C] hover:text-white sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
              >
                <User size={16} strokeWidth={1.8} className="shrink-0" />
                <span>Login</span>
              </Link>
            )}

            <Link
              href="/wishlist"
              aria-label="Wishlist"
              title="Wishlist"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition hover:border-[#7A5A3C] hover:text-[#7A5A3C] sm:h-10 sm:w-auto sm:px-3 sm:gap-1.5"
            >
              <Heart
                size={17}
                strokeWidth={1.8}
                className={`shrink-0 ${wishlistCount > 0 ? "text-[#B42318]" : ""}`}
                fill={wishlistCount > 0 ? "#B42318" : "none"}
              />
              <span className="hidden sm:inline text-xs sm:text-sm font-semibold">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B42318] px-1 text-[10px] font-bold text-white shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Shopping Cart"
              title="Shopping Cart"
              className="relative flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#7A5A3C] px-2.5 text-white transition hover:bg-[#35271F] sm:h-10 sm:px-3.5"
            >
              <ShoppingCart size={17} strokeWidth={1.8} className="shrink-0" />
              <span className="hidden sm:inline text-xs font-semibold sm:text-sm">Cart</span>
              {cartCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-[#7A5A3C]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* 4. Mobile Category Quick Bar */}
        <nav
          aria-label="Quick category navigation"
          className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-t border-neutral-100"
        >
          {CATEGORY_NAV.map((cat) => {
            const active = cat.href === "/search" ? pathname === "/search" : pathname.startsWith(cat.href);
            return (
              <Link
                key={cat.label}
                href={cat.href}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  active
                    ? "bg-[#7A5A3C] text-white font-semibold"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Dark backdrop (click to close) */}
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/60"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="absolute right-0 top-0 flex h-[100dvh] w-full max-w-md flex-col bg-white text-black shadow-2xl sm:w-[440px]"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-[#1F1A17]">Your Cart</h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {cartCount} {cartCount === 1 ? "item" : "items"} in your bag
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
                className="cursor-pointer rounded-full p-2 text-neutral-700 transition hover:bg-neutral-100 hover:text-black"
              >
                <X size={22} />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FAF7F2]">
                    <ShoppingCart size={34} strokeWidth={1.3} className="text-[#7A5A3C]" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-[#1F1A17]">Your cart is empty</h3>
                  <p className="mt-2 max-w-[250px] text-sm leading-6 text-neutral-500">
                    Looks like you haven&apos;t added any products yet. Click &ldquo;Add&rdquo; on any product to start shopping!
                  </p>

                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="mt-6 cursor-pointer rounded-full bg-[#7A5A3C] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#35271F]"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {cartItems.map((item) => (
                    <article key={item.id} className="flex gap-4 border-b border-neutral-200 pb-5">
                      {/* Product image */}
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-[#FAF7F2]">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="absolute inset-0 h-full w-full object-cover object-center" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ShoppingBag className="text-neutral-400" />
                          </div>
                        )}
                      </div>

                      {/* Product details */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[#1F1A17]">
                              {item.name}
                            </h3>
                            {item.size && (
                              <span className="mt-1 inline-block rounded bg-[#FAF3E8] px-2 py-0.5 text-[11px] font-medium text-[#7A5A3C]">
                                {item.size}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="shrink-0 cursor-pointer rounded p-1 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>

                        <div className="mt-1.5 flex items-baseline gap-2">
                          <p className="text-sm font-semibold text-[#1F1A17]">{formatPrice(item.price)}</p>
                          {item.mrp && item.mrp > item.price && (
                            <p className="text-xs text-neutral-400 line-through">{formatPrice(item.mrp)}</p>
                          )}
                        </div>

                        {/* Quantity controls and line total */}
                        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                          <div className="flex items-center rounded-full border border-neutral-300 bg-white">
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, -1)}
                              aria-label={`Decrease quantity of ${item.name}`}
                              className="cursor-pointer rounded-l-full p-2 text-neutral-700 transition hover:bg-[#FAF3E8] hover:text-[#7A5A3C]"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-[#1F1A17]">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateQty(item.id, 1)}
                              aria-label={`Increase quantity of ${item.name}`}
                              className="cursor-pointer rounded-r-full p-2 text-neutral-700 transition hover:bg-[#FAF3E8] hover:text-[#7A5A3C]"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <p className="text-sm font-bold text-[#1F1A17]">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Subtotal and checkout */}
            {cartItems.length > 0 && (
              <div className="border-t border-neutral-200 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
                <div className="flex items-center justify-between text-sm text-neutral-600">
                  <span>Subtotal</span>
                  <span className="text-base font-bold text-[#1F1A17]">{formatPrice(subtotal)}</span>
                </div>

                {totalSavings > 0 && (
                  <p className="mt-1 text-xs font-medium text-[#2E5A36]">
                    You save {formatPrice(totalSavings)} on this order!
                  </p>
                )}

                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Shipping and any applicable taxes are calculated at checkout.
                </p>

                {authUser ? (
                  <Link
                    href={CART_PAGE}
                    onClick={() => setCartOpen(false)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#7A5A3C] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#35271F]"
                  >
                    View Cart &amp; Checkout <ArrowRight size={17} />
                  </Link>
                ) : (
                  <Link
                    href="/login?next=/cart"
                    onClick={() => setCartOpen(false)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#7A5A3C] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#35271F]"
                  >
                    <Lock size={16} /> Log in to Checkout
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mt-2.5 w-full cursor-pointer rounded-full border border-[#7A5A3C] bg-white px-5 py-3 text-sm font-medium text-[#7A5A3C] transition hover:bg-[#7A5A3C] hover:text-white"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
