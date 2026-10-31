"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ubuntu } from "next/font/google";
import { readLocalCatalog, type StoreProduct } from "../lib/productStore";
import { addToCart, setCartItemQuantity, useCart } from "../lib/cartStore";
import { toggleWishlistItem, useWishlist } from "../lib/wishlistStore";
import {
  BadgeCheck,
  BedDouble,
  Cherry,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Droplets,
  Flower2,
  Heart,
  Leaf,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBasket,
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
  // Hero slides
  heroCoffee: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_4TuRaK1Q9if9U1H5VQGkO9Z5V8DF5wA--pNSfLhlzw&s=10",
  heroSpices: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNl51-7HI67lmMtQSgfP5b010GN_OCOlcBnV1YLNrwrw&s=10",
  heroFragrance: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJCgBzxL6OYMI_BOHCmzFwkD7gCsQhzVVkGy420vlTFw&s=10",
  heroMattress: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoIgNNgg9P9AFPQ2U4jp9wBW3__jz8D6MXuI6Igl_VCA&s=10",
  heroBulk: "https://plus.unsplash.com/premium_photo-1679858782272-8ee1ba3d4c12?w=600&auto=format&fit=crop&q=60",

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
  productCoffee: "https://your-image-url.com/product-coffee.jpg",
  productSkincare: "https://your-image-url.com/product-skincare.jpg",
  productPepper: "https://your-image-url.com/product-pepper.jpg",
  productCardamom: "https://your-image-url.com/product-cardamom.jpg",
  productOud: "https://your-image-url.com/product-oud.png",
  productRose: "https://your-image-url.com/product-rose.jpg",
  productSheet: "https://your-image-url.com/product-sheet.jpg",
  productMattress: "https://your-image-url.com/product-mattress.jpg",
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

  if (!src || failed) return null;

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
  const touchStartX = useRef<number | null>(null);
  const slideCount = slides.length;

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
        {slides.map((slide, i) => (
          <div
            key={slide.title}
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
        {slides.map((slide, i) => (
          <button
            key={slide.title}
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
  name: string;
  size?: string;
  detail: string;
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
  { id: "filter-coffee-250", name: "Filter coffee powder 250g", detail: "Medium roast, strong aroma", price: 349, oldPrice: 399, category: "coffee", badge: "Bestseller", isBestSeller: true, isMostSelling: true, image: IMAGES.productCoffee },
  { id: "instant-coffee-100", name: "Instant coffee jar 100g", detail: "Pure, no chicory", price: 299, category: "coffee", badge: "Most Selling", isBestSeller: true, isMostSelling: true, image: IMAGES.productCoffee },
  { id: "coffee-soap", name: "Coffee soap bar", detail: "Coffee-inspired skincare", price: 199, category: "skincare", badge: "Top seller", isBestSeller: true, isMostSelling: true, image: IMAGES.productSkincare },
  { id: "coffee-facewash-100", name: "Coffee face wash 100ml", detail: "Daily cleansing care", price: 349, oldPrice: 399, category: "skincare", image: IMAGES.productSkincare },
  { id: "black-pepper-100", name: "Whole black pepper 100g", detail: "Bold and aromatic", price: 299, category: "spices", badge: "Most Selling", isMostSelling: true, image: IMAGES.productPepper },
  { id: "cardamom-50", name: "Green cardamom 50g", detail: "Fragrant green pods", price: 449, oldPrice: 520, category: "spices", badge: "Bestseller", isBestSeller: true, image: IMAGES.productCardamom },
  { id: "oud-noir-50", name: "Oud Noir 50ml", detail: "Warm, woody fragrance", price: 1999, category: "perfumes", badge: "Bestseller", isBestSeller: true, isMostSelling: true, image: IMAGES.productOud },
  { id: "rose-mist-50", name: "Rose Mist 50ml", detail: "Light and floral", price: 1799, oldPrice: 2199, category: "perfumes", image: IMAGES.productRose },
  { id: "cotton-sheet-set", name: "Cotton bedsheet set", detail: "King size, soft cotton", price: 2499, category: "mattresses", image: IMAGES.productSheet },
  { id: "foam-mattress-queen", name: "Memory foam mattress", detail: "Queen size, medium firm", price: 14999, oldPrice: 17999, category: "mattresses", badge: "Bestseller", isBestSeller: true, isMostSelling: true, image: IMAGES.productMattress },
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
  const outOfStock = product.stock !== undefined && product.stock <= 0;

  const discountPercent = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  const displayBadge =
    product.badge ||
    (product.isMostSelling ? "Most Selling" : product.isBestSeller ? "Bestseller" : undefined);

  return (
    <article className="w-[150px] shrink-0 snap-start rounded-xl border border-black/10 bg-white p-2 sm:w-[184px]">
      <div className="relative aspect-square overflow-hidden rounded-lg" style={{ background: CREAM }}>
        <Photo
          src={product.image}
          alt={product.name}
          className={`h-full w-full object-cover ${outOfStock ? "opacity-40" : ""}`}
        />

        {(displayBadge || discountPercent > 0) && !outOfStock && (
          <span
            className="absolute left-0 top-2 rounded-r-md px-2 py-0.5 text-[10px] font-semibold text-white"
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
          className="absolute right-1.5 top-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#B42318] shadow-xs transition hover:bg-white"
        >
          <Heart className="h-4 w-4" strokeWidth={1.6} fill={wished ? "#B42318" : "none"} />
        </button>

        {outOfStock && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-neutral-700/85 px-2 py-0.5 text-[10px] font-semibold text-white">
            Out of Stock
          </span>
        )}
      </div>

      <h3 className="mt-2 line-clamp-2 min-h-[2.5em] text-[13px] font-semibold leading-tight">{product.name}</h3>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-neutral-500">{product.detail}</p>

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
            className="h-8 min-w-[58px] rounded-lg border border-neutral-300 bg-neutral-100 px-3 text-xs font-bold text-neutral-400 opacity-60"
          >
            Sold
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
// 5. BULK BANNER + PROMISES
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
    const mapToHomeProducts = (list: StoreProduct[]): Product[] =>
      list
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

    const refresh = () => {
      const local = readLocalCatalog();
      if (local.length > 0) {
        const mappedLocal = mapToHomeProducts(local);
        if (mappedLocal.length > 0) setCatalog(mappedLocal);
      }

      fetch("/api/products", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data?.products?.length) return;
          const mapped = mapToHomeProducts(data.products);
          if (mapped.length > 0) setCatalog(mapped);
        })
        .catch(() => { });
    };

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("ibrew-products-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("ibrew-products-updated", refresh);
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
    router.push("/cart");
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

      <BulkBanner />
      <Promises />
    </main>
  );
}
