"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ubuntu } from "next/font/google";
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useWishlist, type WishlistItem } from "../../lib/wishlistStore";
import { addToCart } from "../../lib/cartStore";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const DARK = "#1F1A17";
const BROWN = "#7A5A3C";
const CREAM = "#FAF7F2";
const SAND = "#E9DCC6";
const RED = "#B42318";

const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

export default function WishlistPage() {
  const router = useRouter();
  const { items, hydrated, count, remove, clear } = useWishlist();

  const handleAddToCart = (item: WishlistItem) => {
    addToCart(
      {
        productId: item.productId,
        name: item.name,
        size: item.size,
        price: item.price,
        mrp: item.mrp,
        image: item.image,
        category: item.category,
      },
      1
    );
    router.push("/cart");
  };

  const handleMoveAllToCart = () => {
    items.forEach((item) => {
      if (item.inStock !== false) {
        addToCart(
          {
            productId: item.productId,
            name: item.name,
            size: item.size,
            price: item.price,
            mrp: item.mrp,
            image: item.image,
            category: item.category,
          },
          1
        );
      }
    });
    router.push("/cart");
  };

  if (!hydrated) {
    return (
      <div
        className={`${ubuntu.className} flex min-h-[70vh] items-center justify-center`}
        style={{ background: CREAM, color: DARK }}
      >
        <p className="text-sm opacity-70">Loading your wishlist…</p>
      </div>
    );
  }

  return (
    <div
      className={`${ubuntu.className} min-h-screen antialiased`}
      style={{ background: CREAM, color: DARK }}
    >
      {/* Top Banner / Breadcrumb */}
      <section className="border-b" style={{ borderColor: SAND, background: "#F5EDE0" }}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#7A5A3C]">
                <Link href="/" className="hover:underline">
                  Home
                </Link>
                <span>/</span>
                <span>Wishlist</span>
              </div>
              <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-bold tracking-tight text-[#1F1A17] sm:text-3xl">
                <Heart className="h-7 w-7 text-[#B42318]" fill={RED} />
                My Wishlist
              </h1>
              <p className="mt-1 text-sm text-[#1F1A17]/70">
                {count > 0
                  ? `You have ${count} saved ${count === 1 ? "item" : "items"} in your wishlist.`
                  : "Save your favourite coffees, spices, fragrances, and essentials here."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {count > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleMoveAllToCart}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#7A5A3C] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#1F1A17]"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add All to Cart
                  </button>
                  <button
                    type="button"
                    onClick={clear}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#B42318] bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#B42318] transition-colors hover:bg-[#B42318] hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear All
                  </button>
                </>
              )}

              <Link
                href="/coffee"
                className="inline-flex items-center gap-2 rounded-full border border-[#7A5A3C] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div
            className="mx-auto max-w-xl rounded-2xl border bg-white p-8 text-center shadow-xs sm:p-12"
            style={{ borderColor: SAND }}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FAF3E8] text-[#B42318]">
              <Heart className="h-9 w-9" strokeWidth={1.6} />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-[#1F1A17]">Your wishlist is empty</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#1F1A17]/65">
              Tap the heart icon on any product across our store to save it here for quick access later.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {[
                { label: "Shop Coffee", href: "/coffee" },
                { label: "Spices", href: "/spices" },
                { label: "Fragrances", href: "/fragrances" },
                { label: "Dates", href: "/dates" },
                { label: "Groceries", href: "/groceries" },
              ].map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="rounded-full border border-[#7A5A3C] bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-5">
            {items.map((item) => {
              const outOfStock = item.inStock === false;
              const discount =
                item.mrp && item.mrp > item.price
                  ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
                  : 0;

              return (
                <article
                  key={item.productId}
                  className="flex min-w-0 flex-col rounded-xl border bg-white p-3.5 shadow-2xs transition hover:border-[#7A5A3C]/50"
                  style={{ borderColor: SAND }}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-[#FAF7F2]">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`h-full w-full object-contain p-2 ${outOfStock ? "opacity-40" : ""}`}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#7A5A3C]/40">
                        <ShoppingBag className="h-10 w-10" />
                      </div>
                    )}

                    {(item.badge || discount > 0) && !outOfStock && (
                      <span
                        className="absolute left-0 top-0 rounded-br-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ background: BROWN }}
                      >
                        {item.badge || `${discount}% off`}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => remove(item.productId)}
                      aria-label={`Remove ${item.name} from wishlist`}
                      title="Remove from wishlist"
                      className="absolute right-1.5 top-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#B42318] shadow-sm transition hover:bg-[#B42318] hover:text-white"
                    >
                      <Heart className="h-4 w-4" fill="currentColor" />
                    </button>
                  </div>

                  {item.category && (
                    <span className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A5A3C]">
                      {item.category}
                    </span>
                  )}

                  <h3 className="mt-1 line-clamp-2 min-h-[2.5em] text-sm font-semibold leading-5 text-[#1F1A17]">
                    {item.name}
                  </h3>

                  {item.size && (
                    <p className="mt-1 text-xs text-[#1F1A17]/65">Size: {item.size}</p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-bold text-[#1F1A17]">
                        {formatPrice(item.price)}
                      </span>
                      {item.mrp && item.mrp > item.price && (
                        <span className="text-[11px] text-[#1F1A17]/45 line-through">
                          {formatPrice(item.mrp)}
                        </span>
                      )}
                    </div>

                    {outOfStock ? (
                      <button
                        type="button"
                        disabled
                        className="h-9 min-w-[72px] rounded-lg border border-neutral-300 bg-neutral-100 px-3 text-xs font-bold uppercase text-neutral-400"
                      >
                        Sold Out
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className="h-9 min-w-[72px] cursor-pointer rounded-lg border border-[#7A5A3C] bg-white px-4 text-sm font-bold uppercase text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white active:scale-95"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

