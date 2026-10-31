"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Ubuntu } from "next/font/google";
import { useAllProducts, type StoreProduct } from "../../lib/productStore";
import { addToCart } from "../../lib/cartStore";
import { useWishlist } from "../../lib/wishlistStore";
import {
  ChevronDown,
  Heart,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  PackageOpen,
  ArrowRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// STYLE TOKENS
// ---------------------------------------------------------------------------
const INK = "#1F1A17";
const PASTEL = "#E9DCC6";
const BROWN = "#7A5A3C";
const MUTED = "rgba(31,26,23,0.65)";
const LINE = "rgba(31,26,23,0.15)";
const RED = "#E11D48";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const SECTION_OPTIONS = [
  { value: "all", label: "All Items" },
  { value: "coffee", label: "Coffee" },
  { value: "coffee-skin", label: "Skincare" },
  { value: "spices", label: "Spices" },
  { value: "fragrances", label: "Fragrances" },
  { value: "importedbed", label: "Imported Beds" },
  { value: "groceries", label: "Groceries" },
  { value: "dates", label: "Dates" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "featured", label: "Featured & Bestsellers" },
  { value: "low", label: "Price: Low to High" },
  { value: "high", label: "Price: High to Low" },
  { value: "az", label: "Name: A to Z" },
  { value: "za", label: "Name: Z to A" },
  { value: "rating", label: "Top Rated" },
];

const POPULAR_SEARCHES = [
  "Filter Coffee",
  "Instant Coffee",
  "Arabica",
  "Coffee Soap",
  "Cardamom",
  "Black Pepper",
  "Oud",
  "Medjool Dates",
  "Mattress",
];

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------
function ProductImage({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-4 text-center"
        style={{ background: PASTEL }}
      >
        <span className="text-sm font-medium leading-tight">{name}</span>
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>
          Photo coming soon
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-contain p-2"
    />
  );
}

function SizeDropdown({
  sizes,
  selectedIndex,
  onSelect,
}: {
  sizes: StoreProduct["sizes"];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = sizes[selectedIndex] || sizes[0];
  if (!selected) return null;

  if (sizes.length <= 1) {
    return (
      <p className="text-xs" style={{ color: MUTED }}>
        {selected.label || "Standard"}
      </p>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-fit">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 text-xs font-semibold"
        style={{ color: BROWN }}
      >
        {selected.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg border bg-white shadow-lg"
          style={{ borderColor: LINE }}
        >
          {sizes.map((size, i) => (
            <li key={size.label + i} role="option" aria-selected={i === selectedIndex}>
              <button
                type="button"
                onClick={() => {
                  onSelect(i);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-xs hover:bg-neutral-50"
                style={{
                  color: size.stock === 0 ? MUTED : INK,
                  fontWeight: i === selectedIndex ? 700 : 400,
                }}
              >
                <span>{size.label}</span>
                <span className="text-[11px]">
                  {size.stock === 0 ? "Out of stock" : formatPrice(size.price)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchProductCard({
  product,
  wished,
  onToggleWish,
}: {
  product: StoreProduct;
  wished: boolean;
  onToggleWish: (
    product: StoreProduct,
    size: { label: string; price: number; mrp?: number; stock: number }
  ) => void;
}) {
  const router = useRouter();
  const firstAvailable = Math.max(0, product.sizes.findIndex((s) => s.stock > 0));
  const [sizeIndex, setSizeIndex] = useState(firstAvailable >= 0 ? firstAvailable : 0);

  const size = product.sizes[sizeIndex] ?? product.sizes[0] ?? { label: "Standard", price: 0, stock: 0 };
  const outOfStock = size.stock === 0;
  const lowStock = !outOfStock && size.stock <= 5;
  const discount = size.mrp && size.mrp > size.price ? Math.round((1 - size.price / size.mrp) * 100) : 0;

  const sectionRoute = `/${product.section}`;

  const handleAdd = () => {
    addToCart(
      {
        productId: product.id,
        name: product.name,
        size: size.label,
        price: size.price,
        mrp: size.mrp,
        image: product.image,
        category: product.category,
      },
      1
    );
    router.push("/cart");
  };

  return (
    <article
      className="group flex min-w-0 flex-col rounded-xl border bg-white p-3 shadow-xs transition hover:shadow-md"
      style={{ borderColor: LINE }}
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-50">
        <ProductImage src={product.image} name={product.name} />

        {(product.badge || product.isMostSelling || product.isBestSeller || discount > 0) && !outOfStock && (
          <span
            className="absolute left-0 top-0 rounded-br-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ background: BROWN }}
          >
            {product.badge || (product.isMostSelling ? "Most Selling" : product.isBestSeller ? "Bestseller" : `${discount}% OFF`)}
          </span>
        )}

        {outOfStock && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-neutral-800/80 px-2.5 py-1 text-[11px] font-semibold text-white">
            Out of Stock
          </span>
        )}

        <button
          type="button"
          onClick={() => onToggleWish(product, size)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
          style={{ color: RED }}
        >
          <Heart className="h-4 w-4" strokeWidth={1.7} fill={wished ? RED : "none"} />
        </button>
      </div>

      {/* Category Pill Link */}
      <div className="mt-2.5 flex items-center justify-between text-[11px]">
        <Link
          href={sectionRoute}
          className="font-semibold uppercase tracking-wider text-[#7A5A3C] hover:underline"
        >
          {product.category || product.section}
        </Link>
        {product.rating > 0 && (
          <span className="flex items-center gap-0.5 text-neutral-600 font-medium">
            ★ {product.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Product Title */}
      <h3 className="mt-1 line-clamp-2 min-h-[2.5em] text-sm font-semibold leading-5 text-neutral-900">
        <Link href={sectionRoute} className="hover:text-[#7A5A3C] transition-colors">
          {product.name}
        </Link>
      </h3>

      {/* Size Selector */}
      <div className="mt-1">
        <SizeDropdown sizes={product.sizes} selectedIndex={sizeIndex} onSelect={setSizeIndex} />
      </div>

      {/* Stock warning */}
      <p className="mt-1 h-4 text-[11px] font-medium" style={{ color: "#B54708" }}>
        {lowStock ? `Only ${size.stock} left in stock` : ""}
      </p>

      {/* Price & Add to Cart button */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <div className="flex flex-col leading-tight">
          <span className="text-base font-bold text-neutral-900">{formatPrice(size.price)}</span>
          {size.mrp && size.mrp > size.price && (
            <span className="text-[11px] line-through" style={{ color: MUTED }}>
              {formatPrice(size.mrp)}
            </span>
          )}
        </div>

        {!outOfStock ? (
          <button
            type="button"
            onClick={handleAdd}
            className="h-8.5 min-w-[70px] cursor-pointer rounded-lg border border-[#7A5A3C] bg-white px-3 text-xs font-bold uppercase text-[#7A5A3C] transition hover:bg-[#7A5A3C] hover:text-white active:scale-95"
          >
            Add
          </button>
        ) : (
          <span className="text-xs font-semibold text-neutral-400">Sold out</span>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// MAIN CONTENT COMPONENT (uses useSearchParams)
// ---------------------------------------------------------------------------
function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialSection = searchParams.get("section") || "all";

  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [sortBy, setSortBy] = useState("relevance");
  const [inStockOnly, setInStockOnly] = useState(false);

  const { products: allProducts, loading } = useAllProducts();
  const { isWished, toggle: toggleWish } = useWishlist();

  const handleToggleWish = (
    product: StoreProduct,
    size: { label: string; price: number; mrp?: number; stock: number }
  ) => {
    toggleWish({
      productId: product.id,
      name: product.name,
      size: size.label,
      price: size.price,
      mrp: size.mrp,
      image: product.image,
      category: product.category,
      badge: product.badge,
      inStock: size.stock > 0,
    });
  };

  // Sync state if URL query changes
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const sec = searchParams.get("section") || "all";
    setInputQuery(q);
    setActiveQuery(q);
    setSelectedSection(sec);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputQuery.trim();
    setActiveQuery(trimmed);

    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    if (selectedSection && selectedSection !== "all") params.set("section", selectedSection);

    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleSelectQuickSearch = (keyword: string) => {
    setInputQuery(keyword);
    setActiveQuery(keyword);
    const params = new URLSearchParams();
    params.set("q", keyword);
    if (selectedSection && selectedSection !== "all") params.set("section", selectedSection);
    router.push(`/search?${params.toString()}`);
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Filter by section
    if (selectedSection !== "all") {
      result = result.filter((p) => p.section === selectedSection);
    }

    // Filter by search terms
    const q = activeQuery.trim().toLowerCase();
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      result = result.filter((p) => {
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
    }

    // In stock filter
    if (inStockOnly) {
      result = result.filter((p) => p.sizes.some((s) => s.stock > 0));
    }

    // Sort products
    result.sort((a, b) => {
      const aMinPrice = Math.min(...a.sizes.map((s) => s.price));
      const bMinPrice = Math.min(...b.sizes.map((s) => s.price));

      if (sortBy === "low") return aMinPrice - bMinPrice;
      if (sortBy === "high") return bMinPrice - aMinPrice;
      if (sortBy === "az") return a.name.localeCompare(b.name);
      if (sortBy === "za") return b.name.localeCompare(a.name);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "featured") {
        const aScore = (a.isMostSelling ? 2 : 0) + (a.isBestSeller ? 1 : 0);
        const bScore = (b.isMostSelling ? 2 : 0) + (b.isBestSeller ? 1 : 0);
        return bScore - aScore;
      }

      // Default: relevance (exact matches in name first)
      if (q) {
        const aNameHas = a.name.toLowerCase().includes(q) ? 1 : 0;
        const bNameHas = b.name.toLowerCase().includes(q) ? 1 : 0;
        if (bNameHas !== aNameHas) return bNameHas - aNameHas;
      }
      return 0;
    });

    return result;
  }, [allProducts, activeQuery, selectedSection, inStockOnly, sortBy]);

  return (
    <div className={`min-h-screen bg-[#FDFBF7] ${ubuntu.className} text-[#1F1A17]`}>
      {/* Top Banner / Search Header */}
      <section className="border-b border-neutral-200 bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-neutral-500">
            <Link href="/" className="hover:text-black">
              Home
            </Link>{" "}
            /{" "}
            <span className="font-semibold text-neutral-800">Search</span>
          </nav>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-neutral-900">
            {activeQuery ? (
              <>
                Search results for{" "}
                <span className="text-[#7A5A3C]">&ldquo;{activeQuery}&rdquo;</span>
              </>
            ) : (
              "Browse & Search All Products"
            )}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {loading
              ? "Loading our full catalog..."
              : `Found ${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} across all departments.`}
          </p>

          {/* Search Bar on Page */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-5 flex w-full items-center gap-2 rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-2.5 focus-within:border-[#7A5A3C] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7A5A3C]/20 shadow-xs"
          >
            <Search size={20} className="text-neutral-400 shrink-0" />
            <input
              type="search"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Search by name, spice, perfume, beans, bed, dates..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
            {inputQuery && (
              <button
                type="button"
                onClick={() => {
                  setInputQuery("");
                  setActiveQuery("");
                  router.push("/search");
                }}
                className="text-neutral-400 hover:text-neutral-600 p-1"
                title="Clear input"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              className="rounded-lg bg-[#7A5A3C] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#634830] shrink-0"
            >
              Search
            </button>
          </form>

          {/* Quick Suggestions */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-medium text-neutral-500 mr-1 flex items-center gap-1">
              <Sparkles size={13} className="text-[#7A5A3C]" /> Popular:
            </span>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleSelectQuickSearch(term)}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                  activeQuery.toLowerCase() === term.toLowerCase()
                    ? "border-[#7A5A3C] bg-[#7A5A3C] text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Filter & Sort Controls */}
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-5 md:flex-row md:items-center md:justify-between">
          {/* Section Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SECTION_OPTIONS.map((opt) => {
              const active = selectedSection === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedSection(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-[#7A5A3C] text-white shadow-xs"
                      : "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Right controls: In stock toggle + Sort dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700 select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-[#7A5A3C] focus:ring-[#7A5A3C]"
              />
              In-stock only
            </label>

            <div className="flex items-center gap-1.5 text-xs">
              <SlidersHorizontal size={14} className="text-neutral-500" />
              <span className="text-neutral-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 outline-none focus:border-[#7A5A3C]"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid or Empty State */}
        {filteredProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            {filteredProducts.map((p) => (
              <SearchProductCard
                key={p.id}
                product={p}
                wished={isWished(p.id)}
                onToggleWish={handleToggleWish}
              />
            ))}
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white py-16 px-4 text-center">
            <PackageOpen className="h-14 w-14 text-neutral-400 stroke-1" />
            <h2 className="mt-4 text-lg font-bold text-neutral-900">
              No matching products found
            </h2>
            <p className="mt-1 max-w-md text-sm text-neutral-600">
              We couldn&apos;t find any products matching &ldquo;{activeQuery || "your filters"}&rdquo;.
              Check your spelling or explore one of our popular categories below.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                href="/coffee"
                className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 hover:border-[#7A5A3C] hover:text-[#7A5A3C]"
              >
                Coffee Powder & Beans
              </Link>
              <Link
                href="/spices"
                className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 hover:border-[#7A5A3C] hover:text-[#7A5A3C]"
              >
                Fresh Spices
              </Link>
              <Link
                href="/dates"
                className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 hover:border-[#7A5A3C] hover:text-[#7A5A3C]"
              >
                Premium Dates
              </Link>
              <Link
                href="/fragrances"
                className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 hover:border-[#7A5A3C] hover:text-[#7A5A3C]"
              >
                Luxury Fragrances
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DEFAULT EXPORT WITH SUSPENSE BOUNDARY
// ---------------------------------------------------------------------------
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-neutral-600">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-[#7A5A3C] border-t-transparent" />
            <p className="mt-3 text-sm font-medium">Loading search results...</p>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
