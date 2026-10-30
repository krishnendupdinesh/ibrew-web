"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Ubuntu } from "next/font/google";
import {
  BedDouble,
  Check,
  Coffee,
  Cookie,
  Droplets,
  FileText,
  Flame,
  Flower2,
  Mail,
  Minus,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShoppingBasket,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// STYLE TOKENS (same as the Spices page)
// ---------------------------------------------------------------------------
const INK = "#1F1A17";
const CREAM = "#FFFFFF";
const PASTEL = "#E9DCC6";
const BROWN = "#7A5A3C";
const MUTED = "rgba(31,26,23,0.65)";
const LINE = "rgba(31,26,23,0.15)";
const ERROR = "#B42318";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const hideScrollbar = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

// ---------------------------------------------------------------------------
// CONTACT DETAILS - used by the "send another way" buttons if the form fails
// ---------------------------------------------------------------------------
const CONTACT_EMAIL = "sales@yourwebsite.com"; // TODO: your sales email
const WHATSAPP_NUMBER = "919999999999"; // TODO: country code + number, no "+" or spaces

// ---------------------------------------------------------------------------
// IMAGE URLS - paste your own image links here
// ---------------------------------------------------------------------------
const IMAGES = {
  banner: "https://images.unsplash.com/photo-1700165644892-3dd6b67b25bc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",

  arabicaCoffee: "https://your-image-url.com/arabica-coffee-powder.jpg",
  instantCoffee: "https://your-image-url.com/instant-coffee.jpg",
  chicoryCoffee: "https://your-image-url.com/chicory-coffee.jpg",

  faceScrub: "https://your-image-url.com/coffee-face-scrub.jpg",
  bodyScrub: "https://your-image-url.com/coffee-body-scrub.jpg",
  eyeCream: "https://your-image-url.com/coffee-eye-cream.jpg",

  oudAttar: "https://your-image-url.com/oud-attar.jpg",
  perfume: "https://your-image-url.com/eau-de-parfum.jpg",
  bakhoor: "https://your-image-url.com/bakhoor.jpg",

  queenBed: "https://your-image-url.com/queen-bed.jpg",
  kingBed: "https://your-image-url.com/king-bed.jpg",
  storageBed: "https://your-image-url.com/storage-bed.jpg",

  medjool: "https://your-image-url.com/medjool-dates.jpg",
  ajwa: "https://your-image-url.com/ajwa-dates.jpg",
  sukkari: "https://your-image-url.com/sukkari-dates.jpg",

  basmati: "https://your-image-url.com/basmati-rice.jpg",
  toorDal: "https://your-image-url.com/toor-dal.jpg",
  sugar: "https://your-image-url.com/sugar.jpg",
  tea: "https://your-image-url.com/tea-leaves.jpg",

  turmeric: "https://your-image-url.com/turmeric-powder.jpg",
  blackPepper: "https://your-image-url.com/black-pepper.jpg",
  cardamom: "https://your-image-url.com/cardamom.jpg",
};

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
const CATEGORIES = [
  "Coffee Powder",
  "Coffee Skin Care",
  "Fragrances",
  "Imported Beds",
  "Dates",
  "Groceries",
  "Spices",
] as const;

type Category = (typeof CATEGORIES)[number];

type BulkItem = {
  id: string;
  name: string;
  category: Category;
  description: string;
  unit: string; // kg, pcs, boxes...
  moq: number; // minimum order quantity
  step: number; // how much +/- changes the quantity
  image: string;
};

type QuoteState = Record<string, number>; // item id -> quantity

type ContactForm = {
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  timeline: string;
  notes: string;
};

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  "Coffee Powder": Coffee,
  "Coffee Skin Care": Droplets,
  Fragrances: Flower2,
  "Imported Beds": BedDouble,
  Dates: Cookie,
  Groceries: ShoppingBasket,
  Spices: Flame,
};

// ---------------------------------------------------------------------------
// BULK ITEMS (replace with your own range, MOQs and descriptions)
// ---------------------------------------------------------------------------
const ITEMS: BulkItem[] = [
  // Coffee powder
  {
    id: "arabica-coffee",
    name: "Arabica Filter Coffee Powder",
    category: "Coffee Powder",
    description: "Medium-roast ground arabica with a smooth, rounded body. Suited to cafes, hotels and gifting.",
    unit: "kg",
    moq: 10,
    step: 5,
    image: IMAGES.arabicaCoffee,
  },
  {
    id: "instant-coffee",
    name: "Instant Coffee Powder",
    category: "Coffee Powder",
    description: "Spray-dried instant coffee that dissolves quickly in hot or cold milk and water.",
    unit: "kg",
    moq: 5,
    step: 5,
    image: IMAGES.instantCoffee,
  },
  {
    id: "chicory-coffee",
    name: "Coffee and Chicory Blend",
    category: "Coffee Powder",
    description: "Classic South Indian style blend with a strong, bitter-sweet cup.",
    unit: "kg",
    moq: 10,
    step: 5,
    image: IMAGES.chicoryCoffee,
  },

  // Coffee skin care
  {
    id: "coffee-face-scrub",
    name: "Coffee Face Scrub",
    category: "Coffee Skin Care",
    description: "Gentle exfoliating scrub made with fine coffee grounds. Available for retail and private label.",
    unit: "pcs",
    moq: 24,
    step: 12,
    image: IMAGES.faceScrub,
  },
  {
    id: "coffee-body-scrub",
    name: "Coffee Body Scrub",
    category: "Coffee Skin Care",
    description: "Coarser body scrub that smooths skin and leaves a light coffee aroma.",
    unit: "pcs",
    moq: 24,
    step: 12,
    image: IMAGES.bodyScrub,
  },
  {
    id: "coffee-eye-cream",
    name: "Coffee Under-Eye Cream",
    category: "Coffee Skin Care",
    description: "Lightweight cream with caffeine for the delicate skin under the eyes.",
    unit: "pcs",
    moq: 24,
    step: 12,
    image: IMAGES.eyeCream,
  },

  // Fragrances
  {
    id: "oud-attar",
    name: "Oud Attar (Alcohol-Free)",
    category: "Fragrances",
    description: "Long-lasting oil-based perfume in a roll-on bottle. Woody, warm and deep.",
    unit: "pcs",
    moq: 24,
    step: 12,
    image: IMAGES.oudAttar,
  },
  {
    id: "eau-de-parfum",
    name: "Imported Eau de Parfum",
    category: "Fragrances",
    description: "Boxed spray perfumes in assorted men's and women's scents.",
    unit: "pcs",
    moq: 24,
    step: 12,
    image: IMAGES.perfume,
  },
  {
    id: "bakhoor",
    name: "Bakhoor and Incense",
    category: "Fragrances",
    description: "Scented wood chips and incense tablets for home and gifting.",
    unit: "boxes",
    moq: 24,
    step: 12,
    image: IMAGES.bakhoor,
  },

  // Imported beds
  {
    id: "queen-bed",
    name: "Queen Size Bed",
    category: "Imported Beds",
    description: "Upholstered imported bed frame with a solid headboard. Frame only, mattress on request.",
    unit: "pcs",
    moq: 2,
    step: 1,
    image: IMAGES.queenBed,
  },
  {
    id: "king-bed",
    name: "King Size Bed",
    category: "Imported Beds",
    description: "Wide king frame for hotels, resorts and furnished apartments.",
    unit: "pcs",
    moq: 2,
    step: 1,
    image: IMAGES.kingBed,
  },
  {
    id: "storage-bed",
    name: "Hydraulic Storage Bed",
    category: "Imported Beds",
    description: "Lift-up bed with a full storage base. Good for compact rooms.",
    unit: "pcs",
    moq: 2,
    step: 1,
    image: IMAGES.storageBed,
  },

  // Dates
  {
    id: "medjool-dates",
    name: "Medjool Dates",
    category: "Dates",
    description: "Large, soft and caramel-like dates. Packed in 5 kg boxes.",
    unit: "kg",
    moq: 10,
    step: 5,
    image: IMAGES.medjool,
  },
  {
    id: "ajwa-dates",
    name: "Ajwa Dates",
    category: "Dates",
    description: "Dark, soft dates from Madinah. A popular choice for gifting and Ramadan.",
    unit: "kg",
    moq: 5,
    step: 5,
    image: IMAGES.ajwa,
  },
  {
    id: "sukkari-dates",
    name: "Sukkari Dates",
    category: "Dates",
    description: "Golden, crisp-soft dates with a naturally sweet, honey-like taste.",
    unit: "kg",
    moq: 10,
    step: 5,
    image: IMAGES.sukkari,
  },

  // Groceries
  {
    id: "basmati-rice",
    name: "Basmati Rice",
    category: "Groceries",
    description: "Aged long-grain basmati that cooks fluffy and separate. 25 kg bags.",
    unit: "kg",
    moq: 100,
    step: 25,
    image: IMAGES.basmati,
  },
  {
    id: "toor-dal",
    name: "Toor Dal",
    category: "Groceries",
    description: "Polished split pigeon peas, cleaned and graded. 25 kg bags.",
    unit: "kg",
    moq: 100,
    step: 25,
    image: IMAGES.toorDal,
  },
  {
    id: "sugar",
    name: "Refined Sugar",
    category: "Groceries",
    description: "Fine white sugar for bakeries, caterers and retail repacking.",
    unit: "kg",
    moq: 100,
    step: 50,
    image: IMAGES.sugar,
  },
  {
    id: "tea-leaves",
    name: "CTC Tea Leaves",
    category: "Groceries",
    description: "Strong, bright-liquor Assam CTC tea for chai stalls and hotels.",
    unit: "kg",
    moq: 20,
    step: 10,
    image: IMAGES.tea,
  },

  // Spices
  {
    id: "turmeric-powder",
    name: "Turmeric Powder",
    category: "Spices",
    description: "Bright golden haldi with high curcumin content.",
    unit: "kg",
    moq: 10,
    step: 5,
    image: IMAGES.turmeric,
  },
  {
    id: "black-pepper",
    name: "Black Pepper Whole",
    category: "Spices",
    description: "Bold, pungent peppercorns from the Malabar coast.",
    unit: "kg",
    moq: 5,
    step: 5,
    image: IMAGES.blackPepper,
  },
  {
    id: "cardamom",
    name: "Green Cardamom",
    category: "Spices",
    description: "Plump, aromatic pods sorted by size. Ideal for sweets, tea and masala blends.",
    unit: "kg",
    moq: 5,
    step: 5,
    image: IMAGES.cardamom,
  },
];

const TIMELINE_OPTIONS = ["As soon as possible", "Within 2 weeks", "Within 1 month", "Just checking prices"];

const EMPTY_FORM: ContactForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  city: "",
  timeline: TIMELINE_OPTIONS[0],
  notes: "",
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const itemById = (id: string) => ITEMS.find((i) => i.id === id);

// Image that falls back to a category icon tile if the URL is missing or fails
function ItemImage({ item, className }: { item: BulkItem; className?: string }) {
  const [failed, setFailed] = useState(false);
  const Icon = CATEGORY_ICONS[item.category];

  if (!item.image || failed) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
        style={{ background: PASTEL }}
      >
        <Icon aria-hidden className="h-8 w-8" strokeWidth={1.3} style={{ color: BROWN }} />
        <span className="text-sm font-medium leading-tight">{item.name}</span>
        <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: MUTED }}>
          Photo coming soon
        </span>
      </div>
    );
  }

  return <img src={item.image} alt={item.name} loading="lazy" onError={() => setFailed(true)} className={className} />;
}

// Small square thumbnail used inside the quote summary
function Thumb({ item }: { item: BulkItem }) {
  const [failed, setFailed] = useState(false);
  const Icon = CATEGORY_ICONS[item.category];

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-white" style={{ borderColor: LINE }}>
      {!item.image || failed ? (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: PASTEL }}>
          <Icon aria-hidden className="h-5 w-5" strokeWidth={1.3} style={{ color: BROWN }} />
        </div>
      ) : (
        <img
          src={item.image}
          alt={item.name}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-contain p-1"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ITEM CARD
// ---------------------------------------------------------------------------
type ItemCardProps = {
  item: BulkItem;
  quantity: number;
  onSetQuantity: (id: string, quantity: number) => void; // 0 = remove
};

function ItemCard({ item, quantity, onSetQuantity }: ItemCardProps) {
  const added = quantity > 0;

  const decrease = () => {
    const next = quantity - item.step;
    onSetQuantity(item.id, next < item.moq ? 0 : next);
  };

  const typeQuantity = (raw: string) => {
    if (raw === "") return;
    const n = Math.floor(Number(raw));
    if (Number.isNaN(n)) return;
    onSetQuantity(item.id, Math.max(item.moq, n));
  };

  return (
    <article
      className="flex min-w-0 flex-col rounded-xl border bg-white p-3"
      style={{ borderColor: added ? BROWN : LINE }}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
        <ItemImage item={item} className="absolute inset-0 h-full w-full object-contain p-2" />
        {added && (
          <span
            className="absolute left-0 top-0 flex items-center gap-1 rounded-br-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ background: BROWN }}
          >
            <Check aria-hidden className="h-3 w-3" /> In quote
          </span>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-[2.5em] text-sm font-medium leading-5">{item.name}</h3>
      <p className="mt-1 line-clamp-3 min-h-[3.75em] text-xs leading-5" style={{ color: MUTED }}>
        {item.description}
      </p>

      <p className="mt-2 text-xs font-medium" style={{ color: BROWN }}>
        Minimum order: {item.moq} {item.unit}
      </p>

      <div className="mt-auto pt-3">
        {!added ? (
          <button
            type="button"
            onClick={() => onSetQuantity(item.id, item.moq)}
            className="h-10 w-full rounded-lg border px-4 text-sm font-bold uppercase transition active:scale-95"
            style={{ borderColor: BROWN, background: "#FFFFFF", color: BROWN }}
          >
            Add to quote
          </button>
        ) : (
          <div className="flex h-10 items-center justify-between rounded-lg text-white" style={{ background: BROWN }}>
            <button
              type="button"
              onClick={decrease}
              aria-label={`Decrease quantity of ${item.name}`}
              className="h-full px-3"
            >
              <Minus aria-hidden className="h-4 w-4" />
            </button>

            <label className="flex items-center gap-1 text-sm font-bold">
              <span className="sr-only">Quantity of {item.name}</span>
              <input
                type="number"
                min={item.moq}
                inputMode="numeric"
                value={quantity}
                onChange={(e) => typeQuantity(e.target.value)}
                className="w-14 bg-transparent text-center tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-xs font-medium">{item.unit}</span>
            </label>

            <button
              type="button"
              onClick={() => onSetQuantity(item.id, quantity + item.step)}
              aria-label={`Increase quantity of ${item.name}`}
              className="h-full px-3"
            >
              <Plus aria-hidden className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// QUOTE MODAL (review items, enter contact details, send)
// ---------------------------------------------------------------------------
type QuoteModalProps = {
  quote: QuoteState;
  onSetQuantity: (id: string, quantity: number) => void;
  onClose: () => void;
  onSent: () => void; // clears the quote list after a successful send
};

type Status = "idle" | "sending" | "sent" | "error";

function QuoteModal({ quote, onSetQuantity, onClose, onSent }: QuoteModalProps) {
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [reference, setReference] = useState("");

  const lines = Object.entries(quote)
    .map(([id, quantity]) => ({ item: itemById(id), quantity }))
    .filter((l): l is { item: BulkItem; quantity: number } => Boolean(l.item) && l.quantity > 0);

  // Lock page scroll and close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const setField = (key: keyof ContactForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof ContactForm, string>> = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (form.phone.replace(/\D/g, "").length < 8) next.phone = "Enter a phone number with at least 8 digits.";
    if (lines.length === 0 && !form.notes.trim()) next.notes = "Add items above, or describe what you need here.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Plain-text version of the request, used for the WhatsApp and email fallbacks
  const buildMessage = () => {
    const itemLines = lines.length
      ? lines.map((l, i) => `${i + 1}. ${l.item.name} (${l.item.category}) - ${l.quantity} ${l.item.unit}`).join("\n")
      : "No items selected (see notes)";
    return [
      "Bulk quotation request",
      "",
      itemLines,
      "",
      `Name: ${form.name}`,
      form.company && `Company: ${form.company}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      form.city && `City: ${form.city}`,
      `Needed: ${form.timeline}`,
      form.notes && `Notes: ${form.notes}`,
    ]
      .filter((l) => l !== false && l !== "")
      .join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending" || !validate()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: form,
          items: lines.map((l) => ({
            id: l.item.id,
            name: l.item.name,
            category: l.item.category,
            quantity: l.quantity,
            unit: l.item.unit,
          })),
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { reference?: string };
      setReference(data.reference ?? "");
      setStatus("sent");
      onSent();
    } catch {
      setStatus("error");
    }
  };

  const inputClass =
    "w-full min-w-0 rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7A5A3C]";

  const fieldError = (key: keyof ContactForm) =>
    errors[key] ? (
      <p id={`err-${key}`} className="mt-1 text-xs" style={{ color: ERROR }}>
        {errors[key]}
      </p>
    ) : null;

  const errorProps = (key: keyof ContactForm) => ({
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `err-${key}` : undefined,
    style: { borderColor: errors[key] ? ERROR : LINE },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Request quotation">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className={`${hideScrollbar} relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl`}
        style={{ color: INK }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4" style={{ borderColor: LINE }}>
          <h2 className="text-xl font-medium">{status === "sent" ? "Request sent" : "Request quotation"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-neutral-100">
            <X aria-hidden className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </div>

        {status === "sent" ? (
          <div className="px-5 py-12 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white"
              style={{ background: BROWN }}
            >
              <Check aria-hidden className="h-7 w-7" />
            </div>
            <p className="mt-5 text-lg font-medium">Thank you, we have your request.</p>
            {reference && (
              <p className="mt-1 text-sm" style={{ color: MUTED }}>
                Reference: <span className="font-bold" style={{ color: INK }}>{reference}</span>
              </p>
            )}
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6" style={{ color: MUTED }}>
              Our team will send you a quotation by email within one working day.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 rounded-lg border px-8 py-3 text-xs uppercase tracking-widest transition-colors hover:bg-[#7A5A3C] hover:text-[#F5EDE0]"
              style={{ borderColor: BROWN, color: BROWN }}
            >
              Back to products
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="px-5 pb-6">
            {/* Items in the request */}
            <section className="py-5">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-[0.2em]">
                Items ({lines.length})
              </h3>

              {lines.length === 0 ? (
                <p className="rounded-lg border border-dashed px-4 py-5 text-sm" style={{ borderColor: LINE, color: MUTED }}>
                  No items selected yet. Close this window and tap “Add to quote” on any product, or describe your
                  requirement in the notes below.
                </p>
              ) : (
                <ul className="divide-y rounded-lg border" style={{ borderColor: LINE }}>
                  {lines.map(({ item, quantity }) => (
                    <li key={item.id} className="flex items-center gap-3 p-3" style={{ borderColor: LINE }}>
                      <Thumb item={item} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="text-xs" style={{ color: MUTED }}>
                          {item.category} · min {item.moq} {item.unit}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const next = quantity - item.step;
                            onSetQuantity(item.id, next < item.moq ? 0 : next);
                          }}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md border"
                          style={{ borderColor: LINE }}
                        >
                          <Minus aria-hidden className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[4.5rem] text-center text-sm font-bold tabular-nums">
                          {quantity} {item.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSetQuantity(item.id, quantity + item.step)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md border"
                          style={{ borderColor: LINE }}
                        >
                          <Plus aria-hidden className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSetQuantity(item.id, 0)}
                        aria-label={`Remove ${item.name}`}
                        className="rounded-md p-2 hover:bg-neutral-100"
                        style={{ color: MUTED }}
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Contact details */}
            <section className="border-t py-5" style={{ borderColor: LINE }}>
              <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.2em]">Your details</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="q-name" className="mb-1 block text-xs font-medium">
                    Full name *
                  </label>
                  <input
                    id="q-name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className={inputClass}
                    {...errorProps("name")}
                  />
                  {fieldError("name")}
                </div>

                <div>
                  <label htmlFor="q-company" className="mb-1 block text-xs font-medium">
                    Company (optional)
                  </label>
                  <input
                    id="q-company"
                    type="text"
                    autoComplete="organization"
                    value={form.company}
                    onChange={(e) => setField("company", e.target.value)}
                    className={inputClass}
                    style={{ borderColor: LINE }}
                  />
                </div>

                <div>
                  <label htmlFor="q-email" className="mb-1 block text-xs font-medium">
                    Email *
                  </label>
                  <input
                    id="q-email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className={inputClass}
                    {...errorProps("email")}
                  />
                  {fieldError("email")}
                </div>

                <div>
                  <label htmlFor="q-phone" className="mb-1 block text-xs font-medium">
                    Phone / WhatsApp *
                  </label>
                  <input
                    id="q-phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className={inputClass}
                    {...errorProps("phone")}
                  />
                  {fieldError("phone")}
                </div>

                <div>
                  <label htmlFor="q-city" className="mb-1 block text-xs font-medium">
                    Delivery city (optional)
                  </label>
                  <input
                    id="q-city"
                    type="text"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    className={inputClass}
                    style={{ borderColor: LINE }}
                  />
                </div>

                <div>
                  <label htmlFor="q-timeline" className="mb-1 block text-xs font-medium">
                    When do you need it?
                  </label>
                  <select
                    id="q-timeline"
                    value={form.timeline}
                    onChange={(e) => setField("timeline", e.target.value)}
                    className={inputClass}
                    style={{ borderColor: LINE }}
                  >
                    {TIMELINE_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="q-notes" className="mb-1 block text-xs font-medium">
                  Notes (packaging, private label, delivery address, anything else)
                </label>
                <textarea
                  id="q-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  className={inputClass}
                  {...errorProps("notes")}
                />
                {fieldError("notes")}
              </div>
            </section>

            {/* Error with fallbacks */}
            {status === "error" && (
              <div className="mb-4 rounded-lg border p-4 text-sm" style={{ borderColor: ERROR, color: ERROR }} role="alert">
                <p className="font-medium">We could not send your request.</p>
                <p className="mt-1" style={{ color: INK }}>
                  Check your connection and try again, or send the same request directly:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider"
                    style={{ borderColor: BROWN, color: BROWN }}
                  >
                    <MessageCircle aria-hidden className="h-4 w-4" /> WhatsApp
                  </a>
                  <a
                    href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Bulk quotation request")}&body=${encodeURIComponent(buildMessage())}`}
                    className="flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wider"
                    style={{ borderColor: BROWN, color: BROWN }}
                  >
                    <Mail aria-hidden className="h-4 w-4" /> Email
                  </a>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold uppercase tracking-wider text-white transition active:scale-[0.98] disabled:opacity-60"
              style={{ background: BROWN }}
            >
              <Send aria-hidden className="h-4 w-4" />
              {status === "sending" ? "Sending..." : "Send request"}
            </button>
            <p className="mt-3 text-center text-xs" style={{ color: MUTED }}>
              No payment now. We reply with prices, availability and delivery time.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BULK ORDER PAGE
// ---------------------------------------------------------------------------
export default function BulkOrderPage() {
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [query, setQuery] = useState("");
  const [quote, setQuote] = useState<QuoteState>({});
  const [modalOpen, setModalOpen] = useState(false);

  const setQuantity = (id: string, quantity: number) => {
    setQuote((q) => {
      const next = { ...q };
      if (quantity <= 0) delete next[id];
      else next[id] = quantity;
      return next;
    });
  };

  const selectedCount = Object.keys(quote).length;

  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of ITEMS) counts[item.category] = (counts[item.category] ?? 0) + 1;
    return counts;
  }, []);

  const visibleItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return ITEMS.filter((item) => {
      if (activeCategory !== "All" && item.category !== activeCategory) return false;
      if (search && !`${item.name} ${item.description} ${item.category}`.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [activeCategory, query]);

  // Group items under their category heading
  const groups = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        items: visibleItems.filter((i) => i.category === category),
      })).filter((g) => g.items.length > 0),
    [visibleItems]
  );

  const chips: (Category | "All")[] = ["All", ...CATEGORIES];

  return (
    <div className={`${ubuntu.className} min-h-screen overflow-x-hidden pb-24`} style={{ background: CREAM, color: INK }}>
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
            <span aria-current="page">Bulk Orders</span>
          </nav>

          <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">Bulk Orders</h1>
          <p className="mt-3 text-lg sm:text-xl md:text-2xl">Order in volume. Get a quotation within a day.</p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 md:text-base">
            Choose the products you need, set the quantity, and send us a quotation request. We cover coffee, skin
            care, fragrances, imported beds, dates, groceries and spices for retailers, hotels, cafes and gifting.
          </p>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-white px-8 text-sm font-bold uppercase tracking-wider transition active:scale-95"
            style={{ color: BROWN }}
          >
            <FileText aria-hidden className="h-4 w-4" />
            Request quotation
          </button>
        </div>
      </section>

      {/* ---------- SHOP AREA ---------- */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:pt-10">
        {/* Top bar: count + search */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ borderColor: LINE }}>
          <p aria-live="polite" className="text-[11px] uppercase tracking-[0.15em] sm:text-xs" style={{ color: MUTED }}>
            Showing {visibleItems.length} of {ITEMS.length} products
          </p>

          <label
            className="flex w-full items-center gap-2 rounded-md border bg-white px-3 focus-within:border-[#7A5A3C] sm:w-64"
            style={{ borderColor: LINE }}
          >
            <Search aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.5} style={{ color: MUTED }} />
            <span className="sr-only">Search products</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none placeholder:text-[#1F1A17]/40"
            />
          </label>
        </div>

        {/* Category chips */}
        <div className={`${hideScrollbar} -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0`}>
          {chips.map((chip) => {
            const on = activeCategory === chip;
            const count = chip === "All" ? ITEMS.length : countByCategory[chip];
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setActiveCategory(chip)}
                aria-pressed={on}
                className="shrink-0 rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition-colors"
                style={{
                  borderColor: BROWN,
                  background: on ? BROWN : "transparent",
                  color: on ? CREAM : BROWN,
                }}
              >
                {chip} ({count})
              </button>
            );
          })}
        </div>

        {/* Products grouped by category */}
        <div className="mt-8">
          {groups.length > 0 ? (
            groups.map(({ category, items }) => {
              const Icon = CATEGORY_ICONS[category];
              return (
                <div key={category} className="mb-10">
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-medium">
                    <Icon aria-hidden className="h-5 w-5" strokeWidth={1.5} style={{ color: BROWN }} />
                    {category}
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                    {items.map((item) => (
                      <ItemCard key={item.id} item={item} quantity={quote[item.id] ?? 0} onSetQuantity={setQuantity} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center sm:py-20">
              <p className="text-2xl font-medium" style={{ color: BROWN }}>
                No products found
              </p>
              <p className="mt-2 text-sm" style={{ color: MUTED }}>
                Try a different search, or request a quotation and tell us what you need.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveCategory("All");
                  }}
                  className="rounded-lg border px-6 py-2 text-xs uppercase tracking-widest transition-colors hover:bg-[#7A5A3C] hover:text-[#F5EDE0]"
                  style={{ borderColor: BROWN, color: BROWN }}
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="rounded-lg px-6 py-2 text-xs uppercase tracking-widest text-white"
                  style={{ background: BROWN }}
                >
                  Request quotation
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------- STICKY QUOTE BAR (always visible) ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]" style={{ borderColor: LINE }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <p className="min-w-0 text-sm" aria-live="polite">
            <span className="font-bold">{selectedCount}</span>{" "}
            <span style={{ color: MUTED }}>{selectedCount === 1 ? "item" : "items"} in your quote</span>
          </p>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex h-11 shrink-0 items-center gap-2 rounded-lg px-6 text-sm font-bold uppercase tracking-wider text-white transition active:scale-95"
            style={{ background: BROWN }}
          >
            <FileText aria-hidden className="h-4 w-4" />
            Request quotation
          </button>
        </div>
      </div>

      {/* ---------- QUOTE MODAL ---------- */}
      {modalOpen && (
        <QuoteModal
          quote={quote}
          onSetQuantity={setQuantity}
          onClose={() => setModalOpen(false)}
          onSent={() => setQuote({})}
        />
      )}
    </div>
  );
}