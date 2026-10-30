"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Ubuntu } from "next/font/google";
import {
  ChevronDown,
  Droplets,
  Heart,
  Leaf,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  type LucideIcon,
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
  banner: "https://plus.unsplash.com/premium_photo-1676208748373-a31d5af9f752?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
  medjool: "https://your-image-url.com/medjool-dates.jpg",
  ajwa: "https://your-image-url.com/ajwa-dates.jpg",
  kimia: "https://your-image-url.com/kimia-dates.jpg",
  dryDates: "https://your-image-url.com/dry-dates.jpg",
  dateSyrup: "https://your-image-url.com/date-syrup.jpg",
  datePaste: "https://your-image-url.com/date-paste.jpg",
};

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type ProductSize = {
  label: string; // e.g. "250g"
  price: number;
  mrp?: number; // original price, shown struck through
  stock: number; // units available (0 = out of stock)
};

type Product = {
  id: string;
  name: string;
  category: "Premium Dates" | "Dry Dates" | "Date Products";
  description: string;
  rating: number; // 0 to 5
  reviewCount: number;
  badge?: string;
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
    id: "medjool-dates",
    name: "Medjool Dates",
    category: "Premium Dates",
    description: "Large, soft and caramel-like dates. Naturally sweet and perfect for snacking.",
    rating: 4.8,
    reviewCount: 142,
    badge: "Bestseller",
    image: IMAGES.medjool,
    sizes: [
      { label: "250g", price: 399, mrp: 449, stock: 24 },
      { label: "500g", price: 749, mrp: 849, stock: 12 },
      { label: "1kg", price: 1399, mrp: 1599, stock: 4 },
    ],
  },
  {
    id: "ajwa-dates",
    name: "Ajwa Dates",
    category: "Premium Dates",
    description: "Dark, soft and rich dates from Madinah. Prized for their unique taste and tradition.",
    rating: 4.9,
    reviewCount: 96,
    badge: "Premium",
    image: IMAGES.ajwa,
    sizes: [
      { label: "250g", price: 599, stock: 30 },
      { label: "500g", price: 1099, mrp: 1249, stock: 18 },
      { label: "1kg", price: 2049, mrp: 2399, stock: 0 },
    ],
  },
  {
    id: "kimia-dates",
    name: "Kimia Dates",
    category: "Premium Dates",
    description: "Soft, juicy and moist dates with a mild honey-like sweetness. Great for the whole family.",
    rating: 4.5,
    reviewCount: 64,
    badge: "New",
    image: IMAGES.kimia,
    sizes: [
      { label: "250g", price: 249, stock: 15 },
      { label: "500g", price: 449, mrp: 499, stock: 3 },
    ],
  },
  {
    id: "dry-dates",
    name: "Dry Dates (Kharek)",
    category: "Dry Dates",
    description: "Hard, chewy dried dates with a rich flavour. Ideal for festive sweets and milk.",
    rating: 4.4,
    reviewCount: 52,
    badge: "Top seller",
    image: IMAGES.dryDates,
    sizes: [
      { label: "250g", price: 179, stock: 40 },
      { label: "500g", price: 329, mrp: 369, stock: 20 },
      { label: "1kg", price: 599, mrp: 699, stock: 10 },
    ],
  },
  {
    id: "date-syrup",
    name: "Pure Date Syrup",
    category: "Date Products",
    description: "100% natural syrup made from ripe dates. A healthy swap for sugar and honey.",
    rating: 4.3,
    reviewCount: 41,
    image: IMAGES.dateSyrup,
    sizes: [
      { label: "250ml", price: 249, stock: 22 },
      { label: "500ml", price: 449, mrp: 499, stock: 9 },
    ],
  },
  {
    id: "date-paste",
    name: "Seedless Date Paste",
    category: "Date Products",
    description: "Smooth, seedless paste made from soft dates. Great for baking, smoothies and desserts.",
    rating: 4.6,
    reviewCount: 33,
    image: IMAGES.datePaste,
    sizes: [
      { label: "250g", price: 229, stock: 0 },
      { label: "500g", price: 419, mrp: 469, stock: 0 },
    ],
  },
];

const CATEGORY_OPTIONS = ["Premium Dates", "Dry Dates", "Date Products"];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "az", label: "Alphabetically, A-Z" },
  { value: "za", label: "Alphabetically, Z-A" },
  { value: "low", label: "Price, low to high" },
  { value: "high", label: "Price, high to low" },
  { value: "rating", label: "Top rated" },
];

// const FEATURES: { title: string; text: string; Icon: LucideIcon }[] = [
//   { title: "Naturally Sweet", text: "Wholesome sweetness for your daily ritual.", Icon: Leaf },
//   { title: "Quality Selection", text: "Carefully sourced, freshly packed.", Icon: Sparkles },
//   { title: "Everyday Essentials", text: "Dates and date-based products for every kitchen.", Icon: Droplets },
// ];

const PAGE_SIZE = 6;

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

  const [sizeIndex, setSizeIndex] = useState(firstAvailable);
  const [quantity, setQuantity] = useState(0); // 0 = show the ADD button

  const size = product.sizes[sizeIndex];
  const outOfStock = size.stock === 0;
  const lowStock = !outOfStock && size.stock <= 5;
  const discount = size.mrp ? Math.round((1 - size.price / size.mrp) * 100) : 0;

  const updateQuantity = (newQuantity: number, sizeToUse: ProductSize = size) => {
    setQuantity(newQuantity);
    onCartChange({
      productId: product.id,
      name: product.name,
      size: sizeToUse.label,
      price: sizeToUse.price,
      quantity: newQuantity,
      image: product.image,
    });
  };

  // Changing the size removes the old size from the cart
  const chooseSize = (index: number) => {
    if (quantity > 0) updateQuantity(0);
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

        {(product.badge || discount > 0) && !outOfStock && (
          <span
            className="absolute left-0 top-0 rounded-br-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ background: BROWN }}
          >
            {discount > 0 ? `${discount}% off` : product.badge}
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

        {!outOfStock && quantity === 0 && (
          <button
            type="button"
            onClick={() => updateQuantity(1)}
            className="h-9 min-w-[72px] rounded-lg border px-4 text-sm font-bold uppercase transition active:scale-95"
            style={{ borderColor: BROWN, background: "#FFFFFF", color: BROWN }}
          >
            Add
          </button>
        )}

        {!outOfStock && quantity > 0 && (
          <div
            className="flex h-9 min-w-[72px] items-center justify-between rounded-lg text-white"
            style={{ background: BROWN }}
          >
            <button
              type="button"
              onClick={() => updateQuantity(quantity - 1)}
              aria-label={`Decrease quantity of ${product.name}`}
              className="px-2 py-2"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-4 text-center text-sm font-bold tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(quantity + 1)}
              disabled={quantity >= size.stock}
              aria-label={`Increase quantity of ${product.name}`}
              className="px-2 py-2 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
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
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  activeCount: number;
  onClear: () => void;
};

function FilterPanel({ filters, onChange, activeCount, onClear }: FilterPanelProps) {
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
          {CATEGORY_OPTIONS.map((category) => (
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
// DATES PAGE
// ---------------------------------------------------------------------------
const EMPTY_FILTERS: FilterState = { categories: [], inStockOnly: false, minPrice: "", maxPrice: "" };

export default function DatesPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState("featured");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // TODO: connect this to your own cart (context, store or API).
  // Called whenever a card's quantity changes (quantity 0 = removed from cart).
  const handleCartChange = (item: AddToCartItem) => {
    console.log("Cart change:", item);
  };

  const toggleWish = (id: string) => {
    setWishlist((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
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

    const list = PRODUCTS.filter((p) => {
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
  }, [filters, sort, query]);

  const shownProducts = filteredProducts.slice(0, visibleCount);

  const filterPanel = <FilterPanel filters={filters} onChange={updateFilters} activeCount={activeCount} onClear={clearAll} />;

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
            <span aria-current="page">Dates</span>
          </nav>

          <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">Shop All Dates</h1>
          <p className="mt-3 text-lg sm:text-xl md:text-2xl">Naturally sweet, naturally good.</p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 md:text-base">
            Explore soft premium dates, chewy dry dates and date-based essentials like syrup and paste. Find your
            favourite variety and make every day a little sweeter.
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
                placeholder="Search dates..."
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
          {CATEGORY_OPTIONS.map((category) => {
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
                className="shrink-0 rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition-colors"
                style={{
                  borderColor: BROWN,
                  background: on ? BROWN : "transparent",
                  color: on ? CREAM : BROWN,
                }}
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
                  className="mt-6 rounded-lg border px-6 py-2 text-xs uppercase tracking-widest transition-colors hover:bg-[#7A5A3C] hover:text-[#F5EDE0]"
                  style={{ borderColor: BROWN, color: BROWN }}
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
                  className="rounded-lg border px-10 py-3 text-xs uppercase tracking-widest transition-colors hover:bg-[#7A5A3C] hover:text-[#F5EDE0]"
                  style={{ borderColor: BROWN, color: BROWN }}
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      {/* <section className="border-y py-12 sm:py-16" style={{ borderColor: LINE, background: PASTEL }}>
        <div className="mx-auto grid max-w-4xl gap-8 px-6 sm:grid-cols-3 sm:gap-10">
          {FEATURES.map(({ title, text, Icon }) => (
            <div key={title} className="text-center">
              <Icon aria-hidden className="mx-auto h-9 w-9" strokeWidth={1.2} style={{ color: BROWN }} />
              <h2 className="mt-4 text-xl font-medium">{title}</h2>
              <p className="mt-2 text-sm leading-6" style={{ color: MUTED }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </section> */}

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
              className="mt-6 w-full rounded-lg border py-3 text-xs uppercase tracking-widest transition-colors hover:bg-[#7A5A3C] hover:text-[#F5EDE0]"
              style={{ borderColor: BROWN, color: BROWN }}
            >
              Show {filteredProducts.length} products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}