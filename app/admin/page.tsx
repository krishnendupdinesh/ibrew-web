"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ubuntu } from "next/font/google";
import {
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Home,
  Image as ImageIcon,
  KeyRound,
  LogOut,
  Mail,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  type ProductSection,
  type ProductSize,
  type StoreProduct,
  readLocalCatalog,
  removeLocalProduct,
  upsertLocalProduct,
  writeLocalCatalog,
} from "../../lib/productStore";
import {
  type OrderStatus,
  type PaymentStatus,
  type StoreOrder,
  readLocalOrders,
  removeLocalOrder,
  updateLocalOrder,
  writeLocalOrders,
} from "../../lib/orderStore";

// ---------------------------------------------------------------------------
// STYLE TOKENS (same as the other pages)
// ---------------------------------------------------------------------------
const INK = "#1F1A17";
const BROWN = "#7A5A3C";
const PASTEL = "#E9DCC6";
const MUTED = "rgba(31,26,23,0.65)";
const LINE = "rgba(31,26,23,0.15)";
const ERROR = "#B42318";
const SUCCESS = "#1B5E3A";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

// ---------------------------------------------------------------------------
// TYPES
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

type AdminProduct = StoreProduct;

const SECTIONS: {
  value: ProductSection;
  label: string;
  href: string;
  categories: string[];
}[] = [
    {
      value: "coffee",
      label: "Coffee",
      href: "/coffee",
      categories: ["Coffee Powder", "Coffee Beans"],
    },
    {
      value: "coffee-skin",
      label: "Coffee Skincare",
      href: "/coffee-skin",
      categories: ["Soap", "Face Care", "Body Care"],
    },
    {
      value: "spices",
      label: "Spices",
      href: "/spices",
      categories: ["Whole Spices", "Ground Spices", "Spice Blends"],
    },
    {
      value: "fragrances",
      label: "Fragrances",
      href: "/fragrances",
      categories: ["Perfume", "Body Mist", "Attar"],
    },
    {
      value: "importedbed",
      label: "Mattresses & Beds",
      href: "/importedbed",
      categories: ["Memory Foam", "Orthopedic", "Spring", "Accessories"],
    },
    {
      value: "groceries",
      label: "Groceries",
      href: "/groceries",
      categories: ["Fruits & Vegetables", "Dairy & Bakery", "Staples & Grains", "Snacks & Beverages"],
    },
    {
      value: "dates",
      label: "Dates",
      href: "/dates",
      categories: ["Premium Dates", "Dry Dates", "Date Products"],
    },
  ];

const BADGE_PRESETS = [
  "",
  "Most Selling",
  "Bestseller",
  "Top seller",
  "New",
  "Premium",
  "Imported",
  "Fresh",
  "Hot Deal",
];

const TAG_PRESETS = [
  "Most Selling",
  "Bestseller",
  "Top seller",
  "New",
  "Premium",
  "Imported",
  "Fresh",
  "Featured",
  "Organic",
];

const STATUS_OPTIONS: { value: QuoteStatus; label: string; color: string; bg: string }[] = [
  { value: "new", label: "New", color: "#fff", bg: BROWN },
  { value: "contacted", label: "Contacted", color: "#8A4B08", bg: "#FDE8C8" },
  { value: "quoted", label: "Quote sent", color: "#1B5E3A", bg: "#D6F0E0" },
  { value: "closed", label: "Closed", color: "#4B4540", bg: "#E6E2DD" },
];

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string; color: string; bg: string }[] = [
  { value: "pending", label: "Pending Confirmation", color: "#92400E", bg: "#FEF3C7" },
  { value: "confirmed", label: "Confirmed", color: "#1B5E3A", bg: "#D6F0E0" },
  { value: "packed", label: "Packed & Ready", color: "#1E40AF", bg: "#DBEAFE" },
  { value: "shipped", label: "Shipped", color: "#5B21B6", bg: "#EDE9FE" },
  { value: "delivered", label: "Delivered", color: "#fff", bg: "#1B5E3A" },
  { value: "cancelled", label: "Cancelled", color: "#B42318", bg: "#FEE4E2" },
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string; color: string; bg: string }[] = [
  { value: "unpaid", label: "Unpaid / COD Due", color: "#92400E", bg: "#FEF3C7" },
  { value: "paid", label: "Paid", color: "#1B5E3A", bg: "#D6F0E0" },
  { value: "refunded", label: "Refunded", color: "#4B4540", bg: "#E6E2DD" },
];

const statusMeta = (s: QuoteStatus) => STATUS_OPTIONS.find((o) => o.value === s) ?? STATUS_OPTIONS[0];
const orderStatusMeta = (s: OrderStatus) =>
  ORDER_STATUS_OPTIONS.find((o) => o.value === s) ?? ORDER_STATUS_OPTIONS[0];
const paymentStatusMeta = (s: PaymentStatus) =>
  PAYMENT_STATUS_OPTIONS.find((o) => o.value === s) ?? PAYMENT_STATUS_OPTIONS[0];
const sectionMeta = (s: ProductSection) => SECTIONS.find((sec) => sec.value === s) ?? SECTIONS[0];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const formatPrice = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const digits = (s: string) => s.replace(/\D/g, "");
const totalStock = (p: AdminProduct) => p.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
const hasLowStock = (p: AdminProduct) => p.sizes.some((s) => s.stock > 0 && s.stock <= 5);
const isOutOfStock = (p: AdminProduct) => p.sizes.every((s) => s.stock === 0);

// ---------------------------------------------------------------------------
// PRODUCT FORM MODAL (Add / Edit Product, Target Page, Prices, Stock, Images, Tags)
// ---------------------------------------------------------------------------
type SizeDraft = {
  label: string;
  price: string;
  mrp: string;
  stock: string;
};

type ProductModalProps = {
  initial: AdminProduct | null; // null = creating new product
  defaultSection: ProductSection;
  onClose: () => void;
  onSaved: (product: AdminProduct, isNew: boolean) => void;
};

function ProductModal({ initial, defaultSection, onClose, onSaved }: ProductModalProps) {
  const startSection = initial?.section ?? defaultSection;
  const [name, setName] = useState(initial?.name ?? "");
  const [section, setSection] = useState<ProductSection>(startSection);
  const [category, setCategory] = useState(
    initial?.category ?? sectionMeta(startSection).categories[0]
  );
  const [customCategory, setCustomCategory] = useState("");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [isBestSeller, setIsBestSeller] = useState(Boolean(initial?.isBestSeller));
  const [isMostSelling, setIsMostSelling] = useState(Boolean(initial?.isMostSelling));
  const [featuredOnHome, setFeaturedOnHome] = useState(
    initial?.featuredOnHome !== undefined ? Boolean(initial.featuredOnHome) : true
  );
  const [rating, setRating] = useState(String(initial?.rating ?? 4.7));
  const [reviewCount, setReviewCount] = useState(String(initial?.reviewCount ?? 36));
  const [sizes, setSizes] = useState<SizeDraft[]>(
    initial?.sizes?.length
      ? initial.sizes.map((s) => ({
        label: s.label,
        price: String(s.price),
        mrp: s.mrp ? String(s.mrp) : "",
        stock: String(s.stock),
      }))
      : [{ label: "250g", price: "349", mrp: "399", stock: "25" }]
  );

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableCategories = useMemo(() => {
    const base = sectionMeta(section).categories;
    if (initial?.category && !base.includes(initial.category)) {
      return [...base, initial.category];
    }
    return base;
  }, [section, initial]);

  const handleSectionChange = (nextSection: ProductSection) => {
    setSection(nextSection);
    const nextCats = sectionMeta(nextSection).categories;
    setCategory(nextCats[0] ?? "");
    setCustomCategory("");
  };

  // Compress / convert uploaded image file into a clean data URL
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 800;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setImage(dataUrl);
          setFormError("");
        } else {
          setImage(String(reader.result));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const toggleBestSeller = (checked: boolean) => {
    setIsBestSeller(checked);
    if (checked) {
      setTags((prev) => (prev.includes("Bestseller") ? prev : [...prev, "Bestseller"]));
      if (!badge) setBadge("Bestseller");
    } else {
      setTags((prev) => prev.filter((t) => t !== "Bestseller"));
      if (badge === "Bestseller") setBadge(isMostSelling ? "Most Selling" : "");
    }
  };

  const toggleMostSelling = (checked: boolean) => {
    setIsMostSelling(checked);
    if (checked) {
      setTags((prev) => (prev.includes("Most Selling") ? prev : [...prev, "Most Selling"]));
      if (!badge || badge === "Bestseller") setBadge("Most Selling");
    } else {
      setTags((prev) => prev.filter((t) => t !== "Most Selling"));
      if (badge === "Most Selling") setBadge(isBestSeller ? "Bestseller" : "");
    }
  };

  const updateSize = (index: number, key: keyof SizeDraft, value: string) => {
    setSizes((list) => list.map((s, i) => (i === index ? { ...s, [key]: value } : s)));
  };

  const addSizeRow = () => {
    setSizes((list) => [...list, { label: "", price: "", mrp: "", stock: "20" }]);
  };

  const removeSizeRow = (index: number) => {
    if (sizes.length <= 1) return;
    setSizes((list) => list.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const finalCategory = category === "__custom__" ? customCategory.trim() : category.trim();
    if (!name.trim()) {
      setFormError("Please enter a product name.");
      return;
    }
    if (!finalCategory) {
      setFormError("Please select or enter a subcategory.");
      return;
    }

    const parsedSizes: ProductSize[] = sizes
      .map((s) => ({
        label: s.label.trim(),
        price: Number(s.price),
        mrp: s.mrp.trim() && Number(s.mrp) > Number(s.price) ? Number(s.mrp) : undefined,
        stock: Math.max(0, Math.floor(Number(s.stock || 0))),
      }))
      .filter((s) => s.label && !Number.isNaN(s.price) && s.price >= 0);

    if (parsedSizes.length === 0) {
      setFormError("Please provide at least one size/pack with a label and selling price.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        section,
        category: finalCategory,
        detail: detail.trim() || description.trim().slice(0, 60),
        description: description.trim(),
        image: image.trim(),
        badge: badge.trim(),
        tags,
        isBestSeller,
        isMostSelling,
        featuredOnHome,
        rating: Number(rating) || 4.6,
        reviewCount: Number(reviewCount) || 0,
        sizes: parsedSizes,
      };

      const url = initial ? `/api/admin/products/${initial.id}` : "/api/admin/products";
      const method = initial ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not save product.");
      }

      upsertLocalProduct(data.product);
      onSaved(data.product, !initial);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full min-w-0 rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-[#7A5A3C]";

  const currentSecMeta = sectionMeta(section);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Edit product" : "Add new product"}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        style={{ color: INK }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b bg-white px-6 py-4"
          style={{ borderColor: LINE }}
        >
          <div>
            <h2 className="text-lg font-bold sm:text-xl">
              {initial ? `Edit "${initial.name}"` : "Add new product"}
            </h2>
            <p className="text-xs" style={{ color: MUTED }}>
              Will be displayed on the{" "}
              <strong style={{ color: BROWN }}>
                {currentSecMeta.label} page ({currentSecMeta.href})
              </strong>
              {featuredOnHome ? " and Home page" : ""}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-1.5 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-6">
          {formError && (
            <p
              role="alert"
              className="rounded-lg border px-4 py-3 text-sm font-medium"
              style={{ borderColor: ERROR, color: ERROR, background: "#FEF3F2" }}
            >
              {formError}
            </p>
          )}

          {/* 1. Target Page & Basic Details */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: BROWN }}>
              1. Target Store Page & Product Info
            </h3>

            <div>
              <span className="mb-1.5 block text-xs font-medium">
                Select Specific Page to Display Product *
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SECTIONS.map((s) => {
                  const selected = section === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => handleSectionChange(s.value)}
                      className="flex flex-col items-start rounded-xl border px-3 py-2 text-left transition"
                      style={{
                        borderColor: selected ? BROWN : LINE,
                        background: selected ? BROWN : "#fff",
                        color: selected ? "#fff" : INK,
                      }}
                    >
                      <span className="text-xs font-bold">{s.label}</span>
                      <span
                        className="text-[10px]"
                        style={{ color: selected ? "rgba(255,255,255,0.8)" : MUTED }}
                      >
                        {s.href}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic South Indian Filter Coffee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  style={{ borderColor: LINE }}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  Subcategory on {currentSecMeta.label} Page *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                  style={{ borderColor: LINE }}
                >
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__custom__">+ Custom subcategory...</option>
                </select>
                {category === "__custom__" && (
                  <input
                    type="text"
                    placeholder="Enter custom subcategory name"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className={`${inputClass} mt-2`}
                    style={{ borderColor: LINE }}
                  />
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">
                  Short Tagline (shown on homepage product cards)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medium roast, strong aroma"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  className={inputClass}
                  style={{ borderColor: LINE }}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">Full Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the flavour, origin, usage or benefits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                  style={{ borderColor: LINE }}
                />
              </div>
            </div>
          </section>

          {/* 2. Sizes, Prices, MRP & Stock */}
          <section className="border-t pt-5 space-y-3" style={{ borderColor: LINE }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: BROWN }}>
                  2. Sizes, Prices & Stock Inventory
                </h3>
                <p className="text-xs" style={{ color: MUTED }}>
                  Add one or more pack sizes. Set Stock to 0 to mark a size Out of Stock.
                </p>
              </div>
              <button
                type="button"
                onClick={addSizeRow}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#7A5A3C] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add Size / Variant
              </button>
            </div>

            <div className="space-y-2.5">
              {sizes.map((s, idx) => {
                const p = Number(s.price);
                const m = Number(s.mrp);
                const disc = m > p && p > 0 ? Math.round((1 - p / m) * 100) : 0;
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-2 gap-2.5 rounded-xl border p-3 sm:grid-cols-12 sm:items-end"
                    style={{ borderColor: LINE, background: "#FAF7F2" }}
                  >
                    <div className="col-span-2 sm:col-span-4">
                      <label className="mb-1 block text-[11px] font-medium">
                        Size / Pack Label *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 250g, 1kg, 100ml"
                        value={s.label}
                        onChange={(e) => updateSize(idx, "label", e.target.value)}
                        className={inputClass}
                        style={{ borderColor: LINE }}
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-3">
                      <label className="mb-1 block text-[11px] font-medium">
                        Selling Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="349"
                        value={s.price}
                        onChange={(e) => updateSize(idx, "price", e.target.value)}
                        className={inputClass}
                        style={{ borderColor: LINE }}
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="mb-1 flex items-center justify-between text-[11px] font-medium">
                        <span>MRP (₹)</span>
                        {disc > 0 && (
                          <span className="font-bold text-emerald-700">{disc}% off</span>
                        )}
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="399"
                        value={s.mrp}
                        onChange={(e) => updateSize(idx, "mrp", e.target.value)}
                        className={inputClass}
                        style={{ borderColor: LINE }}
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="mb-1 block text-[11px] font-medium">
                        Stock (Units) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="25"
                        value={s.stock}
                        onChange={(e) => updateSize(idx, "stock", e.target.value)}
                        className={inputClass}
                        style={{ borderColor: LINE }}
                      />
                    </div>

                    <div className="col-span-1 flex items-center justify-end sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => removeSizeRow(idx)}
                        disabled={sizes.length <= 1}
                        aria-label="Remove size"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-neutral-500 hover:text-red-600 disabled:opacity-30"
                        style={{ borderColor: LINE }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Product Image (URL or File Upload) */}
          <section className="border-t pt-5 space-y-3" style={{ borderColor: LINE }}>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: BROWN }}>
              3. Product Image
            </h3>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {/* Preview box */}
              <div
                className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
                style={{ borderColor: LINE, background: PASTEL }}
              >
                {image ? (
                  <>
                    <img
                      src={image}
                      alt="Product preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      aria-label="Remove image"
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center p-2">
                    <ImageIcon className="h-6 w-6" style={{ color: BROWN }} />
                    <span className="text-[10px]" style={{ color: MUTED }}>
                      No image
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium">Paste Image URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com/product-photo.jpg"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className={inputClass}
                    style={{ borderColor: LINE }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#7A5A3C] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
                  >
                    <Upload className="h-4 w-4" /> Upload Photo from Device
                  </button>
                  <span className="text-xs" style={{ color: MUTED }}>
                    JPG, PNG, or WEBP (auto-optimised)
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Most Selling, Best Seller & Tags */}
          <section className="border-t pt-5 space-y-4" style={{ borderColor: LINE }}>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: BROWN }}>
                4. Best Seller, Most Selling & Merchandising Tags
              </h3>
              <p className="text-xs" style={{ color: MUTED }}>
                Highlight this item in the Most Selling / Best Sellers sections and add a ribbon badge on its card.
              </p>
            </div>

            {/* Highlight Checkboxes */}
            <div className="grid gap-3 sm:grid-cols-3">
              <label
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition"
                style={{
                  borderColor: isMostSelling ? BROWN : LINE,
                  background: isMostSelling ? "#FAF3E8" : "#fff",
                }}
              >
                <input
                  type="checkbox"
                  checked={isMostSelling}
                  onChange={(e) => toggleMostSelling(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#7A5A3C]"
                />
                <span className="text-xs">
                  <span className="flex items-center gap-1 font-bold text-sm">
                    <Flame className="h-4 w-4 text-amber-600" /> Most Selling
                  </span>
                  <span className="mt-0.5 block" style={{ color: MUTED }}>
                    Marks item as Most Selling & pins to top
                  </span>
                </span>
              </label>

              <label
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition"
                style={{
                  borderColor: isBestSeller ? BROWN : LINE,
                  background: isBestSeller ? "#FAF3E8" : "#fff",
                }}
              >
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => toggleBestSeller(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#7A5A3C]"
                />
                <span className="text-xs">
                  <span className="flex items-center gap-1 font-bold text-sm">
                    <Award className="h-4 w-4 text-[#7A5A3C]" /> Best Seller
                  </span>
                  <span className="mt-0.5 block" style={{ color: MUTED }}>
                    Adds Best Seller tag & features in Bestsellers
                  </span>
                </span>
              </label>

              <label
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition"
                style={{
                  borderColor: featuredOnHome ? BROWN : LINE,
                  background: featuredOnHome ? "#FAF3E8" : "#fff",
                }}
              >
                <input
                  type="checkbox"
                  checked={featuredOnHome}
                  onChange={(e) => setFeaturedOnHome(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#7A5A3C]"
                />
                <span className="text-xs">
                  <span className="flex items-center gap-1 font-bold text-sm">
                    <Home className="h-4 w-4 text-[#7A5A3C]" /> Show on Home
                  </span>
                  <span className="mt-0.5 block" style={{ color: MUTED }}>
                    Displays in the Home page product rails
                  </span>
                </span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Card Ribbon Badge</label>
                <input
                  type="text"
                  list="badge-presets"
                  placeholder="e.g. Most Selling, Bestseller, New"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className={inputClass}
                  style={{ borderColor: LINE }}
                />
                <datalist id="badge-presets">
                  {BADGE_PRESETS.filter(Boolean).map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Star Rating (0 - 5)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className={inputClass}
                  style={{ borderColor: LINE }}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">Review Count</label>
                <input
                  type="number"
                  min={0}
                  value={reviewCount}
                  onChange={(e) => setReviewCount(e.target.value)}
                  className={inputClass}
                  style={{ borderColor: LINE }}
                />
              </div>
            </div>

            {/* Quick Tag Chips */}
            <div>
              <span className="mb-2 block text-xs font-medium">Product Tags (click to toggle)</span>
              <div className="flex flex-wrap gap-2">
                {TAG_PRESETS.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition"
                      style={{
                        borderColor: active ? BROWN : LINE,
                        background: active ? BROWN : "#fff",
                        color: active ? "#fff" : INK,
                      }}
                    >
                      {active && <Check className="h-3 w-3" />}
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Footer Buttons */}
          <div
            className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-white pt-4 pb-1"
            style={{ borderColor: LINE }}
          >
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1F1A17] transition-colors hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#7A5A3C] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1F1A17] disabled:opacity-50"
            >
              {saving ? "Saving..." : initial ? "Save Changes" : `Add to ${currentSecMeta.label} Page`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ADMIN PASSWORD VIEW & RESET MODAL (INSIDE ADMIN DASHBOARD)
// ---------------------------------------------------------------------------
function AdminPasswordModal({
  currentEmail,
  onClose,
  onSuccess,
}: {
  currentEmail: string;
  mustReset?: boolean;
  onClose: () => void;
  onSuccess: (msg: string, updatedEmail?: string) => void;
}) {
  const [username, setUsername] = useState("admin");
  const [email, setEmail] = useState(currentEmail || "admin@ibrew.com");
  const [activePassword, setActivePassword] = useState("Admin@12345");
  const [showCurrentPwd, setShowCurrentPwd] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Reset Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/auth/reset-password", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.credentials) {
          setUsername(data.credentials.username || "admin");
          setEmail(data.credentials.email || "admin@ibrew.com");
          setActivePassword(data.credentials.password || "Admin@12345");
        }
      })
      .catch(() => {});
  }, []);

  const copyText = (label: string, val: string) => {
    navigator.clipboard?.writeText(val);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const inputClass =
    "w-full min-w-0 rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7A5A3C]";

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setErr("New password must be at least 6 characters.");
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setErr("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Could not reset password.");
        setSaving(false);
        return;
      }
      if (data?.credentials?.password) {
        setActivePassword(data.credentials.password);
      } else {
        setActivePassword(newPassword.trim());
      }
      setNewPassword("");
      setConfirmPassword("");
      setSaving(false);
      onSuccess("Your admin password has been updated!", email);
    } catch {
      setErr("Could not reach server. Try again.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Admin Password Management"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        style={{ color: INK }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: LINE }}>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <KeyRound className="h-5 w-5 text-[#7A5A3C]" /> Admin Credentials &amp; Password
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-1 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Admin Credentials Box */}
        <div
          className="mt-4 space-y-2.5 rounded-xl border p-4"
          style={{ borderColor: "#E9DCC6", background: "#FAF7F2" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[#7A5A3C]">
            Current Admin Login Details
          </p>

          <div className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-xs" style={{ borderColor: LINE }}>
            <div>
              <span className="block text-[10px] uppercase" style={{ color: MUTED }}>
                Username
              </span>
              <span className="font-mono text-sm font-bold text-[#1F1A17]">{username}</span>
            </div>
            <button
              type="button"
              onClick={() => copyText("username", username)}
              className="flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-[11px] font-semibold text-[#7A5A3C] hover:bg-[#7A5A3C] hover:text-white"
              style={{ borderColor: LINE }}
            >
              <Copy className="h-3 w-3" />
              {copiedField === "username" ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-xs" style={{ borderColor: LINE }}>
            <div>
              <span className="block text-[10px] uppercase" style={{ color: MUTED }}>
                Admin Email
              </span>
              <span className="font-mono text-sm font-bold text-[#1F1A17]">{email}</span>
            </div>
            <button
              type="button"
              onClick={() => copyText("email", email)}
              className="flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-[11px] font-semibold text-[#7A5A3C] hover:bg-[#7A5A3C] hover:text-white"
              style={{ borderColor: LINE }}
            >
              <Copy className="h-3 w-3" />
              {copiedField === "email" ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-xs" style={{ borderColor: LINE }}>
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] uppercase" style={{ color: MUTED }}>
                Current Password
              </span>
              <span className="font-mono text-sm font-bold text-[#1F1A17]">
                {showCurrentPwd ? activePassword : "••••••••••"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowCurrentPwd((s) => !s)}
                aria-label={showCurrentPwd ? "Hide current password" : "Show current password"}
                className="flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-[11px] font-semibold text-[#1F1A17] hover:bg-neutral-100"
                style={{ borderColor: LINE }}
              >
                {showCurrentPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showCurrentPwd ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={() => copyText("password", activePassword)}
                className="flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-[11px] font-semibold text-[#7A5A3C] hover:bg-[#7A5A3C] hover:text-white"
                style={{ borderColor: LINE }}
              >
                <Copy className="h-3 w-3" />
                {copiedField === "password" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {err && (
          <p
            role="alert"
            className="mt-3 rounded-lg border px-3 py-2 text-xs font-medium"
            style={{ borderColor: ERROR, color: ERROR, background: "#FEF3F2" }}
          >
            {err}
          </p>
        )}

        {/* Reset Admin Password Form */}
        <form onSubmit={handleReset} className="mt-4 space-y-3.5 border-t pt-4" style={{ borderColor: LINE }}>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1F1A17]">
            Reset Admin Password
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium">New Password * (min 6 chars)</label>
            <div className="relative">
              <input
                type={showNewPwd ? "text" : "password"}
                required
                placeholder="Enter new admin password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                style={{ borderColor: LINE }}
              />
              <button
                type="button"
                onClick={() => setShowNewPwd((s) => !s)}
                className="absolute right-0 top-0 flex h-full w-10 cursor-pointer items-center justify-center"
                style={{ color: MUTED }}
              >
                {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Confirm New Password *</label>
            <input
              type={showNewPwd ? "text" : "password"}
              required
              placeholder="Confirm new admin password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              style={{ borderColor: LINE }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-bold uppercase text-[#1F1A17] hover:bg-neutral-100"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-lg bg-[#7A5A3C] px-5 py-2 text-xs font-bold uppercase text-white transition-colors hover:bg-[#1F1A17] disabled:opacity-50"
            >
              {saving ? "Updating..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function printOrderInvoice(order: StoreOrder) {
  if (typeof window === "undefined") return;
  const win = window.open("", "_blank", "width=800,height=700");
  if (!win) return;

  const itemsHtml = order.items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #ddd;">${i + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;"><strong>${item.name}</strong>${item.size ? ` (${item.size})` : ""}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">₹${item.price.toLocaleString("en-IN")}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;"><strong>₹${(item.price * item.quantity).toLocaleString("en-IN")}</strong></td>
      </tr>`
    )
    .join("");

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${order.orderId}</title>
      <style>
        body { font-family: sans-serif; color: #1F1A17; padding: 32px; max-width: 740px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #7A5A3C; padding-bottom: 16px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 99px; background: #F5EDE0; color: #7A5A3C; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        th { background: #F5EDE0; text-align: left; padding: 10px 8px; border-bottom: 2px solid #7A5A3C; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 style="margin:0;color:#7A5A3C;">Imaan's Store (iBrew)</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#555;">Order Invoice &amp; Packing Slip</p>
        </div>
        <div style="text-align:right;">
          <h2 style="margin:0;">${order.orderId}</h2>
          <p style="margin:4px 0;font-size:12px;color:#555;">${new Date(order.createdAt).toLocaleString("en-IN")}</p>
          <span class="badge">${order.status} · ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})</span>
        </div>
      </div>

      <div style="margin-top:20px;display:flex;justify-content:space-between;gap:24px;">
        <div>
          <h4 style="margin:0 0 6px;color:#7A5A3C;text-transform:uppercase;font-size:12px;">Deliver To</h4>
          <p style="margin:0;font-weight:bold;">${order.customer.name}</p>
          <p style="margin:4px 0;font-size:13px;">${order.customer.address}, ${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}</p>
          <p style="margin:4px 0;font-size:13px;">Phone: ${order.customer.phone}</p>
          ${order.customer.email ? `<p style="margin:2px 0;font-size:13px;">Email: ${order.customer.email}</p>` : ""}
          ${order.customer.notes ? `<p style="margin:6px 0 0;font-size:12px;color:#555;"><strong>Notes:</strong> ${order.customer.notes}</p>` : ""}
        </div>
        ${order.trackingNumber ? `
        <div style="text-align:right;">
          <h4 style="margin:0 0 6px;color:#7A5A3C;text-transform:uppercase;font-size:12px;">Shipment Info</h4>
          <p style="margin:0;font-size:13px;">Courier: <strong>${order.courierName || "Standard"}</strong></p>
          <p style="margin:4px 0;font-size:13px;">Tracking #: <strong>${order.trackingNumber}</strong></p>
        </div>` : ""}
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="margin-top:20px;text-align:right;font-size:14px;">
        <p style="margin:4px 0;">Subtotal: <strong>₹${order.subtotal.toLocaleString("en-IN")}</strong></p>
        <p style="margin:4px 0;">Delivery Charges: <strong>${order.shipping === 0 ? "FREE" : "₹" + order.shipping.toLocaleString("en-IN")}</strong></p>
        <p style="margin:8px 0 0;font-size:18px;color:#7A5A3C;">Grand Total: <strong>₹${order.total.toLocaleString("en-IN")}</strong></p>
      </div>
      <script>window.onload = () => { window.print(); };</script>
    </body>
    </html>
  `);
  win.document.close();
}

// ---------------------------------------------------------------------------
// ADMIN DASHBOARD
// ---------------------------------------------------------------------------
export default function AdminPage() {
  const router = useRouter();

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("admin@ibrew.com");
  const [mustResetPassword, setMustResetPassword] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; href?: string; pageLabel?: string } | null>(
    null
  );

  const [tab, setTab] = useState<"orders" | "products" | "quotes" | "customers">("orders");

  // Product filters & modal state
  const [sectionFilter, setSectionFilter] = useState<ProductSection | "all">("all");
  const [productFilter, setProductFilter] = useState<
    "all" | "most-selling" | "bestseller" | "low-stock" | "out-of-stock"
  >("all");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Orders filter & expanded order state
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | "all">("all");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [orderDrafts, setOrderDrafts] = useState<
    Record<string, { trackingNumber: string; courierName: string; adminNotes: string }>
  >({});

  // Quotes filter state
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const showNotice = (text: string, href?: string, pageLabel?: string) => {
    setNotice({ text, href, pageLabel });
    setTimeout(() => setNotice(null), 6000);
  };

  const load = useCallback(async () => {
    setError("");
    const cachedCatalog = readLocalCatalog();
    const cachedOrders = readLocalOrders();

    if (cachedCatalog.length > 0) {
      setProducts((prev) => (prev.length === 0 ? cachedCatalog : prev));
      setLoading(false);
    } else {
      setLoading(true);
    }

    if (cachedOrders.length > 0) {
      setOrders(cachedOrders);
    }

    try {
      const [meRes, pRes, oRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/orders", { cache: "no-store" }).catch(() => null),
      ]);

      const me = await meRes.json();
      if (!me.user || me.user.role !== "admin") {
        router.replace("/login?next=/admin");
        return;
      }
      setAdminName(me.user.name);
      setAdminEmail(me.user.email || "admin@ibrew.com");
      setMustResetPassword(Boolean(me.user.mustResetPassword));

      if (pRes.ok) {
        const fetchedProducts: AdminProduct[] = (await pRes.json()).products || [];
        setProducts(fetchedProducts);
        writeLocalCatalog(fetchedProducts);
      } else if (cachedCatalog.length > 0) {
        setProducts(cachedCatalog);
      }

      if (oRes && oRes.ok) {
        const oData = await oRes.json();
        const serverOrders: StoreOrder[] = Array.isArray(oData.orders) ? oData.orders : [];
        // Merge with local orders so no order placed in this browser is ever lost
        const mergedMap = new Map<string, StoreOrder>();
        for (const o of cachedOrders) mergedMap.set(o.orderId, o);
        for (const o of serverOrders) mergedMap.set(o.orderId || o.id, o);
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(merged);
        writeLocalOrders(merged);
      }

      setLoading(false);

      // Load quotes and customers in parallel without blocking main dashboard
      Promise.all([
        fetch("/api/admin/quotes", { cache: "no-store" }).catch(() => null),
        fetch("/api/admin/users", { cache: "no-store" }).catch(() => null),
      ]).then(async ([qRes, uRes]) => {
        if (qRes && qRes.ok) {
          const qData = await qRes.json();
          setQuotes(qData.quotes || []);
        }
        if (uRes && uRes.ok) {
          const uData = await uRes.json();
          setCustomers(uData.users || []);
        }
      });
    } catch {
      const local = readLocalCatalog();
      if (local.length > 0) {
        setProducts(local);
      } else {
        setError("Could not load the dashboard data. Check your connection and refresh.");
      }
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();

    const syncLocalOrders = () => {
      setOrders(readLocalOrders());
    };
    window.addEventListener("ibrew-orders-updated", syncLocalOrders);
    window.addEventListener("storage", syncLocalOrders);
    return () => {
      window.removeEventListener("ibrew-orders-updated", syncLocalOrders);
      window.removeEventListener("storage", syncLocalOrders);
    };
  }, [load]);

  // ---------- ORDER MANAGEMENT ACTIONS ----------
  const patchOrder = async (
    orderId: string,
    patch: Partial<StoreOrder>,
    successMessage?: string
  ) => {
    const nowIso = new Date().toISOString();
    const enrichedPatch: Partial<StoreOrder> = {
      ...patch,
      ...(patch.status === "confirmed" ? { confirmedAt: nowIso } : {}),
      ...(patch.status === "shipped" ? { shippedAt: nowIso } : {}),
      ...(patch.status === "delivered" ? { deliveredAt: nowIso } : {}),
    };

    const nextLocal = updateLocalOrder(orderId, enrichedPatch);
    setOrders(nextLocal);
    if (successMessage) showNotice(successMessage);

    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrichedPatch),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrders(updateLocalOrder(orderId, data.order));
        }
      }
    } catch {
      // Already saved in local orders store
    }
  };

  const confirmOrder = (order: StoreOrder) => {
    patchOrder(
      order.orderId,
      { status: "confirmed" },
      `Order ${order.orderId} confirmed for ${order.customer.name}!`
    );
  };

  const deleteOrder = async (order: StoreOrder) => {
    if (!window.confirm(`Delete order "${order.orderId}" for ${order.customer.name}?`)) return;
    const next = removeLocalOrder(order.orderId);
    setOrders(next);
    showNotice(`Deleted order ${order.orderId}.`);
    fetch(`/api/admin/orders/${encodeURIComponent(order.orderId)}`, {
      method: "DELETE",
    }).catch(() => {});
  };

  const getOrderDraft = (order: StoreOrder) =>
    orderDrafts[order.orderId] ?? {
      trackingNumber: order.trackingNumber || "",
      courierName: order.courierName || "",
      adminNotes: order.adminNotes || "",
    };

  const setOrderDraftField = (
    order: StoreOrder,
    field: "trackingNumber" | "courierName" | "adminNotes",
    value: string
  ) => {
    const current = getOrderDraft(order);
    setOrderDrafts((prev) => ({
      ...prev,
      [order.orderId]: {
        ...current,
        [field]: value,
      },
    }));
  };

  // ---------- PRODUCT ACTIONS ----------
  const quickPatchProduct = async (
    id: string,
    patch: Partial<
      Pick<AdminProduct, "isBestSeller" | "isMostSelling" | "featuredOnHome" | "badge" | "sizes">
    >,
    successMsg?: string
  ) => {
    const previous = products;
    const optimisticList = products.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setProducts(optimisticList);
    writeLocalCatalog(optimisticList);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts((list) => {
        const next = list.map((p) => (p.id === id ? data.product : p));
        writeLocalCatalog(next);
        return next;
      });
      if (successMsg) showNotice(successMsg);
    } catch {
      setProducts(previous);
      writeLocalCatalog(previous);
      setError("Could not save product change. Try again.");
    }
  };

  const adjustVariantStock = (product: AdminProduct, sizeIndex: number, nextStock: number) => {
    const clamped = Math.max(0, Math.floor(nextStock));
    const nextSizes = product.sizes.map((s, idx) =>
      idx === sizeIndex ? { ...s, stock: clamped } : s
    );
    quickPatchProduct(product.id, { sizes: nextSizes });
  };

  const deleteProduct = async (product: AdminProduct) => {
    if (!window.confirm(`Delete "${product.name}" from the catalog?`)) return;
    const previous = products;
    const next = products.filter((p) => p.id !== product.id);
    setProducts(next);
    removeLocalProduct(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showNotice(`Deleted "${product.name}".`);
    } catch {
      setProducts(previous);
      writeLocalCatalog(previous);
      setError("Could not delete the product.");
    }
  };

  const handleProductSaved = (saved: AdminProduct, isNew: boolean) => {
    setProducts((list) => {
      const next = isNew ? [saved, ...list] : list.map((p) => (p.id === saved.id ? saved : p));
      writeLocalCatalog(next);
      return next;
    });
    setModalOpen(false);
    setEditingProduct(null);
    const sec = sectionMeta(saved.section);
    showNotice(
      isNew
        ? `Added "${saved.name}" to the ${sec.label} page!`
        : `Updated "${saved.name}" on the ${sec.label} page!`,
      sec.href,
      sec.label
    );
  };

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
      setQuotes(previous);
      setError("Could not update the status. Try again.");
    }
  };

  const logout = async () => {
    try {
      window.sessionStorage.removeItem("ibrew_auth_user");
      window.localStorage.removeItem("ibrew_auth_user");
      window.dispatchEvent(new Event("ibrew-auth-changed"));
    } catch {
      // ignore
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const stats = useMemo(
    () => ({
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      orderRevenue: orders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0),
      totalProducts: products.length,
      lowOrOut: products.filter((p) => isOutOfStock(p) || hasLowStock(p)).length,
      bestAndMostSelling: products.filter((p) => p.isBestSeller || p.isMostSelling).length,
      totalQuotes: quotes.length,
      freshQuotes: quotes.filter((q) => q.status === "new").length,
      customers: customers.filter((c) => c.role === "customer").length,
    }),
    [orders, products, quotes, customers]
  );

  const visibleOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
      if (!search) return true;
      const haystack = [
        o.orderId,
        o.customer.name,
        o.customer.phone,
        o.customer.email,
        o.customer.address,
        o.customer.city,
        o.customer.pincode,
        o.trackingNumber,
        ...o.items.map((i) => i.name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [orders, orderStatusFilter, query]);

  const visibleProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter((p) => {
      if (sectionFilter !== "all" && p.section !== sectionFilter) return false;
      if (productFilter === "most-selling" && !p.isMostSelling) return false;
      if (productFilter === "bestseller" && !p.isBestSeller) return false;
      if (productFilter === "low-stock" && !hasLowStock(p)) return false;
      if (productFilter === "out-of-stock" && !isOutOfStock(p)) return false;

      if (!search) return true;
      const haystack = [
        p.name,
        p.section,
        p.category,
        p.badge,
        p.description,
        ...(p.tags || []),
        ...p.sizes.map((s) => s.label),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [products, sectionFilter, productFilter, query]);

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
    return customers.filter(
      (c) => !search || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(search)
    );
  }, [customers, query]);

  const statCards = [
    {
      label: "Total Orders",
      value: stats.totalOrders,
      sub: `${stats.pendingOrders} pending · ${formatPrice(stats.orderRevenue)} revenue`,
    },
    {
      label: "Total Products",
      value: stats.totalProducts,
      sub: `${stats.lowOrOut} low / out of stock`,
    },
    {
      label: "Best & Most Selling",
      value: stats.bestAndMostSelling,
      sub: "Tagged as top items",
    },
    {
      label: "Bulk Quotes & Users",
      value: stats.totalQuotes,
      sub: `${stats.freshQuotes} new quotes · ${stats.customers} customers`,
    },
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
                Signed in as {adminName} ({adminEmail})
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#7A5A3C] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#1F1A17] active:scale-95"
            >
              <Plus aria-hidden className="h-4 w-4" /> Add product
            </button>

            <button
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#7A5A3C] bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
            >
              <KeyRound aria-hidden className="h-3.5 w-3.5" /> Admin Password
            </button>

            <Link
              href="/"
              className="rounded-lg border border-[#7A5A3C] bg-white px-4 py-2 text-xs font-medium uppercase tracking-widest text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-[#F5EDE0]"
            >
              View site
            </Link>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              aria-label="Refresh data"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border bg-white hover:bg-neutral-100 disabled:opacity-50"
              style={{ borderColor: LINE }}
            >
              <RefreshCw aria-hidden className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-medium uppercase tracking-widest text-[#1F1A17] transition-colors hover:bg-neutral-100"
            >
              <LogOut aria-hidden className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-md border bg-white px-4 py-3 text-sm"
            style={{ borderColor: ERROR, color: ERROR }}
          >
            {error}
          </p>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 text-sm font-medium"
            style={{ borderColor: SUCCESS, color: SUCCESS }}
          >
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" /> {notice.text}
            </span>
            {notice.href && (
              <Link
                href={notice.href}
                className="inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
                style={{ background: SUCCESS }}
              >
                Open {notice.pageLabel} Page ({notice.href}) <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}

        {/* ---------- STATS ---------- */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4" style={{ borderColor: LINE }}>
              <p className="text-xs" style={{ color: MUTED }}>
                {s.label}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{loading ? "-" : s.value}</p>
              <p className="mt-1 text-[11px]" style={{ color: MUTED }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ---------- TABS + SEARCH ---------- */}
        <div
          className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b pb-4"
          style={{ borderColor: LINE }}
        >
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Dashboard sections">
            {(
              [
                {
                  id: "orders",
                  label: `Orders (${orders.length})${stats.pendingOrders > 0 ? ` · ${stats.pendingOrders} New` : ""}`,
                  Icon: ShoppingBag,
                },
                { id: "products", label: `Products & Stock (${products.length})`, Icon: Package },
                { id: "quotes", label: `Quotation requests (${quotes.length})`, Icon: FileText },
                { id: "customers", label: `Customers (${customers.length})`, Icon: Users },
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
                  className={`flex cursor-pointer items-center gap-2 rounded-full border border-[#7A5A3C] px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
                    on
                      ? "bg-[#7A5A3C] text-white"
                      : "bg-transparent text-[#7A5A3C] hover:bg-[#7A5A3C] hover:text-white"
                  }`}
                >
                  <Icon aria-hidden className="h-4 w-4" /> {label}
                </button>
              );
            })}
          </div>

          <label
            className="flex w-full items-center gap-2 rounded-md border bg-white px-3 focus-within:border-[#7A5A3C] sm:w-80"
            style={{ borderColor: LINE }}
          >
            <Search aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: MUTED }} />
            <span className="sr-only">Search</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === "orders"
                  ? "Search order ID, customer, phone, item..."
                  : tab === "products"
                    ? "Search product, category, tag, size..."
                    : tab === "quotes"
                      ? "Search name, email, reference, item..."
                      : "Search name, email, phone..."
              }
              className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none placeholder:text-[#1F1A17]/40"
            />
          </label>
        </div>

        {/* ---------- ORDERS MANAGEMENT TAB ---------- */}
        {tab === "orders" && (
          <section className="mt-5 space-y-4" role="tabpanel">
            {/* Status filter pills */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {(["all", ...ORDER_STATUS_OPTIONS.map((o) => o.value)] as const).map((s) => {
                  const on = orderStatusFilter === s;
                  const count =
                    s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setOrderStatusFilter(s)}
                      className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        on
                          ? "border-[#1F1A17] bg-[#1F1A17] text-white"
                          : "border-[#E9DCC6] bg-white text-[#1F1A17] hover:border-[#7A5A3C] hover:text-[#7A5A3C]"
                      }`}
                    >
                      {s === "all" ? "All Orders" : orderStatusMeta(s).label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {visibleOrders.length === 0 ? (
              <div className="rounded-xl border bg-white py-14 text-center" style={{ borderColor: LINE }}>
                <ShoppingBag className="mx-auto h-10 w-10 text-[#7A5A3C]/60" />
                <p className="mt-3 text-lg font-medium" style={{ color: BROWN }}>
                  {orders.length === 0 ? "No customer orders yet" : "No orders match your filter"}
                </p>
                <p className="mt-1 text-sm" style={{ color: MUTED }}>
                  {orders.length === 0
                    ? "When customers place an order on the store, it will appear here immediately for confirmation and dispatch."
                    : "Try selecting 'All Orders' or clearing the search box."}
                </p>
              </div>
            ) : (
              <ul className="space-y-3.5">
                {visibleOrders.map((order) => {
                  const open = openOrderId === order.orderId;
                  const sMeta = orderStatusMeta(order.status);
                  const pMeta = paymentStatusMeta(order.paymentStatus);
                  const totalUnits = order.items.reduce((sum, i) => sum + i.quantity, 0);
                  const draft = getOrderDraft(order);

                  const whatsappText = [
                    `Hello ${order.customer.name}, greetings from Imaan's Store (iBrew)!`,
                    `Your order *${order.orderId}* is currently *${sMeta.label.toUpperCase()}*.`,
                    "",
                    "Items:",
                    ...order.items.map(
                      (i) => `• ${i.name}${i.size ? ` (${i.size})` : ""} × ${i.quantity} = ₹${(i.price * i.quantity).toLocaleString("en-IN")}`
                    ),
                    `Total: ₹${order.total.toLocaleString("en-IN")} (${order.paymentMethod.toUpperCase()})`,
                    order.trackingNumber
                      ? `Tracking: ${order.courierName ? order.courierName + " - " : ""}${order.trackingNumber}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join("\n");

                  return (
                    <li
                      key={order.orderId}
                      className="overflow-hidden rounded-2xl border bg-white shadow-xs transition hover:border-[#7A5A3C]/50"
                      style={{ borderColor: LINE }}
                    >
                      {/* Order Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
                        <button
                          type="button"
                          onClick={() => setOpenOrderId(open ? null : order.orderId)}
                          aria-expanded={open}
                          className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-[#1F1A17]">
                                {order.orderId}
                              </span>
                              <span
                                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                                style={{ background: sMeta.bg, color: sMeta.color }}
                              >
                                {sMeta.label}
                              </span>
                              <span
                                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                style={{ background: pMeta.bg, color: pMeta.color }}
                              >
                                {order.paymentMethod.toUpperCase()} · {pMeta.label}
                              </span>
                            </div>

                            <p className="mt-1 text-sm font-medium text-[#1F1A17]">
                              {order.customer.name} ·{" "}
                              <span className="font-normal text-[#1F1A17]/70">
                                {order.customer.phone} · {order.customer.city} ({order.customer.pincode})
                              </span>
                            </p>

                            <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                              {formatDate(order.createdAt)} · {totalUnits}{" "}
                              {totalUnits === 1 ? "item" : "items"} ·{" "}
                              <strong className="text-[#7A5A3C]">{formatPrice(order.total)}</strong>
                            </p>
                          </div>
                        </button>

                        {/* Quick Actions on Order Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {order.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => confirmOrder(order)}
                              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1B5E3A] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#14472C]"
                            >
                              <CheckCircle2 className="h-4 w-4" /> Confirm Order
                            </button>
                          )}

                          {order.status === "confirmed" && (
                            <button
                              type="button"
                              onClick={() =>
                                patchOrder(
                                  order.orderId,
                                  { status: "packed" },
                                  `Marked ${order.orderId} as Packed & Ready!`
                                )
                              }
                              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#7A5A3C] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1F1A17]"
                            >
                              <Package className="h-4 w-4" /> Mark Packed
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setOpenOrderId(open ? null : order.orderId)}
                            className="flex cursor-pointer items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-[#1F1A17] transition-colors hover:bg-neutral-100"
                          >
                            {open ? "Hide Details" : "Manage Order"}
                            <ChevronDown
                              className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Order Details & Full Management Controls */}
                      {open && (
                        <div
                          className="border-t bg-[#FAF7F2]/60 px-4 pb-5 pt-4 sm:px-5"
                          style={{ borderColor: LINE }}
                        >
                          <div className="grid gap-6 lg:grid-cols-12">
                            {/* 1. Ordered Items & Totals (7 cols) */}
                            <div className="space-y-3 lg:col-span-7">
                              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#7A5A3C]">
                                Ordered Products ({totalUnits})
                              </h3>

                              <div
                                className="divide-y rounded-xl border bg-white"
                                style={{ borderColor: LINE }}
                              >
                                {order.items.map((item, idx) => (
                                  <div
                                    key={item.productId + idx}
                                    className="flex items-center justify-between gap-3 p-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#E9DCC6] bg-[#FAF7F2]">
                                        {item.image ? (
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-full items-center justify-center">
                                            <Package className="h-5 w-5 text-[#7A5A3C]/50" />
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-[#1F1A17]">
                                          {item.name}
                                        </p>
                                        <p className="text-xs" style={{ color: MUTED }}>
                                          {item.size ? `Size: ${item.size} · ` : ""}
                                          Qty: <strong>{item.quantity}</strong> ×{" "}
                                          {formatPrice(item.price)}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-sm font-bold text-[#1F1A17]">
                                      {formatPrice(item.price * item.quantity)}
                                    </p>
                                  </div>
                                ))}

                                <div className="space-y-1 bg-[#FAF7F2] p-3 text-xs">
                                  <div className="flex justify-between">
                                    <span style={{ color: MUTED }}>Items Subtotal</span>
                                    <span className="font-semibold">{formatPrice(order.subtotal)}</span>
                                  </div>
                                  {order.savings > 0 && (
                                    <div className="flex justify-between text-[#1B5E3A]">
                                      <span>MRP Discount Saved</span>
                                      <span className="font-semibold">
                                        −{formatPrice(order.savings)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span style={{ color: MUTED }}>Delivery Charges</span>
                                    <span className="font-semibold">
                                      {order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-t border-[#E9DCC6] pt-1.5 text-sm font-bold text-[#1F1A17]">
                                    <span>Grand Total</span>
                                    <span className="text-[#7A5A3C]">{formatPrice(order.total)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Customer Shipping Address Card */}
                              <div
                                className="rounded-xl border bg-white p-4"
                                style={{ borderColor: LINE }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-[#7A5A3C]">
                                    Customer &amp; Delivery Address
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const fullAddr = `${order.customer.name}, ${order.customer.phone}, ${order.customer.address}, ${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}`;
                                      navigator.clipboard?.writeText(fullAddr);
                                      showNotice("Copied shipping address to clipboard!");
                                    }}
                                    className="inline-flex cursor-pointer items-center gap-1 rounded border border-[#E9DCC6] bg-[#FAF7F2] px-2.5 py-1 text-[11px] font-semibold text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
                                  >
                                    <Copy className="h-3 w-3" /> Copy Address
                                  </button>
                                </div>

                                <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                                  <div>
                                    <p className="font-bold text-sm text-[#1F1A17]">
                                      {order.customer.name}
                                    </p>
                                    <p className="mt-0.5 text-[#1F1A17]/80">
                                      {order.customer.address}
                                    </p>
                                    <p className="text-[#1F1A17]/80">
                                      {order.customer.city}, {order.customer.state} -{" "}
                                      <strong>{order.customer.pincode}</strong>
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p>
                                      <span style={{ color: MUTED }}>Phone:</span>{" "}
                                      <strong>{order.customer.phone}</strong>
                                    </p>
                                    {order.customer.email && (
                                      <p>
                                        <span style={{ color: MUTED }}>Email:</span>{" "}
                                        {order.customer.email}
                                      </p>
                                    )}
                                    <p>
                                      <span style={{ color: MUTED }}>Payment:</span>{" "}
                                      <strong className="uppercase">{order.paymentMethod}</strong>
                                    </p>
                                    {order.customer.notes && (
                                      <p className="rounded bg-[#FAF3E8] p-2 text-[#7A5A3C]">
                                        <strong>Customer Note:</strong> {order.customer.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 2. Order Status, Payment, Tracking & Notifications (5 cols) */}
                            <div className="space-y-4 lg:col-span-5">
                              <div
                                className="rounded-xl border bg-white p-4 space-y-4"
                                style={{ borderColor: LINE }}
                              >
                                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#7A5A3C]">
                                  Order Confirmation &amp; Fulfillment
                                </h3>

                                {/* Quick Confirm / Status Progression Buttons */}
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => confirmOrder(order)}
                                    disabled={order.status === "confirmed"}
                                    className="flex-1 cursor-pointer rounded-lg bg-[#1B5E3A] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#14472C] disabled:opacity-40"
                                  >
                                    ✓ Confirm Order
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      patchOrder(
                                        order.orderId,
                                        { status: "delivered", paymentStatus: "paid" },
                                        `Order ${order.orderId} marked as Delivered & Paid!`
                                      )
                                    }
                                    disabled={order.status === "delivered"}
                                    className="flex-1 cursor-pointer rounded-lg bg-[#7A5A3C] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1F1A17] disabled:opacity-40"
                                  >
                                    Mark Delivered
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                      Order Status
                                    </label>
                                    <select
                                      value={order.status}
                                      onChange={(e) =>
                                        patchOrder(
                                          order.orderId,
                                          { status: e.target.value as OrderStatus },
                                          `Updated ${order.orderId} status to ${e.target.value}`
                                        )
                                      }
                                      className="w-full rounded-lg border bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#7A5A3C]"
                                      style={{ borderColor: LINE }}
                                    >
                                      {ORDER_STATUS_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                          {o.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="mb-1 block text-xs font-semibold">
                                      Payment Status
                                    </label>
                                    <select
                                      value={order.paymentStatus}
                                      onChange={(e) =>
                                        patchOrder(
                                          order.orderId,
                                          { paymentStatus: e.target.value as PaymentStatus },
                                          `Updated ${order.orderId} payment to ${e.target.value}`
                                        )
                                      }
                                      className="w-full rounded-lg border bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#7A5A3C]"
                                      style={{ borderColor: LINE }}
                                    >
                                      {PAYMENT_STATUS_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                          {o.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Courier & Tracking Details */}
                                <div className="border-t pt-3 space-y-2.5" style={{ borderColor: LINE }}>
                                  <p className="text-xs font-semibold text-[#1F1A17]">
                                    Dispatch &amp; Tracking Info
                                  </p>
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <input
                                      type="text"
                                      placeholder="Courier (e.g. Delhivery, BlueDart)"
                                      value={draft.courierName}
                                      onChange={(e) =>
                                        setOrderDraftField(order, "courierName", e.target.value)
                                      }
                                      className="rounded-lg border bg-[#FAF7F2] px-3 py-2 text-xs outline-none focus:border-[#7A5A3C] focus:bg-white"
                                      style={{ borderColor: LINE }}
                                    />
                                    <input
                                      type="text"
                                      placeholder="Tracking / AWB Number"
                                      value={draft.trackingNumber}
                                      onChange={(e) =>
                                        setOrderDraftField(order, "trackingNumber", e.target.value)
                                      }
                                      className="rounded-lg border bg-[#FAF7F2] px-3 py-2 text-xs outline-none focus:border-[#7A5A3C] focus:bg-white"
                                      style={{ borderColor: LINE }}
                                    />
                                  </div>
                                  <textarea
                                    rows={2}
                                    placeholder="Internal admin notes (packing details, special handling...)"
                                    value={draft.adminNotes}
                                    onChange={(e) =>
                                      setOrderDraftField(order, "adminNotes", e.target.value)
                                    }
                                    className="w-full rounded-lg border bg-[#FAF7F2] px-3 py-2 text-xs outline-none focus:border-[#7A5A3C] focus:bg-white"
                                    style={{ borderColor: LINE }}
                                  />
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        patchOrder(
                                          order.orderId,
                                          {
                                            courierName: draft.courierName,
                                            trackingNumber: draft.trackingNumber,
                                            adminNotes: draft.adminNotes,
                                            ...(draft.trackingNumber && order.status === "pending"
                                              ? { status: "shipped" as OrderStatus }
                                              : {}),
                                          },
                                          `Saved tracking & notes for ${order.orderId}!`
                                        )
                                      }
                                      className="cursor-pointer rounded-lg border border-[#7A5A3C] bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
                                    >
                                      Save Tracking &amp; Notes
                                    </button>
                                    {draft.trackingNumber && order.status !== "shipped" && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          patchOrder(
                                            order.orderId,
                                            {
                                              courierName: draft.courierName,
                                              trackingNumber: draft.trackingNumber,
                                              adminNotes: draft.adminNotes,
                                              status: "shipped",
                                            },
                                            `Marked ${order.orderId} as Shipped!`
                                          )
                                        }
                                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#5B21B6] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#4C1D95]"
                                      >
                                        <Truck className="h-3.5 w-3.5" /> Ship Order
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Customer Communication & Invoice */}
                                <div className="border-t pt-3 flex flex-wrap items-center gap-2" style={{ borderColor: LINE }}>
                                  {digits(order.customer.phone).length >= 8 && (
                                    <a
                                      href={`https://wa.me/${digits(order.customer.phone)}?text=${encodeURIComponent(whatsappText)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#7A5A3C] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Customer
                                    </a>
                                  )}

                                  {order.customer.email && (
                                    <a
                                      href={`mailto:${order.customer.email}?subject=${encodeURIComponent(`Order Update: ${order.orderId}`)}&body=${encodeURIComponent(whatsappText)}`}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#7A5A3C] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
                                    >
                                      <Mail className="h-3.5 w-3.5" /> Email
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => printOrderInvoice(order)}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1F1A17] transition-colors hover:bg-neutral-100"
                                  >
                                    <Printer className="h-3.5 w-3.5" /> Print Invoice
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => deleteOrder(order)}
                                    aria-label={`Delete order ${order.orderId}`}
                                    className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </button>
                                </div>
                              </div>
                            </div>
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

        {/* ---------- PRODUCTS & INVENTORY TAB ---------- */}
        {tab === "products" && (
          <section className="mt-5 space-y-4" role="tabpanel">
            {/* Section filter pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSectionFilter("all")}
                  className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition"
                  style={{
                    borderColor: sectionFilter === "all" ? INK : LINE,
                    background: sectionFilter === "all" ? INK : "#fff",
                    color: sectionFilter === "all" ? "#fff" : INK,
                  }}
                >
                  All Pages ({products.length})
                </button>
                {SECTIONS.map((s) => {
                  const count = products.filter((p) => p.section === s.value).length;
                  const on = sectionFilter === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSectionFilter(s.value)}
                      className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition"
                      style={{
                        borderColor: on ? INK : LINE,
                        background: on ? INK : "#fff",
                        color: on ? "#fff" : INK,
                      }}
                    >
                      {s.label} ({count})
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setModalOpen(true);
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#7A5A3C] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1F1A17]"
              >
                <Plus className="h-4 w-4" />
                {sectionFilter === "all"
                  ? "Add New Product"
                  : `Add to ${sectionMeta(sectionFilter).label}`}
              </button>
            </div>

            {/* Tag / Stock quick filters */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "all", label: "All Items" },
                  {
                    id: "most-selling",
                    label: `Most Selling (${products.filter((p) => p.isMostSelling).length})`,
                  },
                  {
                    id: "bestseller",
                    label: `Best Sellers (${products.filter((p) => p.isBestSeller).length})`,
                  },
                  {
                    id: "low-stock",
                    label: `Low Stock ≤5 (${products.filter((p) => hasLowStock(p)).length})`,
                  },
                  {
                    id: "out-of-stock",
                    label: `Out of Stock (${products.filter((p) => isOutOfStock(p)).length})`,
                  },
                ] as const
              ).map((f) => {
                const on = productFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setProductFilter(f.id)}
                    className="cursor-pointer rounded-lg border px-3 py-1 text-xs font-medium transition"
                    style={{
                      borderColor: on ? BROWN : LINE,
                      background: on ? "#FAF3E8" : "#fff",
                      color: on ? BROWN : MUTED,
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <p className="py-12 text-center text-sm" style={{ color: MUTED }}>
                Loading products &amp; inventory...
              </p>
            ) : visibleProducts.length === 0 ? (
              <div className="rounded-xl border bg-white py-14 text-center" style={{ borderColor: LINE }}>
                <p className="text-lg font-medium" style={{ color: BROWN }}>
                  No products match this view
                </p>
                <p className="mt-1 text-sm" style={{ color: MUTED }}>
                  Add a new product or clear your filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setModalOpen(true);
                  }}
                  className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#7A5A3C] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1F1A17]"
                >
                  <Plus className="h-4 w-4" /> Add Product
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleProducts.map((p) => {
                  const sec = sectionMeta(p.section);
                  const soldOut = isOutOfStock(p);
                  const low = hasLowStock(p);
                  const units = totalStock(p);

                  return (
                    <article
                      key={p.id}
                      className="flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition hover:border-[#7A5A3C]/50"
                      style={{ borderColor: LINE }}
                    >
                      <div>
                        {/* Top row: Image + Title + Edit/Delete */}
                        <div className="flex items-start gap-4">
                          <div
                            className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
                            style={{ borderColor: LINE, background: PASTEL }}
                          >
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span
                                className="px-1 text-center text-[10px] font-bold uppercase"
                                style={{ color: BROWN }}
                              >
                                No photo
                              </span>
                            )}
                            {p.badge && (
                              <span
                                className="absolute left-0 top-0 rounded-br-md px-1.5 py-0.5 text-[9px] font-bold uppercase text-white"
                                style={{ background: BROWN }}
                              >
                                {p.badge}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Link
                                href={sec.href}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                                style={{ background: PASTEL, color: BROWN }}
                                title={`Open ${sec.label} page (${sec.href})`}
                              >
                                {sec.label} ({sec.href}) <ExternalLink className="h-2.5 w-2.5" />
                              </Link>
                              <span
                                className="rounded-md border px-2 py-0.5 text-[10px] font-medium"
                                style={{ borderColor: LINE, color: MUTED }}
                              >
                                {p.category}
                              </span>
                              <span
                                className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                                style={
                                  soldOut
                                    ? { background: "#FEE4E2", color: ERROR }
                                    : low
                                      ? { background: "#FEF0C7", color: "#B54708" }
                                      : { background: "#D6F0E0", color: SUCCESS }
                                }
                              >
                                {soldOut
                                  ? "Out of Stock"
                                  : low
                                    ? `Low Stock (${units} left)`
                                    : `${units} in stock`}
                              </span>
                            </div>

                            <h3 className="mt-1.5 truncate text-base font-bold">{p.name}</h3>
                            {p.description && (
                              <p
                                className="mt-0.5 line-clamp-1 text-xs"
                                style={{ color: MUTED }}
                              >
                                {p.description}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(p);
                                setModalOpen(true);
                              }}
                              aria-label={`Edit ${p.name}`}
                              className="flex cursor-pointer items-center gap-1 rounded-lg border border-[#7A5A3C] bg-white px-2.5 py-1.5 text-xs font-bold text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProduct(p)}
                              aria-label={`Delete ${p.name}`}
                              className="cursor-pointer rounded-lg border p-1.5 text-neutral-500 transition hover:border-red-600 hover:text-red-600"
                              style={{ borderColor: LINE }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Quick Merchandising & Tag Controls */}
                        <div
                          className="mt-3 flex flex-wrap items-center gap-2 border-y py-2.5"
                          style={{ borderColor: LINE }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              quickPatchProduct(
                                p.id,
                                { isMostSelling: !p.isMostSelling },
                                `${p.name}: Most Selling ${!p.isMostSelling ? "enabled" : "removed"}`
                              )
                            }
                            aria-pressed={p.isMostSelling}
                            className="flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition"
                            style={{
                              borderColor: p.isMostSelling ? "#D97706" : LINE,
                              background: p.isMostSelling ? "#FEF3C7" : "#fff",
                              color: p.isMostSelling ? "#92400E" : MUTED,
                            }}
                          >
                            <Flame className="h-3.5 w-3.5" />
                            Most Selling
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              quickPatchProduct(
                                p.id,
                                { isBestSeller: !p.isBestSeller },
                                `${p.name}: Best Seller ${!p.isBestSeller ? "enabled" : "removed"}`
                              )
                            }
                            aria-pressed={p.isBestSeller}
                            className="flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition"
                            style={{
                              borderColor: p.isBestSeller ? BROWN : LINE,
                              background: p.isBestSeller ? BROWN : "#fff",
                              color: p.isBestSeller ? "#fff" : MUTED,
                            }}
                          >
                            <Award className="h-3.5 w-3.5" />
                            Bestseller
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              quickPatchProduct(
                                p.id,
                                { featuredOnHome: !p.featuredOnHome },
                                `${p.name}: Home display ${!p.featuredOnHome ? "enabled" : "hidden"}`
                              )
                            }
                            aria-pressed={p.featuredOnHome}
                            className="flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
                            style={{
                              borderColor: p.featuredOnHome ? INK : LINE,
                              background: p.featuredOnHome ? "#F5EDE0" : "#fff",
                              color: p.featuredOnHome ? INK : MUTED,
                            }}
                          >
                            <Sparkles className="h-3 w-3" />
                            On Home
                          </button>

                          <label className="ml-auto flex items-center gap-1.5 text-[11px]" style={{ color: MUTED }}>
                            <Tag className="h-3 w-3" /> Badge:
                            <select
                              value={p.badge || ""}
                              onChange={(e) =>
                                quickPatchProduct(
                                  p.id,
                                  { badge: e.target.value },
                                  `Updated badge for ${p.name}`
                                )
                              }
                              className="rounded border bg-white px-2 py-0.5 text-[11px] font-semibold outline-none"
                              style={{ borderColor: LINE, color: INK }}
                            >
                              {BADGE_PRESETS.map((b) => (
                                <option key={b || "none"} value={b}>
                                  {b || "None"}
                                </option>
                              ))}
                              {p.badge && !BADGE_PRESETS.includes(p.badge) && (
                                <option value={p.badge}>{p.badge}</option>
                              )}
                            </select>
                          </label>
                        </div>

                        {/* Sizes, Prices & Quick Stock Adjuster */}
                        <div className="mt-3 space-y-1.5">
                          <div
                            className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: MUTED }}
                          >
                            <span>Size / Variant &amp; Price</span>
                            <span>Quick Stock Control</span>
                          </div>
                          {p.sizes.map((s, idx) => (
                            <div
                              key={s.label + idx}
                              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs"
                              style={{ borderColor: LINE, background: "#FAF7F2" }}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold">{s.label}</span>
                                <span className="font-bold" style={{ color: BROWN }}>
                                  {formatPrice(s.price)}
                                </span>
                                {s.mrp && s.mrp > s.price && (
                                  <span className="text-[11px] line-through" style={{ color: MUTED }}>
                                    {formatPrice(s.mrp)}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => adjustVariantStock(p, idx, s.stock - 1)}
                                  disabled={s.stock <= 0}
                                  aria-label={`Decrease stock for ${p.name} ${s.label}`}
                                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border bg-white disabled:opacity-30"
                                  style={{ borderColor: LINE }}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span
                                  className="min-w-[3.5rem] text-center font-bold tabular-nums"
                                  style={{
                                    color:
                                      s.stock === 0
                                        ? ERROR
                                        : s.stock <= 5
                                          ? "#B54708"
                                          : INK,
                                  }}
                                >
                                  {s.stock === 0 ? "0 (Out)" : s.stock}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => adjustVariantStock(p, idx, s.stock + 1)}
                                  aria-label={`Increase stock for ${p.name} ${s.label}`}
                                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border bg-white"
                                  style={{ borderColor: LINE }}
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

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
                    className="cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors"
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
                        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
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
                              className="flex items-center gap-2 rounded-lg border border-[#7A5A3C] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
                            >
                              <Mail aria-hidden className="h-4 w-4" /> Reply by email
                            </a>
                            {digits(q.contact.phone).length >= 8 && (
                              <a
                                href={`https://wa.me/${digits(q.contact.phone)}?text=${encodeURIComponent(message)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg border border-[#7A5A3C] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#7A5A3C] transition-colors hover:bg-[#7A5A3C] hover:text-white"
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

      {/* ---------- ADD / EDIT PRODUCT MODAL ---------- */}
      {modalOpen && (
        <ProductModal
          initial={editingProduct}
          defaultSection={sectionFilter === "all" ? "coffee" : sectionFilter}
          onClose={() => {
            setModalOpen(false);
            setEditingProduct(null);
          }}
          onSaved={handleProductSaved}
        />
      )}

      {/* ---------- ADMIN PASSWORD SETUP & RESET MODAL ---------- */}
      {passwordModalOpen && (
        <AdminPasswordModal
          currentEmail={adminEmail}
          mustReset={mustResetPassword}
          onClose={() => setPasswordModalOpen(false)}
          onSuccess={(msg, updatedEmail) => {
            setPasswordModalOpen(false);
            setMustResetPassword(false);
            if (updatedEmail) setAdminEmail(updatedEmail);
            showNotice(msg);
          }}
        />
      )}
    </div>
  );
}
