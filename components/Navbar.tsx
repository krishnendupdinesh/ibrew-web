"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  Lock,
  LogOut,
  Minus,
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
  importedbed: "Imported Beds",
  groceries: "Groceries",
  dates: "Dates",
};

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

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
      .catch(() => {});
  }, []);

  useEffect(() => {
    syncAuthUser();
  }, [pathname, syncAuthUser]);

  useEffect(() => {
    window.addEventListener("ibrew-auth-changed", syncAuthUser);
    window.addEventListener("storage", syncAuthUser);
    return () => {
      window.removeEventListener("ibrew-auth-changed", syncAuthUser);
      window.removeEventListener("storage", syncAuthUser);
    };
  }, [syncAuthUser]);

  const handleLogout = async () => {
    setAuthUser(null);
    try {
      window.sessionStorage.removeItem("ibrew_auth_user");
      window.localStorage.removeItem("ibrew_auth_user");
      window.dispatchEvent(new Event("ibrew-auth-changed"));
    } catch {
      // ignore
    }
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.refresh();
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
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white text-black">
        {/* Main bar: logo | search | login/logout | cart
            On mobile the search bar wraps onto its own row below. */}
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 md:flex-nowrap md:gap-8 lg:px-8">
          {/* 1. Logo */}
          <Link href="/" className="order-1 mr-auto shrink-0 transition-opacity hover:opacity-80 md:mr-0">
            <img
              src="/images/logo.png"
              alt="Imaan's Store"
              className="h-14 w-auto object-contain sm:h-16 md:h-[72px]"
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
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 flex items-center justify-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-contain p-0.5"
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
          <div className="order-2 flex shrink-0 items-center gap-2 sm:gap-4 md:order-3">
            {authUser ? (
              <div className="flex items-center gap-2">
                {authUser.role === "admin" && (
                  <Link
                    href="/admin"
                    className="hidden items-center gap-1.5 rounded-lg border border-[#7A5A3C] bg-[#FAF3E8] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white sm:flex"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  title={`Signed in as ${authUser.name}`}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:border-[#1F1A17] hover:bg-[#1F1A17] hover:text-white sm:px-4"
                >
                  <LogOut size={18} strokeWidth={1.8} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href={LOGIN_PAGE}
                className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:border-[#7A5A3C] hover:bg-[#7A5A3C] hover:text-white sm:px-4"
              >
                <User size={20} strokeWidth={1.8} />
                <span>Login</span>
              </Link>
            )}

            <Link
              href="/wishlist"
              aria-label="Open wishlist"
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:border-[#7A5A3C] hover:bg-[#7A5A3C] hover:text-white sm:px-3.5"
            >
              <Heart
                size={19}
                strokeWidth={1.8}
                className={wishlistCount > 0 ? "text-[#B42318]" : ""}
                fill={wishlistCount > 0 ? "#B42318" : "none"}
              />
              <span className="hidden sm:inline">Wishlist</span>
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative flex cursor-pointer items-center gap-2.5 rounded-lg bg-[#7A5A3C] px-3 py-2.5 text-white transition-colors hover:bg-[#35271F] sm:px-4"
            >
              <ShoppingCart size={22} strokeWidth={1.8} />
              <span className="hidden text-sm font-semibold sm:inline">My Cart</span>
            </button>
          </div>
        </nav>
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
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-[#FAF7F2] sm:h-24 sm:w-24">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
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
