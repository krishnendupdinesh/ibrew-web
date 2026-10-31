"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Ubuntu } from "next/font/google";
import { useSectionProducts } from "../../lib/productStore";
import { addToCart } from "../../lib/cartStore";
import { toggleWishlistItem, useWishlist } from "../../lib/wishlistStore";
import {
  ChevronDown,
  Heart,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// STYLE TOKENS
// ---------------------------------------------------------------------------
const INK = "#1F1A17";
const CREAM = "#FFFFFF";
const PASTEL = "#E9DCC6";
const BROWN = "#7A5A3C";
const MUTED = "rgba(31,26,23,0.65)";
const LINE = "rgba(31,26,23,0.15)";
const RED = "#E11D48"; // wishlist heart

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const hideScrollbar = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// ---------------------------------------------------------------------------
// IMAGE URLS - paste your own image links here
// ---------------------------------------------------------------------------
const IMAGES = {
  banner: "https://images.unsplash.com/photo-1739949816834-893c498203a1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
  coffeeSoap: "https://your-image-url.com/coffee-soap.jpg",
  coffeeFaceWash: "https://your-image-url.com/coffee-face-wash.jpg",
  coffeeScrub: "https://your-image-url.com/coffee-scrub.jpg",
};

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type ProductSize = {
  label: string; // e.g. "100ml"
  price: number;
  mrp?: number; // original price, shown struck through
  stock: number; // units available (0 = out of stock)
};

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number; // 0 to 5
  reviewCount: number;
  badge?: string;
  isBestSeller?: boolean;
  isMostSelling?: boolean;
  image: string;
  sizes: ProductSize[];
};

type AddToCartItem = {
  productId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
};

// ---------------------------------------------------------------------------
// SAMPLE PRODUCTS (UI only - replace with your own data later)
// ---------------------------------------------------------------------------
const PRODUCTS: Product[] = [
  {
    id: "coffee-soap",
    name: "Coffee Soap Bar",
    category: "Soap",
    description: "Handmade soap with ground coffee. Gently exfoliates and leaves skin soft.",
    rating: 4.4,
    reviewCount: 52,
    badge: "Top seller",
    image: IMAGES.coffeeSoap,
    sizes: [
      { label: "1 bar", price: 199, stock: 40 },
      { label: "Pack of 3", price: 549, mrp: 597, stock: 20 },
    ],
  },
  {
    id: "coffee-face-wash",
    name: "Coffee Face Wash",
    category: "Face Care",
    description: "Daily cleansing face wash with the goodness of coffee. Fresh, clean and bright.",
    rating: 4.3,
    reviewCount: 41,
    image: IMAGES.coffeeFaceWash,
    sizes: [
      { label: "50ml", price: 249, stock: 22 },
      { label: "100ml", price: 349, mrp: 399, stock: 9 },
    ],
  },
  {
    id: "coffee-scrub",
    name: "Coffee Body Scrub",
    category: "Body Care",
    description: "Invigorating scrub that buffs away dull skin. Smells like freshly brewed coffee.",
    rating: 4.6,
    reviewCount: 33,
    image: IMAGES.coffeeScrub,
    sizes: [
      { label: "100g", price: 399, stock: 0 },
      { label: "200g", price: 699, mrp: 799, stock: 0 },
    ],
  },
];

const CATEGORY_OPTIONS = ["Soap", "Face Care", "Body Care"];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "az", label: "Alphabetically, A-Z" },
  { value: "za", label: "Alphabetically, Z-A" },
  { value: "low", label: "Price, low to high" },
  { value: "high", label: "Price, high to low" },
  { value: "rating", label: "Top rated" },
];

const PAGE_SIZE = 24;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const lowestPrice = (p: Product) => Math.min(...p.sizes.map((s) => s.price));
const isSoldOut = (p: Product) => p.sizes.every((s) => s.stock === 0);

// Image that disappears if the URL fails; the label box behind it shows instead
function ProductImage({ src, name, className }: { src: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-4 text-center" style={{ background: PASTEL }}>
        <span className="text-base font-medium leading-tight">{name}</span>
        <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: MUTED }}>
          Photo coming soon
        </span>
      </div>
    );
  }

  return <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} className={className} />;
}

// ---------------------------------------------------------------------------
// SIZE DROPDOWN (shows the selected size; opens a list when there is a choice)
// ---------------------------------------------------------------------------
type SizeDropdownProps = {
  sizes: ProductSize[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

function SizeDropdown({ sizes, selectedIndex, onSelect }: SizeDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close the list when clicking outside of it
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = sizes[selectedIndex];

  // Only one size: plain text, no dropdown
  if (sizes.length === 1) {
    return (
      <p className="text-sm" style={{ color: MUTED }}>
        {selected.label}
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
        className="flex items-center gap-1 text-sm font-medium"
        style={{ color: BROWN }}
      >
        {selected.label}
        <ChevronDown aria-hidden className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 min-w-[170px] overflow-hidden rounded-lg border bg-white shadow-lg"
          style={{ borderColor: LINE }}
        >
          {sizes.map((size, i) => (
            <li key={size.label} role="option" aria-selected={i === selectedIndex}>
              <button
                type="button"
                onClick={() => {
                  onSelect(i);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                style={{ color: size.stock === 0 ? MUTED : INK, fontWeight: i === selectedIndex ? 700 : 400 }}
              >
                <span>{size.label}</span>
                <span className="text-xs">{size.stock === 0 ? "Out of stock" : formatPrice(size.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PRODUCT CARD (name, size, price, ADD button)
// ---------------------------------------------------------------------------
type ProductCardProps = {
  product: Product;
  wished: boolean;
  onToggleWish: (id: string) => void;
  // Called every time the quantity changes. quantity 0 means "removed".
  onCartChange: (item: AddToCartItem) => void;
};

function ProductCard({ product, wished, onToggleWish, onCartChange }: ProductCardProps) {
  // Start on the first size that is in stock
  const firstAvailable = Math.max(0, product.sizes.findIndex((s) => s.stock > 0));

  const router = useRouter();
  const [sizeIndex, setSizeIndex] = useState(firstAvailable);

  const size = product.sizes[sizeIndex] ?? product.sizes[0] ?? { label: "Standard", price: 0, stock: 0 };
  const outOfStock = size.stock === 0;
  const lowStock = !outOfStock && size.stock <= 5;
  const discount = size.mrp ? Math.round((1 - size.price / size.mrp) * 100) : 0;

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
    onCartChange({
      productId: product.id,
      name: product.name,
      size: size.label,
      price: size.price,
      quantity: 1,
      image: product.image,
    });
    router.push("/cart");
  };

  const chooseSize = (index: number) => {
    setSizeIndex(index);
  };

  return (
    <article className="flex min-w-0 flex-col rounded-xl border bg-white p-3" style={{ borderColor: LINE }}>
      {/* Image, badge, wishlist heart, out-of-stock label */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
        <ProductImage
          src={product.image}
          name={product.name}
          className={`absolute inset-0 h-full w-full object-contain p-2 ${outOfStock ? "opacity-40" : ""}`}
        />

        {(product.badge || product.isMostSelling || product.isBestSeller || discount > 0) && !outOfStock && (
          <span
            className="absolute left-0 top-0 rounded-br-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ background: BROWN }}
          >
            {product.badge || (product.isMostSelling ? "Most Selling" : product.isBestSeller ? "Bestseller" : `${discount}% off`)}
          </span>
        )}

        {outOfStock && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-neutral-600/80 px-2 py-1 text-[11px] font-medium text-white">
            Out of Stock
          </span>
        )}

        <button
          type="button"
          onClick={() => onToggleWish(product.id)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
          style={{ color: RED }}
        >
          <Heart aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.5} fill={wished ? RED : "none"} />
        </button>
      </div>

      {/* Name */}
      <h3 className="mt-3 line-clamp-2 min-h-[2.5em] text-sm font-medium leading-5">{product.name}</h3>

      {/* Size (dropdown when there is more than one) */}
      <div className="mt-1">
        <SizeDropdown sizes={product.sizes} selectedIndex={sizeIndex} onSelect={chooseSize} />
      </div>

      {/* Low stock warning (keeps a fixed height so cards line up) */}
      <p className="mt-1 h-4 text-[11px] font-medium" style={{ color: "#B54708" }}>
        {lowStock ? `Only ${size.stock} left` : ""}
      </p>

      {/* Price + ADD button */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <p className="flex flex-col leading-tight">
          <span className="text-sm font-bold">{formatPrice(size.price)}</span>
          {size.mrp && (
            <span className="text-[11px] line-through" style={{ color: MUTED }}>
              {formatPrice(size.mrp)}
            </span>
          )}
        </p>

        {!outOfStock && (
          <button
            type="button"
            onClick={handleAdd}
            className="h-9 min-w-[72px] cursor-pointer rounded-lg border border-[#7A5A3C] bg-white px-4 text-sm font-bold uppercase text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white active:scale-95"
          >
            Add
          </button>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// FILTER PANEL (used in the sidebar on desktop and in the drawer on mobile)
// ---------------------------------------------------------------------------
type FilterState = {
  categories: string[];
  inStockOnly: boolean;
  minPrice: string;
  maxPrice: string;
};

type FilterPanelProps = {
  categories?: string[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  activeCount: number;
  onClear: () => void;
};

function FilterPanel({ categories = CATEGORY_OPTIONS, filters, onChange, activeCount, onClear }: FilterPanelProps) {
  const toggleCategory = (category: string) => {
    const next = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onChange({ ...filters, categories: next });
  };

  const sectionTitle = "mb-4 text-sm font-medium uppercase tracking-[0.2em]";
  const priceInput = "w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-[#7A5A3C]";

  return (
    <div>
      {activeCount > 0 && (
        <button type="button" onClick={onClear} className="mb-5 text-xs uppercase tracking-widest underline underline-offset-4" style={{ color: BROWN }}>
          Clear all ({activeCount})
        </button>
      )}

      {/* Type */}
      <div className="border-b py-5" style={{ borderColor: LINE }}>
        <h3 className={sectionTitle}>Type</h3>
        <ul className="space-y-3">
          {categories.map((category) => (
            <li key={category}>
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => toggleCategory(category)}
                  className="h-4 w-4 accent-[#7A5A3C]"
                />
                {category}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div className="border-b py-5" style={{ borderColor: LINE }}>
        <h3 className={sectionTitle}>Price</h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="Minimum price"
            placeholder="₹ Min"
            value={filters.minPrice}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
            className={priceInput}
            style={{ borderColor: LINE }}
          />
          <span aria-hidden>-</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="Maximum price"
            placeholder="₹ Max"
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
            className={priceInput}
            style={{ borderColor: LINE }}
          />
        </div>
      </div>

      {/* Availability */}
      <div className="py-5">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium uppercase tracking-[0.2em]">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}
            className="h-4 w-4 accent-[#7A5A3C]"
          />
          In stock only
        </label>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SKINCARE PAGE
// ---------------------------------------------------------------------------
const EMPTY_FILTERS: FilterState = { categories: [], inStockOnly: false, minPrice: "", maxPrice: "" };

export default function SkincarePage() {
  const products = useSectionProducts("coffee-skin", PRODUCTS);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const categoryOptions = useMemo(
    () => Array.from(new Set([...CATEGORY_OPTIONS, ...products.map((p) => p.category).filter(Boolean)])),
    [products]
  );
  const [sort, setSort] = useState("featured");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { wishedIds: wishlist } = useWishlist();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // TODO: connect this to your own cart (context, store or API).
  // Called whenever a card's quantity changes (quantity 0 = removed from cart).
  const handleCartChange = (item: AddToCartItem) => {
    console.log("Cart change:", item);
  };

  const toggleWish = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const size = product.sizes.find((s) => s.stock > 0) ?? product.sizes[0];
    toggleWishlistItem({
      productId: product.id,
      name: product.name,
      size: size?.label,
      price: size?.price ?? 0,
      mrp: size?.mrp,
      image: product.image,
      category: product.category,
      badge: product.badge || (product.isMostSelling ? "Most Selling" : product.isBestSeller ? "Bestseller" : undefined),
      inStock: !isSoldOut(product),
    });
  };

  const updateFilters = (next: FilterState) => {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  };

  const activeCount =
    filters.categories.length + (filters.inStockOnly ? 1 : 0) + (filters.minPrice || filters.maxPrice ? 1 : 0);

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setQuery("");
    setSort("featured");
    setVisibleCount(PAGE_SIZE);
  };

  // While the mobile filter drawer is open: lock page scroll and close on Escape
  useEffect(() => {
    if (!mobileFiltersOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileFiltersOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileFiltersOpen]);

  // Apply search, filters and sorting
  const filteredProducts = useMemo(() => {
    const min = filters.minPrice ? Number(filters.minPrice) : 0;
    const max = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
    const search = query.trim().toLowerCase();

    const list = products.filter((p) => {
      const price = lowestPrice(p);
      if (filters.inStockOnly && isSoldOut(p)) return false;
      if (price < min || price > max) return false;
      if (filters.categories.length && !filters.categories.includes(p.category)) return false;
      if (search && !`${p.name} ${p.description} ${p.category}`.toLowerCase().includes(search)) return false;
      return true;
    });

    if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "za") list.sort((a, b) => b.name.localeCompare(a.name));
    if (sort === "low") list.sort((a, b) => lowestPrice(a) - lowestPrice(b));
    if (sort === "high") list.sort((a, b) => lowestPrice(b) - lowestPrice(a));
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [products, filters, sort, query]);

  const shownProducts = filteredProducts.slice(0, visibleCount);

  const filterPanel = <FilterPanel categories={categoryOptions} filters={filters} onChange={updateFilters} activeCount={activeCount} onClear={clearAll} />;

  return (
    <div className={`${ubuntu.className} min-h-screen overflow-x-hidden`} style={{ background: CREAM, color: INK }}>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-black text-white">
        <img src={IMAGES.banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 px-4 py-16 text-center sm:px-6 sm:py-20 md:py-28">
          <nav aria-label="Breadcrumb" className="mb-4 text-[11px] uppercase tracking-[0.25em] sm:text-xs">
            <Link href="/" className="transition-colors hover:text-white/70">
              Home
            </Link>
            <span className="mx-2 sm:mx-3" aria-hidden>
              /
            </span>
            <span aria-current="page">Skincare</span>
          </nav>

          <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">Shop All Skincare</h1>
          <p className="mt-3 text-lg sm:text-xl md:text-2xl">Inspired by Nature. Focused on Quality.</p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 md:text-base">
            Imaan’s Online is exploring personal care and cosmetic products inspired by coffee and other selected ingredients, including soaps, facial care, and other personal care essentials. We aim to work with responsible suppliers and manufacturers and prioritise accurate ingredient information, product safety, and applicable regulatory requirements.
          </p>
          <div className="mx-auto mt-6 h-px w-24 bg-white" />
        </div>
      </section>

      {/* ---------- SHOP AREA ---------- */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:pb-20 sm:pt-10">
        {/* Top bar: filter button, count, search, sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ borderColor: LINE }}>
          <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-start sm:gap-5">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] sm:text-sm lg:hidden"
            >
              <SlidersHorizontal aria-hidden className="h-5 w-5" strokeWidth={1.5} />
              Filters{activeCount > 0 && ` (${activeCount})`}
            </button>
            <p aria-live="polite" className="text-[11px] uppercase tracking-[0.15em] sm:text-xs" style={{ color: MUTED }}>
              Showing {shownProducts.length} of {filteredProducts.length} products
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <label
              className="flex w-full items-center gap-2 rounded-md border bg-white px-3 focus-within:border-[#7A5A3C] sm:w-56"
              style={{ borderColor: LINE }}
            >
              <Search aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: MUTED }} />
              <span className="sr-only">Search products</span>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Search skincare..."
                className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none placeholder:text-[#1F1A17]/40"
              />
            </label>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort products"
              className="w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7A5A3C] sm:w-52"
              style={{ borderColor: LINE }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick type chips (phones and tablets) */}
        <div className={`${hideScrollbar} -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 lg:hidden`}>
          {categoryOptions.map((category) => {
            const on = filters.categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  updateFilters({
                    ...filters,
                    categories: on ? filters.categories.filter((c) => c !== category) : [...filters.categories, category],
                  })
                }
                aria-pressed={on}
                className={`shrink-0 cursor-pointer rounded-full border border-[#7A5A3C] px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
                  on
                    ? "bg-[#7A5A3C] text-[#F5EDE0]"
                    : "bg-transparent text-[#7A5A3C] hover:bg-[#7A5A3C] hover:text-[#F5EDE0]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex gap-10">
          {/* Sidebar filters (desktop) */}
          <aside className="sticky top-6 hidden max-h-[calc(100vh-3rem)] w-64 shrink-0 self-start overflow-y-auto pr-2 lg:block">
            {filterPanel}
          </aside>

          {/* Product grid */}
          <div className="min-w-0 flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {shownProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    wished={wishlist.includes(product.id)}
                    onToggleWish={toggleWish}
                    onCartChange={handleCartChange}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center sm:py-20">
                <p className="text-2xl font-medium" style={{ color: BROWN }}>
                  No products found
                </p>
                <p className="mt-2 text-sm" style={{ color: MUTED }}>
                  Try a different search or clear your filters.
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-6 cursor-pointer rounded-lg border border-[#7A5A3C] bg-white px-6 py-2 text-xs font-medium uppercase tracking-widest text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-[#F5EDE0]"
                >
                  Clear filters
                </button>
              </div>
            )}

            {visibleCount < filteredProducts.length && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="cursor-pointer rounded-lg border border-[#7A5A3C] bg-white px-10 py-3 text-xs font-medium uppercase tracking-widest text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-[#F5EDE0]"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- MOBILE FILTER DRAWER ---------- */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />

          <div
            className={`${hideScrollbar} absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto border-r p-6`}
            style={{ borderColor: LINE, background: CREAM, color: INK }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-medium">Filters</h2>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                <X aria-hidden className="h-6 w-6" strokeWidth={1.5} />
              </button>
            </div>

            {filterPanel}

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full cursor-pointer rounded-lg border border-[#7A5A3C] bg-white py-3 text-xs font-medium uppercase tracking-widest text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-[#F5EDE0]"
            >
              Show {filteredProducts.length} products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}