"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  User,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// SETTINGS - change these to match your site
// ---------------------------------------------------------------------------
const LOGO_URL = "https://your-image-url.com/logo.png";
const LOGIN_PAGE = "/login";
const SEARCH_PAGE = "/search"; // search results page (receives ?q=...)
const CART_PAGE = "/cart";

// ---------------------------------------------------------------------------
// SAMPLE CART DATA (UI only)
// Replace this with your own cart later. Set it to [] to see the empty cart.
// ---------------------------------------------------------------------------
type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

const SAMPLE_CART_ITEMS: CartItem[] = [
  { id: 1, name: "Filter coffee powder 250g", price: 349, quantity: 1, image: "https://your-image-url.com/coffee.jpg" },
  { id: 2, name: "Green cardamom 50g", price: 449, quantity: 2, image: "https://your-image-url.com/cardamom.jpg" },
];

const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

// ---------------------------------------------------------------------------
// NAVBAR
// ---------------------------------------------------------------------------
export default function Navbar() {
  const router = useRouter();

  const [searchText, setSearchText] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(SAMPLE_CART_ITEMS);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

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

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    const query = searchText.trim();
    if (!query) return;

    router.push(`${SEARCH_PAGE}?q=${encodeURIComponent(query)}`);
  };

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  // Changing quantity to 0 removes the item
  const changeQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems((items) => items.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white text-black">
        {/* Main bar: logo | search | login | cart
            On mobile the search bar wraps onto its own row below. */}
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 md:flex-nowrap md:gap-8 lg:px-8">
          {/* 1. Logo */}
          <Link href="/" className="order-1 mr-auto shrink-0 transition-opacity hover:opacity-80 md:mr-0">
            <img
              src="images/logo.png"
              alt="Imaan's Store"
              className="h-14 w-auto object-contain sm:h-16 md:h-[72px]"
            />
          </Link>

          {/* 2. Search bar */}
          <form
            onSubmit={handleSearch}
            role="search"
            className="order-3 flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2.5 focus-within:border-neutral-400 md:order-2 md:flex-1"
          >
            <Search size={18} className="shrink-0 text-neutral-500" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder='Search "coffee beans"'
              aria-label="Search products"
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500"
            />
          </form>

          {/* 3. Login + cart buttons */}
          <div className="order-2 flex shrink-0 items-center gap-2 sm:gap-5 md:order-3">
            <Link
              href={LOGIN_PAGE}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:border-brown-700 hover:bg-brown-50 hover:text-brown-800 sm:px-4"
            >
              <User size={20} strokeWidth={1.8} />
              <span>Login</span>
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open cart, ${cartCount} items`}
              className="relative flex items-center gap-3 rounded-lg bg-[#7A5A3C] px-3 py-2.5 text-white transition-colors hover:bg-[#35271F] sm:px-4"
            >
              <ShoppingCart size={22} strokeWidth={1.8} />

              {/* Desktop text: "My Cart" or "3 items / ₹750" */}
              <span className="hidden flex-col text-left text-xs font-semibold leading-4 sm:flex">
                {cartCount > 0 ? (
                  <>
                    <span>
                      {cartCount} {cartCount === 1 ? "item" : "items"}
                    </span>
                    <span>{formatPrice(subtotal)}</span>
                  </>
                ) : (
                  <span className="text-sm">My Cart</span>
                )}
              </span>

              {/* Mobile: small count badge */}
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white sm:hidden">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
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
                <h2 className="text-lg font-semibold">Your Cart</h2>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {cartCount} {cartCount === 1 ? "item" : "items"} in your bag
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
                className="rounded-full p-2 transition hover:bg-neutral-100"
              >
                <X size={22} />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
                    <ShoppingCart size={34} strokeWidth={1.3} className="text-neutral-600" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">Your cart is empty</h3>
                  <p className="mt-2 max-w-[250px] text-sm leading-6 text-neutral-500">
                    Looks like you haven&apos;t added any products yet.
                  </p>

                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {cartItems.map((item) => (
                    <article key={item.id} className="flex gap-4 border-b border-neutral-200 pb-5">
                      {/* Product image */}
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-28 sm:w-28">
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
                          <h3 className="line-clamp-2 text-sm font-medium leading-5">{item.name}</h3>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="shrink-0 rounded p-1 text-neutral-500 transition hover:text-black"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>

                        <p className="mt-2 text-sm font-semibold">{formatPrice(item.price)}</p>

                        {/* Quantity controls and line total */}
                        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                          <div className="flex items-center rounded-full border border-neutral-300">
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.id, item.quantity - 1)}
                              aria-label={`Decrease quantity of ${item.name}`}
                              className="rounded-l-full p-2 transition hover:bg-neutral-100"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="min-w-8 text-center text-sm tabular-nums">{item.quantity}</span>

                            <button
                              type="button"
                              onClick={() => changeQuantity(item.id, item.quantity + 1)}
                              aria-label={`Increase quantity of ${item.name}`}
                              className="rounded-r-full p-2 transition hover:bg-neutral-100"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
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
                  <span className="text-base font-semibold text-black">{formatPrice(subtotal)}</span>
                </div>

                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Shipping and any applicable taxes are calculated at checkout.
                </p>

                <Link
                  href={CART_PAGE}
                  onClick={() => setCartOpen(false)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  View Cart &amp; Checkout <ArrowRight size={17} />
                </Link>

                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mt-3 w-full rounded-full border border-black px-5 py-3 text-sm font-medium transition hover:bg-neutral-100"
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