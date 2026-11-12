"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ubuntu } from "next/font/google";
import {
  readDeletedIds,
  readLocalCatalog,
  subscribeCatalogChanges,
  truncateWords,
  type StoreProduct,
} from "../lib/productStore";
import { addToCart, openCartDrawer, setCartItemQuantity, useCart } from "../lib/cartStore";
import { toggleWishlistItem, useWishlist } from "../lib/wishlistStore";
import {
  BadgeCheck,
  BedDouble,
  Check,
  Cherry,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Compass,
  Droplets,
  Eye,
  Flower2,
  Heart,
  Leaf,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// STYLE TOKENS
// ---------------------------------------------------------------------------
const INK = "#1F1A17";
const BROWN = "#7A5A3C";
const CREAM = "#F5EDE0";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const hideScrollbar = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const formatPrice = (n: number) => "₹" + n.toLocaleString("en-IN");

// ---------------------------------------------------------------------------
// IMAGE URLS - paste your own image links here (all images are used by key)
// ---------------------------------------------------------------------------
const IMAGES = {
  // Hero slides (High-resolution, distinct, responsive banners)
  heroCoffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80",
  heroSpices: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=80",
  heroFragrance: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1600&q=80",
  heroMattress: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
  heroBulk: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=80",

  // Category icons
  catCoffee: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqTc2JVUdet-0L__eqqEPXfF7fdca3ycTeIcWnWLusEQ&s=10",
  catSkincare: "https://images.pexels.com/photos/14856372/pexels-photo-14856372.jpeg?_gl=1*1x7o20m*_ga*MTM1MTc1MTIyMy4xNzkyNzM1MTYw*_ga_8JE65Q40S6*czE3OTMzNDQ2MDAkbzEwJGcxJHQxNzkzMzQ0NjE0JGo0NiRsMCRoMA..",
  catSpices: "https://static.toiimg.com/photo/64699039.cms",
  catFragrance: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCdnFGvYUl69vrQpDO1drZaiXD9s23ohXWjhXUw21_oQ&s=10",
  catMattress: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxD26TbYfTNdcD0EqNCOYOzJTjVs2ssDRaynvS04tUzQ&s",
  catGroceries:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBwRhXv0fY4RJJhu_zDBrOBiu7_CygkvYGwKlDd6A5eQ&s=10",
  catDates:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiV5zULTMNb3gWuNP_KftdHmqVNK4pytWCe2JkTxV8IA&s=10",
  catBulk:
    "https://plus.unsplash.com/premium_photo-1679858782272-8ee1ba3d4c12?w=600&auto=format&fit=crop&q=60",

  // Promo cards
  promoCoffee:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxJvNvH9yY0igWXFcNAl_0dw3CpDByMWbr5cyaUFR_gA&s=10",
  promoSpices:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4j_nLnHRCZAaeBhbCJEDadbETNqTgcsFzle_ORIUNuw&s=10",
  promoBulk:
    "https://plus.unsplash.com/premium_photo-1679858782272-8ee1ba3d4c12?w=600&auto=format&fit=crop&q=60",

  // Products
};

// ---------------------------------------------------------------------------
// SMALL HELPER: image that quietly disappears if the URL fails to load
// (the coloured box behind it shows instead)
// ---------------------------------------------------------------------------
type PhotoProps = {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
};

function Photo({ src, alt, className, eager }: PhotoProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 text-center bg-[#E9DCC6]">
        <span className="line-clamp-2 text-xs font-semibold leading-tight text-[#1F1A17]">{alt}</span>
        <span className="text-[9px] uppercase tracking-wider text-[#1F1A17]/60">Photo coming soon</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

// ---------------------------------------------------------------------------
// 1. FULL-SCREEN HERO CAROUSEL (moves on automatically, never pauses)
// ---------------------------------------------------------------------------
const SLIDE_DELAY_MS = 4000;

const slides = [
  { title: "Fresh ground coffee, at your door", text: "Filter and instant blends, roasted and packed with care.", cta: "Shop coffee", href: "/coffee", color: "#5A3420", image: IMAGES.heroCoffee },
  { title: "Export-quality spices", text: "Cardamom, pepper and more, picked for aroma and freshness.", cta: "Shop spices", href: "/spices", color: "#9A5B00", image: IMAGES.heroSpices },
  { title: "Imported fragrance and oils", text: "Warm, woody and floral fragrances from around the world.", cta: "Shop fragrance", href: "/fragrances", color: "#7B3F6B", image: IMAGES.heroFragrance },
  { title: "Sleep in luxury", text: "Imported mattresses for better nights.", cta: "Shop mattresses", href: "/importedbed", color: "#34517A", image: IMAGES.heroMattress },
  { title: "Buying in bulk?", text: "Special prices for shops, hotels, offices and events.", cta: "Get a bulk quote", href: "/bulk-order", color: INK, image: IMAGES.heroBulk },
];

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [dynamicSlides, setDynamicSlides] = useState(slides);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/banners?type=hero_slide")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.banners && Array.isArray(data.banners) && data.banners.length > 0) {
          const fallbackImages = [
            IMAGES.heroCoffee,
            IMAGES.heroSpices,
            IMAGES.heroFragrance,
            IMAGES.heroMattress,
            IMAGES.heroBulk,
          ];
          const mapped = data.banners.map((b: { title: string; subtitle?: string; ctaText?: string; ctaLink?: string; imageUrl?: string; image?: string; colorScheme?: string }, idx: number) => ({
            title: b.title,
            text: b.subtitle || "",
            cta: b.ctaText || "Shop now",
            href: b.ctaLink || "/coffee",
            color: b.colorScheme || "#5A3420",
            image: b.imageUrl || b.image || fallbackImages[idx % fallbackImages.length],
          }));
          setDynamicSlides(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const slideCount = dynamicSlides.length;

  // Go to a slide, wrapping around at both ends
  const goTo = useCallback(
    (to: number) => setIndex(((to % slideCount) + slideCount) % slideCount),
    [slideCount]
  );

  // Auto-advance. A swipe or dot click restarts the timer.
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const timer = setTimeout(() => goTo(index + 1), SLIDE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [index, goTo]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;

    const distance = e.changedTouches[0].clientX - startX;
    if (Math.abs(distance) > 40) goTo(index + (distance < 0 ? 1 : -1));
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured offers"
    >
      <div
        className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {dynamicSlides.map((slide, i) => (
          <div
            key={slide.title + i}
            aria-hidden={i !== index}
            className="relative h-[48svh] min-h-[280px] max-h-[430px] w-full shrink-0 sm:h-[56svh] sm:min-h-[340px] lg:h-[calc(100svh-270px)] lg:min-h-[420px] lg:max-h-[720px]"
            style={{ background: slide.color }}
          >
            <Photo
              src={slide.image}
              alt=""
              eager={i === 0}
              className="absolute inset-0 h-full w-full object-cover object-center md:object-right"
            />

            {/* Colour fade: from the bottom on phones, from the left on larger screens */}
            <div
              className="absolute inset-0 md:hidden"
              style={{ background: `linear-gradient(0deg, ${slide.color} 0%, ${slide.color}D9 38%, ${slide.color}00 80%)` }}
            />
            <div
              className="absolute inset-0 hidden md:block"
              style={{ background: `linear-gradient(90deg, ${slide.color} 0%, ${slide.color}E6 38%, ${slide.color}00 82%)` }}
            />

            <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-14 text-white sm:px-6 md:justify-center md:pb-0">
              <h2 className="max-w-xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                {slide.title}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/85 sm:text-base lg:text-lg">
                {slide.text}
              </p>
              <Link
                href={slide.href}
                tabIndex={i === index ? 0 : -1}
                className="mt-5 inline-flex h-11 w-fit items-center rounded-lg bg-white px-6 text-sm font-semibold text-[#1F1A17] transition hover:bg-[#7A5A3C] hover:text-white active:scale-95"
              >
                {slide.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
        {dynamicSlides.map((slide, i) => (
          <button
            key={slide.title + i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full bg-white transition-all duration-300 ${i === index ? "w-6" : "w-1.5 opacity-60"
              }`}
          />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. CATEGORIES (one line on every screen, scrolls sideways on phones)
// ---------------------------------------------------------------------------
type Category = {
  label: string;
  href: string;
  bg: string; // background colour behind the image
  fg: string; // icon colour (shown if the image fails)
  Icon: LucideIcon;
  image?: string;
};

const categories: Category[] = [
  { label: "Coffee", href: "/coffee", bg: "#F0E2D6", fg: "#5A3420", Icon: Coffee, image: IMAGES.catCoffee },
  { label: "Coffee skincare", href: "/coffee-skin", bg: "#E2EDDF", fg: "#41633F", Icon: Droplets, image: IMAGES.catSkincare },
  { label: "Spices", href: "/spices", bg: "#FBEDC8", fg: "#9A5B00", Icon: Leaf, image: IMAGES.catSpices },
  { label: "Fragrance", href: "/fragrances", bg: "#F3E1EE", fg: "#7B3F6B", Icon: Flower2, image: IMAGES.catFragrance },
  { label: "Mattresses", href: "/importedbed", bg: "#E0E9F5", fg: "#34517A", Icon: BedDouble, image: IMAGES.catMattress },
  { label: "Groceries", href: "/groceries", bg: "#E6F0D8", fg: "#4B6A2A", Icon: ShoppingBasket, image: IMAGES.catGroceries },
  { label: "Dates", href: "/dates", bg: "#F3E3C3", fg: "#6B4410", Icon: Cherry, image: IMAGES.catDates },
  { label: "Bulk ordering", href: "/bulk-order", bg: "#E4E1EE", fg: "#4A3F73", Icon: Package, image: IMAGES.catBulk },
];

function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-1 pt-5 sm:px-6">
      <h2 className="mb-3 text-base font-bold tracking-tight sm:text-xl">Shop by category</h2>

      <ul className={`-mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:justify-between ${hideScrollbar}`}>
        {categories.map(({ label, href, bg, fg, Icon, image }) => (
          <li key={label} className="w-[76px] shrink-0 sm:w-24">
            <Link href={href} className="group flex flex-col items-center text-center">
              <span
                className="relative flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-2xl transition group-active:scale-95 sm:h-20 sm:w-20"
                style={{ background: bg, color: fg }}
              >
                <Icon aria-hidden strokeWidth={1.4} className="h-8 w-8" />
                <Photo
                  src={image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </span>
              <span className="mt-2 text-[11px] font-semibold leading-tight sm:text-xs">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. PROMO CARDS (coffee, spices, bulk ordering)
// ---------------------------------------------------------------------------
type Promo = {
  title: string;
  text: string;
  href: string;
  image: string;
  overlay: string; // dark tint over the image so the text stays readable
};

const promos: Promo[] = [
  { title: "Coffee", text: "Rich aroma, freshly brewed.", href: "/coffee", image: IMAGES.promoCoffee, overlay: "rgba(45, 25, 8, 0.25)" },
  { title: "Spices", text: "Authentic spices, rich in flavour.", href: "/spices", image: IMAGES.promoSpices, overlay: "rgba(18, 38, 20, 0.25)" },
  { title: "Bulk ordering", text: "Better prices in bulk.", href: "/bulk-order", image: IMAGES.promoBulk, overlay: "rgba(45, 25, 8, 0.25)" },
];

function PromoCards() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {promos.map(({ title, text, href, image, overlay }) => (
          <Link
            key={title}
            href={href}
            className="group relative flex min-h-[132px] items-end overflow-hidden rounded-2xl p-4 text-white transition active:scale-[0.98] sm:min-h-[176px] sm:p-5"
            style={{ background: "#4A382B" }}
          >
            <Photo
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0" style={{ background: overlay }} aria-hidden="true" />

            <span className="relative z-10">
              <span className="block text-sm font-bold leading-tight sm:text-lg">{title}</span>
              <span className="mt-1 block text-[11px] leading-4 text-white/90 sm:text-sm">{text}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. PRODUCT RAILS (swipe on phones, arrows on desktop)
// ---------------------------------------------------------------------------
type ProductCategory =
  | "coffee"
  | "skincare"
  | "spices"
  | "perfumes"
  | "mattresses"
  | "groceries"
  | "dates";

type Product = {
  id: string;
  slug?: string;
  name: string;
  size?: string;
  detail: string;
  description?: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  image: string;
  category: ProductCategory;
  stock?: number;
  isBestSeller?: boolean;
  isMostSelling?: boolean;
  featuredOnHome?: boolean;
};

const DEFAULT_HOME_PRODUCTS: Product[] = [
  {
    "id": "104",
    "slug": "basmati-rice-premium",
    "name": "Premium Basmati Rice",
    "size": "1kg",
    "detail": "Extra-long aged grains",
    "description": "Aged basmati rice with long, fluffy grains and natural aroma.",
    "price": 179,
    "oldPrice": 210,
    "badge": "Most Selling",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJe-S6fj0iQcNs1hxSY3LDuiV3Oixez9M4AHQeZu_t1A&s=10",
    "category": "groceries",
    "stock": 39,
    "isBestSeller": true,
    "isMostSelling": true
  },
  {
    "id": "86",
    "slug": "coffee-face-scrub",
    "name": "Coffee Face Scrub",
    "size": "50g",
    "detail": "Brightening exfoliator",
    "description": "Gentle coffee and walnut scrub that removes dead skin and brightens dullness.",
    "price": 249,
    "oldPrice": 299,
    "badge": "Most Selling",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4NWzTOaoxyFeyNNvHFJIqXwxeeUrFT3VcFzMD4BQTMA&s=10",
    "category": "skincare",
    "stock": 37,
    "isBestSeller": true,
    "isMostSelling": true
  },
  {
    "id": "73",
    "slug": "medjool-dates",
    "name": "Medjool Dates",
    "size": "250g",
    "detail": "Large, soft & caramel-like",
    "description": "Large, soft and caramel-like dates. Naturally sweet and perfect for snacking.",
    "price": 399,
    "oldPrice": 449,
    "badge": "Bestseller",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiV5zULTMNb3gWuNP_KftdHmqVNK4pytWCe2JkTxV8IA&s=10",
    "category": "dates",
    "stock": 40,
    "isBestSeller": true,
    "isMostSelling": true
  },
  {
    "id": "59",
    "slug": "memory-foam-mattress",
    "name": "Memory Foam Mattress",
    "size": "Single 72x36\"",
    "detail": "Queen size, medium firm",
    "description": "Contouring memory foam that relieves pressure points and keeps your spine aligned all night.",
    "price": 8999,
    "oldPrice": 11999,
    "badge": "Bestseller",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxD26TbYfTNdcD0EqNCOYOzJTjVs2ssDRaynvS04tUzQ&s",
    "category": "mattresses",
    "stock": 34,
    "isBestSeller": true,
    "isMostSelling": true
  },
  {
    "id": "53",
    "slug": "oud-noir",
    "name": "Oud Noir Eau de Parfum",
    "size": "30ml",
    "detail": "Warm, woody fragrance",
    "description": "Deep, woody and smoky with warm amber. A bold scent that lasts all day.",
    "price": 899,
    "oldPrice": 999,
    "badge": "Bestseller",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCdnFGvYUl69vrQpDO1drZaiXD9s23ohXWjhXUw21_oQ&s=10",
    "category": "perfumes",
    "stock": 40,
    "isBestSeller": true,
    "isMostSelling": true
  },
  {
    "id": "46",
    "slug": "turmeric-powder",
    "name": "Turmeric Powder",
    "size": "100g",
    "detail": "High curcumin golden haldi",
    "description": "Bright golden haldi with high curcumin content. Adds colour and warmth to every dish.",
    "price": 69,
    "oldPrice": 79,
    "badge": "Bestseller",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStH-xDGHnNA7D-Ousu3kA_AmDO5WUkuu988WCcLVzddQ&s=10",
    "category": "spices",
    "stock": 66,
    "isBestSeller": true,
    "isMostSelling": true
  },
  {
    "id": "41",
    "slug": "instant-coffee",
    "name": "Pure Instant Coffee",
    "size": "50g",
    "detail": "Pure, no chicory",
    "description": "100% pure instant coffee with no chicory. Dissolves instantly, tastes freshly brewed.",
    "price": 199,
    "badge": "Most Selling",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxJvNvH9yY0igWXFcNAl_0dw3CpDByMWbr5cyaUFR_gA&s=10",
    "category": "coffee",
    "stock": 48,
    "isBestSeller": true,
    "isMostSelling": true
  },
  {
    "id": "40",
    "slug": "filter-coffee",
    "name": "Filter Coffee Powder",
    "size": "250g",
    "detail": "Medium roast, strong aroma",
    "description": "Medium roast with a strong, rich aroma. Made for South Indian filter coffee.",
    "price": 349,
    "oldPrice": 399,
    "badge": "Bestseller",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqTc2JVUdet-0L__eqqEPXfF7fdca3ycTeIcWnWLusEQ&s=10",
    "category": "coffee",
    "stock": 38,
    "isBestSeller": true,
    "isMostSelling": true
  },
  {
    "id": "49",
    "slug": "black-pepper",
    "name": "Black Pepper Whole",
    "size": "50g",
    "detail": "Bold and aromatic",
    "description": "Bold, pungent peppercorns from the Malabar coast. Crush fresh for the sharpest flavour.",
    "price": 119,
    "badge": "Most Selling",
    "image": "/api/uploads/products/black-pepper-1794370677497-9f45ccf0.jpg",
    "category": "spices",
    "stock": 60,
    "isBestSeller": false,
    "isMostSelling": true
  },
  {
    "id": "101",
    "slug": "pocket-spring-luxury-mattress",
    "name": "Pocket Spring Luxury Mattress",
    "size": "Queen",
    "detail": "Individually wrapped springs",
    "description": "Pocket spring mattress with zero motion transfer and a plush pillow top.",
    "price": 24999,
    "oldPrice": 29999,
    "badge": "Bestseller",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBd_UPovcvT-Nrea2jK6j5FWgQJTEHtN7xkVhuKyBWig&s=10",
    "category": "mattresses",
    "stock": 6,
    "isBestSeller": true,
    "isMostSelling": false
  },
  {
    "id": "85",
    "slug": "coffee-honey-soap-bar",
    "name": "Coffee & Honey Soap Bar",
    "size": "100g",
    "detail": "Gentle, moisturising",
    "description": "Mild coffee soap enriched with honey for soft, hydrated skin.",
    "price": 159,
    "oldPrice": 189,
    "badge": "Bestseller",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUjXXFYSFgijacBqb-TnM_aQeLHa01Yp484KeN6DBh4g&s=10",
    "category": "skincare",
    "stock": 34,
    "isBestSeller": true,
    "isMostSelling": false
  },
  {
    "id": "74",
    "slug": "ajwa-dates",
    "name": "Ajwa Dates",
    "size": "250g",
    "detail": "Authentic Madinah dates",
    "description": "Dark, soft and rich dates from Madinah. Prized for their unique taste and tradition.",
    "price": 599,
    "badge": "Premium",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3qnDxKr3ob09dIzxwFcQzdeKHzvFRAmfRRpaB8zGHVw&s=10",
    "category": "dates",
    "stock": 48,
    "isBestSeller": true,
    "isMostSelling": false
  },
  {
    "id": "55",
    "slug": "rose-musk-mist",
    "name": "Rose Musk Body Mist",
    "size": "100ml",
    "detail": "Light and floral",
    "description": "Soft rose petals and white musk in a light mist. Perfect for a quick refresh through the day.",
    "price": 399,
    "badge": "New",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrQl3ovxrgZEUYWeoB_6j1CTx0c63EWdx1dsGr4Y3h_w&s=10",
    "category": "perfumes",
    "stock": 18,
    "isBestSeller": false,
    "isMostSelling": false
  },
  {
    "id": "44",
    "slug": "coffee-face-wash",
    "name": "Coffee Face Wash",
    "size": "50ml",
    "detail": "Daily cleansing care",
    "description": "Daily cleansing face wash with the goodness of coffee. Fresh, clean and bright.",
    "price": 249,
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwBAcusZHNDOFVK4miAha_R9aw1KkZvm8P76MxkivQiA&s",
    "category": "skincare",
    "stock": 31,
    "isBestSeller": false,
    "isMostSelling": false
  },
  {
    "id": "42",
    "slug": "coffee-beans",
    "name": "Arabica Coffee Beans",
    "size": "250g",
    "detail": "Single-estate whole beans",
    "description": "Single-estate whole beans, slow roasted. Grind fresh for the fullest flavour.",
    "price": 499,
    "badge": "New",
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREiUYjTKOhCRFVGCbb87H-IT4zsXUagLypsCQND-wulw&s=10",
    "category": "coffee",
    "stock": 18,
    "isBestSeller": false,
    "isMostSelling": false
  }
];

const SECTION_TO_HOME_CAT: Record<string, ProductCategory> = {
  coffee: "coffee",
  "coffee-skin": "skincare",
  spices: "spices",
  fragrances: "perfumes",
  importedbed: "mattresses",
  groceries: "groceries",
  dates: "dates",
};

type ProductCardProps = {
  product: Product;
  onAddToCart: (product: Product) => void;
};

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { isWished } = useWishlist();
  const wished = isWished(product.id);
  const outOfStock = product.stock !== undefined ? Number(product.stock) <= 0 : false;

  const discountPercent = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  const displayBadge =
    product.badge ||
    (product.isMostSelling ? "Most Selling" : product.isBestSeller ? "Bestseller" : undefined);

  return (
    <article className="group w-[150px] shrink-0 snap-start rounded-xl border border-black/10 bg-white p-2 shadow-2xs transition hover:shadow-md sm:w-[184px]">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-50">
        <Link href={`/product/${product.slug || product.id}`} className="block h-full w-full">
          <Photo
            src={product.image}
            alt={product.name}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 ${outOfStock ? "opacity-40" : ""}`}
          />
        </Link>

        {(displayBadge || discountPercent > 0) && !outOfStock && (
          <span
            className="absolute left-0 top-2 rounded-r-md px-2 py-0.5 text-[10px] font-semibold text-white pointer-events-none"
            style={{ background: BROWN }}
          >
            {displayBadge ? displayBadge : `${discountPercent}% off`}
          </span>
        )}

        <button
          type="button"
          onClick={() =>
            toggleWishlistItem({
              productId: product.id,
              name: product.name,
              description: product.description,
              size: product.size,
              price: product.price,
              mrp: product.oldPrice,
              image: product.image,
              category: product.category,
              badge: displayBadge,
              inStock: !outOfStock,
            })
          }
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#B42318] shadow-xs transition hover:bg-white z-10"
        >
          <Heart className="h-4 w-4" strokeWidth={1.6} fill={wished ? "#B42318" : "none"} />
        </button>

        {outOfStock && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-[#B42318] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md pointer-events-none">
            Out of Stock
          </span>
        )}
      </div>

      <Link href={`/product/${product.slug || product.id}`} className="hover:text-[#7A5A3C] transition-colors">
        <h3 className="mt-2 line-clamp-2 min-h-[2.5em] text-[13px] font-semibold leading-tight">{product.name}</h3>
      </Link>
      <p
        className="mt-1 line-clamp-2 min-h-[2.2em] text-[11px] leading-tight text-neutral-500"
        title={product.description || product.detail}
      >
        {truncateWords(product.description || product.detail, 12)}
      </p>

      <div className="mt-2 flex items-end justify-between gap-1">
        <div>
          <p className="text-[13px] font-bold">{formatPrice(product.price)}</p>
          {product.oldPrice && (
            <p className="text-[11px] text-neutral-400 line-through">{formatPrice(product.oldPrice)}</p>
          )}
        </div>

        {outOfStock ? (
          <button
            type="button"
            disabled
            className="h-8 min-w-[76px] cursor-not-allowed rounded-lg border border-neutral-300 bg-neutral-100 px-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400"
          >
            Out of Stock
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="h-8 min-w-[58px] cursor-pointer rounded-lg border border-[#7A5A3C] bg-[#F5EDE0] px-3 text-xs font-bold text-[#7A5A3C] transition hover:bg-[#7A5A3C] hover:text-white active:scale-95"
          >
            Add
          </button>
        )}
      </div>
    </article>
  );
}

type RailProps = {
  title: string;
  href: string;
  items: Product[];
  onAddToCart: (product: Product) => void;
};

function Rail({ title, href, items, onAddToCart }: RailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  // direction: -1 = left, 1 = right
  const scrollRail = (direction: -1 | 1) => {
    const rail = scrollRef.current;
    rail?.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight sm:text-2xl">{title}</h2>

        <div className="flex items-center gap-2">
          <Link href={href} className="text-sm font-semibold text-[#7A5A3C] hover:underline">
            See all
          </Link>

          {/* Arrow buttons (desktop only) */}
          <button
            type="button"
            onClick={() => scrollRail(-1)}
            aria-label={`Scroll ${title} left`}
            className="hidden h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-black/15 bg-white text-[#1F1A17] transition hover:border-[#7A5A3C] hover:bg-[#7A5A3C] hover:text-white md:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollRail(1)}
            aria-label={`Scroll ${title} right`}
            className="hidden h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-black/15 bg-white text-[#1F1A17] transition hover:border-[#7A5A3C] hover:bg-[#7A5A3C] hover:text-white md:flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`-mx-4 flex snap-x gap-3 overflow-x-auto scroll-smooth px-4 pb-1 sm:mx-0 sm:px-0 ${hideScrollbar}`}
      >
        {items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 5. ABOUT IMAAN'S ONLINE: VISION, MISSION, COMMITMENT, WHY US, BRAND FAMILY & PROMISE
// ---------------------------------------------------------------------------
function BrandStory() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
      {/* Section Header */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-[#FAF3E8] px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#7A5A3C]">
          About Imaan’s Online
        </span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#1F1A17] sm:text-3xl md:text-4xl">
          Integrity, Quality &amp; Purpose in Every Choice
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#1F1A17]/70 sm:text-base">
          Connecting you with trusted domestic and international products across thoughtfully curated categories.
        </p>
      </div>

      {/* Vision & Mission Cards */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* Vision */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E9DCC6] bg-[#FAF7F2] p-6 transition-shadow hover:shadow-xs sm:p-8">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7A5A3C] text-white">
              <Eye className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <span className="mt-5 inline-block text-xs font-bold uppercase tracking-[0.18em] text-[#7A5A3C]">
              Our Vision
            </span>
            <h3 className="mt-1.5 text-xl font-bold text-[#1F1A17]">
              Recognised Multi-Category Brand
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#1F1A17]/80">
              To establish Imaan’s Online as a recognised multi-category e-commerce brand connecting customers with quality products from trusted domestic and international sources.
            </p>
          </div>
        </div>

        {/* Mission */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E9DCC6] bg-[#FAF7F2] p-6 transition-shadow hover:shadow-xs sm:p-8">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F1A17] text-white">
              <Compass className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <span className="mt-5 inline-block text-xs font-bold uppercase tracking-[0.18em] text-[#7A5A3C]">
              Our Mission
            </span>
            <h3 className="mt-1.5 text-xl font-bold text-[#1F1A17]">
              Dependable &amp; Authentic Shopping
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#1F1A17]/80">
              To provide a convenient and dependable online shopping experience across multiple product categories while upholding quality, transparency, authenticity, responsible sourcing, and customer satisfaction.
            </p>
          </div>
        </div>
      </div>

      {/* Our Commitment Highlight Card */}
      <div className="mt-6 rounded-2xl border border-[#E9DCC6] bg-white p-6 shadow-xs sm:p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-start md:gap-8">
          <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1B5E3A]/10 text-[#1B5E3A] md:mb-0">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#7A5A3C]">
              Our Commitment
            </span>
            <h3 className="mt-1 text-xl font-bold text-[#1F1A17] sm:text-2xl">
              Grounded in Responsibility &amp; Honest Communication
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#1F1A17]/80 sm:text-base">
              We are guided by quality-focused product selection, authentic and accurate product information, responsible sourcing, customer well-being, honest communication, and continuous improvement. We aim to work with dependable suppliers and provide clear descriptions so customers can make informed choices.
            </p>
            {/* Commitment Pillars */}
            <div className="mt-5 flex flex-wrap gap-2 pt-2">
              {[
                "Quality-Focused Selection",
                "Authentic Information",
                "Responsible Sourcing",
                "Customer Well-Being",
                "Honest Communication",
                "Continuous Improvement",
              ].map((pillar) => (
                <span
                  key={pillar}
                  className="rounded-full border border-[#E9DCC6] bg-[#FAF7F2] px-3.5 py-1 text-xs font-semibold text-[#1F1A17]/85"
                >
                  ✓ {pillar}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Why Imaan's Online & Our Brand Family */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Why Imaan's Online? (6 cols) */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E9DCC6] bg-[#FAF7F2] p-6 sm:p-8 lg:col-span-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7A5A3C] text-white">
                <Check className="h-3 w-3 stroke-[3]" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#7A5A3C]">
                Core Advantages
              </span>
            </div>
            <h3 className="mt-2 text-xl font-bold text-[#1F1A17] sm:text-2xl">
              Why Imaan’s Online?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#1F1A17]/70 sm:text-sm">
              We focus on building customer trust through curated collections, honest sourcing, and category expertise.
            </p>

            <ul className="mt-6 space-y-3.5">
              {[
                "A range of product categories under one platform",
                "Selected products from domestic and international suppliers",
                "Dedicated identities for specialised product categories",
                "A customer-focused approach to product information and service",
                "A commitment to responsible growth and continuous improvement",
              ].map((reason, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-[#1F1A17]/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1B5E3A] text-[11px] font-bold text-white">
                    ✓
                  </span>
                  <span className="leading-snug">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Our Brand Family (6 cols) */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E9DCC6] bg-white p-6 sm:p-8 lg:col-span-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF3E8] text-[#7A5A3C]">
                <Store className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#7A5A3C]">
                Specialised Identities
              </span>
            </div>
            <h3 className="mt-2 text-xl font-bold text-[#1F1A17] sm:text-2xl">
              Our Brand Family
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#1F1A17]/70 sm:text-sm">
              Each dedicated brand identity within Imaan’s brings specialised craftsmanship, purity, and focus to its craft.
            </p>

            <div className="mt-5 divide-y divide-[#E9DCC6]/60">
              {[
                {
                  brand: "Imaan’s Online",
                  desc: "Your trusted online shopping destination.",
                  href: "/",
                  icon: Store,
                },
                {
                  brand: "Imaan’s Luxury Bedding",
                  desc: "Premium mattresses and sleep solutions.",
                  href: "/importedbed",
                  icon: BedDouble,
                },
                {
                  brand: "Imaan’s Fragrance",
                  desc: "Fragrances for every identity.",
                  href: "/fragrances",
                  icon: Flower2,
                },
                {
                  brand: "iBrew by Imaan’s",
                  desc: "Coffee, crafted for everyday enjoyment.",
                  href: "/coffee",
                  icon: Coffee,
                },
                {
                  brand: "Imaan’s Natural Spices",
                  desc: "Quality sourced closer to the origin.",
                  href: "/spices",
                  icon: Leaf,
                },
              ].map((b, idx) => {
                const Icon = b.icon;
                return (
                  <Link
                    key={idx}
                    href={b.href}
                    className="group flex items-center justify-between py-3 transition hover:text-[#7A5A3C]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FAF3E8] text-[#7A5A3C] transition group-hover:bg-[#7A5A3C] group-hover:text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1F1A17] transition group-hover:text-[#7A5A3C]">
                          {b.brand}
                        </h4>
                        <p className="text-xs text-[#1F1A17]/70">{b.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#7A5A3C] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100 sm:inline">
                      Explore →
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Our Promise (Featured Seal Card) */}
      <div
        className="relative mt-6 overflow-hidden rounded-2xl p-6 text-white sm:p-8 md:p-10"
        style={{ background: "linear-gradient(135deg, #1F1A17 0%, #2E2520 60%, #3D3028 100%)" }}
      >
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#7A5A3C]/10 blur-2xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#7A5A3C] text-xs font-bold text-white">
              ★
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9DCC6]">
              Our Promise
            </span>
          </div>
          <blockquote className="mt-4 text-base font-medium italic leading-relaxed text-white/95 sm:text-lg md:text-xl">
            &ldquo;Every product represents a responsibility to the customer who chooses it. We aim to grow with integrity, improve our standards, and build a brand customers can choose with confidence—today and in the future.&rdquo;
          </blockquote>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#E9DCC6]">
            — Team Imaan’s Online
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6. BULK BANNER + PROMISES
// ---------------------------------------------------------------------------
function BulkBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div
        className="flex flex-col items-start justify-between gap-5 rounded-2xl p-6 text-white sm:flex-row sm:items-center sm:p-10"
        style={{ background: INK }}
      >
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Ordering for a shop, hotel or event?
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/75 sm:text-base">
            Get bulk prices on coffee, spices, dates, groceries and more, with doorstep delivery.
          </p>
        </div>

        <Link
          href="/bulk-order"
          className="inline-flex h-11 shrink-0 items-center rounded-lg bg-white px-6 text-sm font-semibold text-[#1F1A17] transition hover:bg-[#7A5A3C] hover:text-white active:scale-95"
        >
          Get a bulk quote
        </Link>
      </div>
    </section>
  );
}

const promises: { title: string; text: string; Icon: LucideIcon }[] = [
  { title: "Free shipping", text: "On prepaid orders above ₹999.", Icon: Truck },
  { title: "Quality checked", text: "Every imported product is inspected.", Icon: BadgeCheck },
  { title: "Export-quality spices", text: "Chosen for freshness and aroma.", Icon: Leaf },
  { title: "Secure payments", text: "Pay safely, your way.", Icon: ShieldCheck },
];

function Promises() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 border-t border-black/10 pt-8 md:grid-cols-4">
        {promises.map(({ title, text, Icon }) => (
          <div key={title} className="flex items-start gap-3">
            <Icon aria-hidden strokeWidth={1.5} className="mt-0.5 h-6 w-6 shrink-0" style={{ color: BROWN }} />
            <div>
              <h3 className="text-sm font-semibold sm:text-base">{title}</h3>
              <p className="mt-0.5 text-xs leading-5 text-neutral-600 sm:text-sm">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// HOME PAGE (the navbar lives in its own file, rendered from layout.tsx)
// ---------------------------------------------------------------------------
export default function HomePage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<Product[]>(DEFAULT_HOME_PRODUCTS);
  const { items: cartItems } = useCart();

  useEffect(() => {
    const mapToHomeProducts = (list: StoreProduct[]): Product[] => {
      return list
        .filter((p) => p.featuredOnHome !== false)
        .map((p) => {
          const sizes = p.sizes && p.sizes.length ? p.sizes : [{ label: "", price: 0, stock: 0 }];
          const firstAvailable = sizes.find((s) => s.stock > 0) ?? sizes[0];
          const totalStock = sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
          return {
            id: p.id,
            name: p.name,
            size: firstAvailable.label || undefined,
            detail: p.detail || p.description || "",
            description: p.description || p.detail || "",
            price: firstAvailable.price,
            oldPrice: firstAvailable.mrp,
            badge: p.badge || undefined,
            image: p.image || "",
            category: SECTION_TO_HOME_CAT[p.section] ?? "coffee",
            stock: totalStock,
            isBestSeller: Boolean(p.isBestSeller),
            isMostSelling: Boolean(p.isMostSelling),
          };
        });
    };

    // After hydration on client, apply local catalog immediately if available
    const local = readLocalCatalog();
    if (local.length > 0) {
      const mappedLocal = mapToHomeProducts(local);
      if (mappedLocal.length > 0) setCatalog(mappedLocal);
    }

    const refresh = () => {
      fetch(`/api/products?_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data || !Array.isArray(data.products)) return;
          const mapped = mapToHomeProducts(data.products);
          setCatalog(mapped);
        })
        .catch(() => {
          const local = readLocalCatalog();
          if (local.length > 0) {
            const mappedLocal = mapToHomeProducts(local);
            setCatalog(mappedLocal);
          }
        });
    };

    refresh();
    const unsubscribe = subscribeCatalogChanges(refresh);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart(
      {
        productId: product.id,
        name: product.name,
        size: product.size,
        price: product.price,
        mrp: product.oldPrice,
        image: product.image,
        category: product.category,
        subtitle: product.detail,
      },
      1
    );
    openCartDrawer();
  };

  const bestAndMostSelling = catalog.filter(
    (p) =>
      p.isMostSelling ||
      p.isBestSeller ||
      p.badge === "Most Selling" ||
      p.badge === "Bestseller" ||
      p.badge === "Top seller"
  );

  return (
    <main className={`${ubuntu.className} min-h-screen overflow-x-hidden bg-white`} style={{ color: INK }}>
      <HeroCarousel />
      <Categories />
      <PromoCards />

      <Rail
        title="Most selling & Bestsellers"
        href="/coffee"
        items={bestAndMostSelling}
        onAddToCart={handleAddToCart}
      />
      <Rail
        title="Coffee and skincare"
        href="/coffee"
        items={catalog.filter((p) => p.category === "coffee" || p.category === "skincare")}
        onAddToCart={handleAddToCart}
      />
      <Rail
        title="Spices"
        href="/spices"
        items={catalog.filter((p) => p.category === "spices")}
        onAddToCart={handleAddToCart}
      />
      <Rail
        title="Fragrance"
        href="/fragrances"
        items={catalog.filter((p) => p.category === "perfumes")}
        onAddToCart={handleAddToCart}
      />
      <Rail
        title="Mattresses"
        href="/importedbed"
        items={catalog.filter((p) => p.category === "mattresses")}
        onAddToCart={handleAddToCart}
      />
      <Rail
        title="Dates & Groceries"
        href="/dates"
        items={catalog.filter((p) => p.category === "dates" || p.category === "groceries")}
        onAddToCart={handleAddToCart}
      />

      <BrandStory />
      <BulkBanner />
      <Promises />
    </main>
  );
}
