"use client";

import { use, useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ubuntu } from "next/font/google";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  ThumbsUp,
  Truck,
  Upload,
  User,
  X,
} from "lucide-react";
import { addToCart } from "../../../lib/cartStore";
import { toggleWishlistItem, useWishlist } from "../../../lib/wishlistStore";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const INK = "#1F1A17";
const BROWN = "#7A5A3C";
const CREAM = "#FAF7F2";
const SAND = "#E9DCC6";
const RED = "#E11D48";
const GREEN = "#1B5E3A";

const formatPrice = (p: number) => `₹${Number(p || 0).toLocaleString("en-IN")}`;

interface ProductSize {
  id?: number;
  label: string;
  price: number;
  mrp?: number;
  stock: number;
}

interface ProductDetails {
  id: string | number;
  slug: string;
  name: string;
  section: string;
  category: string;
  description: string;
  detail?: string;
  image: string;
  images?: string[];
  badge?: string;
  tags?: string[];
  isBestSeller?: boolean;
  isMostSelling?: boolean;
  rating?: number;
  reviewCount?: number;
  sizes: ProductSize[];
  ingredients?: string;
  origin?: string;
  roastLevel?: string;
  brewingGuide?: string;
  specifications?: Record<string, string>;
}

interface ReviewItem {
  id: number;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  createdAt: string;
}

function ProductDetailPageInner({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();
  const { items: wishlistItems, isWished: checkIsWished, toggle: toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery & Zoom State
  const [activeImage, setActiveImage] = useState<string>("");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  // Size & Quantity
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  // Delivery & PIN Code Estimator
  const [pincodeInput, setPincodeInput] = useState("");
  const [shippingResult, setShippingResult] = useState<{
    serviceable: boolean;
    estimatedDelivery?: string;
    deliveryCharge?: number;
    error?: string;
  } | null>(null);
  const [shippingChecking, setShippingChecking] = useState(false);

  // Recommendations (Frequently Bought Together)
  const [recommendations, setRecommendations] = useState<ProductDetails[]>([]);
  const [bundleSelected, setBundleSelected] = useState<Record<string, boolean>>({});

  // Reviews
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsSummary, setReviewsSummary] = useState<{
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: Record<number, number>;
  } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Submit Review Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");

  // 1. Fetch Product Details
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject("Product not found")))
      .then((data) => {
        if (!active) return;
        const p: ProductDetails = data.product;
        setProduct(p);
        const allImages = [p.image, ...(p.images || [])].filter(Boolean);
        setActiveImage(allImages[0] || "");
        setSelectedSizeIndex(0);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(String(err));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  // 2. Fetch Recommendations & Reviews
  useEffect(() => {
    if (!product) return;
    // Recommendations
    fetch(`/api/products/${encodeURIComponent(slug)}/recommendations`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.recommendations) {
          setRecommendations(data.recommendations);
          const initialMap: Record<string, boolean> = {};
          data.recommendations.forEach((item: ProductDetails) => {
            initialMap[String(item.id)] = true;
          });
          setBundleSelected(initialMap);
        }
      })
      .catch(() => {});

    // Reviews
    fetch(`/api/products/${encodeURIComponent(slug)}/reviews`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reviews) {
          setReviews(data.reviews);
          setReviewsSummary(data.summary);
        }
      })
      .catch(() => {});
  }, [product, slug]);

  // Handle Image Zoom Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  // PIN Code Estimate Checker
  const checkPincode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pin = pincodeInput.trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setShippingResult({ serviceable: false, error: "Enter a valid 6-digit PIN code" });
      return;
    }
    setShippingChecking(true);
    setShippingResult(null);
    try {
      const res = await fetch(`/api/shipping/estimate?pincode=${pin}&cartTotal=500`);
      const data = await res.json();
      if (res.ok && data.serviceable) {
        setShippingResult({
          serviceable: true,
          estimatedDelivery: data.estimatedDelivery,
          deliveryCharge: data.deliveryCharge,
        });
      } else {
        setShippingResult({
          serviceable: false,
          error: data.error || "Delivery currently unavailable to this PIN code",
        });
      }
    } catch {
      setShippingResult({ serviceable: false, error: "Could not estimate delivery" });
    } finally {
      setShippingChecking(false);
    }
  };

  // Add Current Product to Cart
  const handleAddToCart = () => {
    if (!product) return;
    const size = product.sizes[selectedSizeIndex] || {
      label: "Standard",
      price: 0,
      stock: 0,
    };
    if (size.stock <= 0) return;

    addToCart(
      {
        productId: String(product.id),
        name: product.name,
        size: size.label,
        price: size.price,
        mrp: size.mrp,
        image: product.image,
        category: product.category,
      },
      quantity
    );

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  // Frequently Bought Together: Add All Selected
  const handleAddBundle = () => {
    if (!product) return;
    handleAddToCart();
    recommendations.forEach((rec) => {
      if (bundleSelected[String(rec.id)]) {
        const s = rec.sizes[0] || { label: "Standard", price: 0, stock: 50 };
        addToCart(
          {
            productId: String(rec.id),
            name: rec.name,
            size: s.label,
            price: s.price,
            mrp: s.mrp,
            image: rec.image,
            category: rec.category,
          },
          1
        );
      }
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  // Photo Upload Handler (base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setReviewPhotos((prev) => [...prev, reader.result as string].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Submit Review Form
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(slug)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewRating,
          customerName: reviewName.trim(),
          customerEmail: reviewEmail.trim(),
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
          images: reviewPhotos,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewSuccessMsg("Thank you! Your review has been submitted successfully.");
        // Refresh reviews
        fetch(`/api/products/${encodeURIComponent(slug)}/reviews`)
          .then((r) => r.json())
          .then((d) => {
            if (d.reviews) {
              setReviews(d.reviews);
              setReviewsSummary(d.summary);
            }
          });
        setTimeout(() => {
          setShowReviewModal(false);
          setReviewSuccessMsg("");
          setReviewComment("");
          setReviewTitle("");
          setReviewPhotos([]);
        }, 2000);
      }
    } catch {
      // ignore
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-[#7A5A3C]" />
        <p className="text-xs font-semibold uppercase tracking-widest text-[#7A5A3C]">
          Loading Product Details...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#1F1A17]">Product Not Found</h1>
        <p className="mt-2 text-sm text-neutral-600">
          We could not find the product you requested. It might have been moved or removed.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#7A5A3C] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1F1A17]"
        >
          <ArrowLeft size={16} />
          <span>Browse All Products</span>
        </Link>
      </div>
    );
  }

  const currentSize = product.sizes[selectedSizeIndex] || product.sizes[0];
  const isOutOfStock = (currentSize?.stock || 0) <= 0;
  const isWished = checkIsWished(String(product.id));
  const galleryImages = Array.from(new Set([product.image, ...(product.images || [])])).filter(Boolean);

  const bundleTotal =
    (currentSize?.price || 0) +
    recommendations.reduce((sum, r) => {
      if (bundleSelected[String(r.id)]) {
        return sum + (r.sizes[0]?.price || 0);
      }
      return sum;
    }, 0);

  return (
    <div className={`min-h-screen bg-white text-[#1F1A17] ${ubuntu.className}`}>
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-[#1B5E3A] px-5 py-3.5 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 size={18} />
          <span>Added to cart successfully!</span>
          <Link href="/cart" className="ml-2 rounded-lg bg-white/20 px-2.5 py-1 text-[11px] underline">
            View Cart
          </Link>
        </div>
      )}

      {/* Breadcrumb Nav */}
      <nav aria-label="Breadcrumb" className="border-b border-[#E9DCC6]/60 bg-[#FAF7F2]">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-xs font-medium text-neutral-600 sm:px-6 lg:px-8">
          <Link href="/" className="hover:text-[#7A5A3C]">
            Home
          </Link>
          <span>/</span>
          <Link href={`/${product.section}`} className="capitalize hover:text-[#7A5A3C]">
            {product.section.replace("-", " ")}
          </Link>
          <span>/</span>
          <span className="truncate text-[#1F1A17] font-semibold">{product.name}</span>
        </div>
      </nav>

      {/* MAIN PRODUCT SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* LEFT: GALLERY & ZOOM (6 COLS) */}
          <div className="lg:col-span-6">
            <div className="sticky top-6 space-y-4">
              {/* Main Image Container with Lens Zoom */}
              <div
                className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#E9DCC6] bg-[#FAF7F2] cursor-crosshair"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="h-full w-full object-contain p-4 transition-opacity duration-200"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-400">
                    <ImageIcon size={48} strokeWidth={1.2} />
                    <span className="text-xs uppercase tracking-widest">Photo coming soon</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                  {product.badge && (
                    <span className="rounded-md bg-[#7A5A3C] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      {product.badge}
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="rounded-md bg-[#B42318] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Wishlist Heart */}
                <button
                  type="button"
                  onClick={() => {
                    if (product) {
                      toggleWishlist({
                        productId: String(product.id),
                        name: product.name,
                        description: product.description,
                        price: product.sizes[0]?.price || 0,
                        mrp: product.sizes[0]?.mrp,
                        image: product.image,
                        category: product.category,
                        badge: product.badge,
                        inStock: !isOutOfStock,
                      });
                    }
                  }}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-110"
                >
                  <Heart
                    size={18}
                    className={
                      product && checkIsWished(String(product.id))
                        ? "fill-[#E11D48] text-[#E11D48]"
                        : "text-neutral-600"
                    }
                  />
                </button>

                {/* Zoom Pop-out lens when hovering */}
                {isZoomed && activeImage && (
                  <div
                    className="pointer-events-none absolute inset-0 hidden sm:block"
                    style={{
                      backgroundImage: `url(${activeImage})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: "220%",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                )}
              </div>

              {/* Thumbnails row */}
              {galleryImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#FAF7F2] p-1 transition ${
                        activeImage === img ? "border-[#7A5A3C] shadow-sm" : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Guarantees Box */}
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-[#E9DCC6] bg-[#FAF7F2] p-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck size={20} className="text-[#7A5A3C]" />
                  <span className="text-[11px] font-bold">100% Authentic</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Truck size={20} className="text-[#7A5A3C]" />
                  <span className="text-[11px] font-bold">Pan-India Express</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Sparkles size={20} className="text-[#7A5A3C]" />
                  <span className="text-[11px] font-bold">Freshly Packed</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: DETAILS, SIZES, BUY (6 COLS) */}
          <div className="space-y-6 lg:col-span-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#7A5A3C]">
                {product.category || product.section}
              </span>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[#1F1A17] sm:text-3xl">
                {product.name}
              </h1>

              {/* Rating & Review Counter */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-md bg-[#1B5E3A] px-2 py-0.5 text-xs font-bold text-white">
                  <span>{(product.rating || 4.7).toFixed(1)}</span>
                  <Star size={11} className="fill-white" />
                </div>
                <span className="text-xs text-neutral-500">
                  {reviewsSummary?.totalReviews || reviews.length || product.reviewCount || 12} Verified Ratings
                </span>
                <span className="text-neutral-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("reviews-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-xs font-semibold text-[#7A5A3C] hover:underline"
                >
                  Read Customer Reviews
                </button>
              </div>
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 border-y border-[#E9DCC6] py-4">
              <span className="text-3xl font-extrabold text-[#7A5A3C]">
                {formatPrice(currentSize.price)}
              </span>
              {currentSize.mrp && currentSize.mrp > currentSize.price && (
                <>
                  <span className="text-lg line-through text-neutral-400">
                    {formatPrice(currentSize.mrp)}
                  </span>
                  <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-bold text-[#065F46]">
                    Save {Math.round(((currentSize.mrp - currentSize.price) / currentSize.mrp) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed text-neutral-700">
              {product.description}
            </p>

            {/* Size Variants Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600">
                  Select Size / Variant
                </label>
                <div className="mt-2.5 flex flex-wrap gap-2.5">
                  {product.sizes.map((s, idx) => {
                    const selected = idx === selectedSizeIndex;
                    const oos = s.stock <= 0;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSizeIndex(idx)}
                        disabled={oos}
                        className={`group relative flex flex-col items-center rounded-xl border px-4 py-2 text-xs transition ${
                          selected
                            ? "border-[#7A5A3C] bg-[#FAF7F2] font-bold text-[#7A5A3C] ring-1 ring-[#7A5A3C]"
                            : oos
                            ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                            : "border-neutral-200 bg-white font-medium hover:border-neutral-400"
                        }`}
                      >
                        <span className="text-xs">{s.label}</span>
                        <span className="text-[11px] font-semibold text-neutral-800">
                          {formatPrice(s.price)}
                        </span>
                        {oos && (
                          <span className="mt-0.5 text-[9px] font-bold uppercase text-red-600">
                            Sold Out
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector + Add to Cart */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-12 w-32 items-center justify-between rounded-xl border border-neutral-300 bg-white px-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="cursor-pointer text-neutral-500 hover:text-black disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>
                <span className="text-sm font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(currentSize.stock, q + 1))}
                  disabled={quantity >= currentSize.stock || isOutOfStock}
                  className="cursor-pointer text-neutral-500 hover:text-black disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#7A5A3C] px-8 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#1F1A17] active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                <ShoppingBag size={16} />
                <span>{isOutOfStock ? "Sold Out" : "Add to Cart"}</span>
              </button>
            </div>

            {/* PIN Code Delivery Estimator */}
            <div className="rounded-2xl border border-[#E9DCC6] bg-[#FAF7F2] p-4">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#7A5A3C]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F1A17]">
                  Delivery Serviceability &amp; Date
                </span>
              </div>
              <form onSubmit={checkPincode} className="mt-2.5 flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit PIN code"
                  className="flex-1 rounded-xl border border-[#E9DCC6] bg-white px-3.5 py-2 text-xs font-medium outline-none focus:border-[#7A5A3C]"
                />
                <button
                  type="submit"
                  disabled={shippingChecking || !pincodeInput}
                  className="cursor-pointer rounded-xl bg-[#7A5A3C] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#1F1A17] disabled:opacity-50"
                >
                  {shippingChecking ? "Checking..." : "Check"}
                </button>
              </form>

              {shippingResult && (
                <div className="mt-3 text-xs">
                  {shippingResult.serviceable ? (
                    <div className="flex items-center gap-2 text-[#1B5E3A] font-semibold">
                      <Truck size={15} />
                      <span>
                        Estimated Delivery by <strong>{shippingResult.estimatedDelivery}</strong> (
                        {shippingResult.deliveryCharge === 0 ? "FREE Delivery" : `₹${shippingResult.deliveryCharge} Shipping`}
                        )
                      </span>
                    </div>
                  ) : (
                    <p className="text-red-600 font-medium">{shippingResult.error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Specifications & Accordions */}
            <div className="divide-y divide-[#E9DCC6] border-t border-[#E9DCC6] pt-2 text-sm">
              {product.origin && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-xs font-semibold text-neutral-500">Origin</span>
                  <span className="text-xs font-bold text-[#1F1A17]">{product.origin}</span>
                </div>
              )}
              {product.roastLevel && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-xs font-semibold text-neutral-500">Roast Profile</span>
                  <span className="text-xs font-bold text-[#1F1A17]">{product.roastLevel}</span>
                </div>
              )}
              {product.ingredients && (
                <div className="py-2.5">
                  <span className="block text-xs font-semibold text-neutral-500">Ingredients</span>
                  <p className="mt-1 text-xs text-[#1F1A17]">{product.ingredients}</p>
                </div>
              )}
              {product.brewingGuide && (
                <div className="py-2.5">
                  <span className="block text-xs font-semibold text-neutral-500">Brewing &amp; Usage Guide</span>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-neutral-700">
                    {product.brewingGuide}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FREQUENTLY BOUGHT TOGETHER SECTION */}
        {recommendations.length > 0 && (
          <div className="mt-16 rounded-3xl border border-[#E9DCC6] bg-[#FAF7F2] p-6 sm:p-10">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-[#7A5A3C]" />
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                Frequently Bought Together
              </h2>
            </div>
            <p className="mt-1 text-xs text-neutral-600">
              Customers who viewed this item also loved these artisanal pairing essentials.
            </p>

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
              {/* Product cards cluster */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Main product */}
                <div className="flex w-36 flex-col items-center rounded-2xl border border-[#E9DCC6] bg-white p-3 text-center shadow-xs">
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-50">
                    <img src={product.image} alt="" className="h-full w-full object-contain p-1" />
                  </div>
                  <span className="mt-2 line-clamp-1 text-xs font-bold">{product.name}</span>
                  <span className="text-xs font-semibold text-[#7A5A3C]">
                    {formatPrice(currentSize.price)}
                  </span>
                </div>

                {recommendations.map((rec) => {
                  const isChecked = bundleSelected[String(rec.id)] ?? true;
                  const s = rec.sizes[0] || { label: "Standard", price: 0 };
                  return (
                    <div key={rec.id} className="flex items-center gap-4">
                      <span className="text-lg font-bold text-[#7A5A3C]">+</span>
                      <div
                        onClick={() =>
                          setBundleSelected((prev) => ({
                            ...prev,
                            [String(rec.id)]: !isChecked,
                          }))
                        }
                        className={`flex w-36 cursor-pointer flex-col items-center rounded-2xl border p-3 text-center shadow-xs transition ${
                          isChecked ? "border-[#7A5A3C] bg-white ring-1 ring-[#7A5A3C]" : "border-neutral-200 bg-neutral-100 opacity-60"
                        }`}
                      >
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-50">
                          <img src={rec.image} alt="" className="h-full w-full object-contain p-1" />
                        </div>
                        <span className="mt-2 line-clamp-1 text-xs font-bold">{rec.name}</span>
                        <span className="text-xs font-semibold text-[#7A5A3C]">
                          {formatPrice(s.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bundle summary & Add button */}
              <div className="flex flex-col gap-2 rounded-2xl border border-[#E9DCC6] bg-white p-5 lg:ml-auto lg:min-w-[260px]">
                <span className="text-xs font-semibold text-neutral-500">Combo Total Price:</span>
                <span className="text-2xl font-bold text-[#7A5A3C]">{formatPrice(bundleTotal)}</span>
                <button
                  type="button"
                  onClick={handleAddBundle}
                  className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#7A5A3C] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#1F1A17]"
                >
                  <ShoppingBag size={14} />
                  <span>Add All to Cart</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS & RATINGS SECTION */}
        <section id="reviews-section" className="mt-16 border-t border-[#E9DCC6] pt-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Customer Ratings &amp; Reviews
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Real feedback from verified purchasers across India.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#7A5A3C] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#7A5A3C] transition hover:bg-[#7A5A3C] hover:text-white"
            >
              <Star size={14} />
              <span>Write a Review</span>
            </button>
          </div>

          {/* Rating Summary Breakdown Card */}
          {reviewsSummary && (
            <div className="mt-8 grid grid-cols-1 gap-6 rounded-3xl border border-[#E9DCC6] bg-[#FAF7F2] p-6 sm:grid-cols-12 sm:p-8">
              <div className="flex flex-col items-center justify-center border-b border-[#E9DCC6] pb-6 sm:col-span-4 sm:border-b-0 sm:border-r sm:pb-0">
                <span className="text-5xl font-black text-[#1F1A17]">
                  {Number(reviewsSummary.averageRating || 4.8).toFixed(1)}
                </span>
                <div className="mt-2 flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < Math.round(reviewsSummary.averageRating || 5)
                          ? "fill-amber-500 text-amber-500"
                          : "text-neutral-300"
                      }
                    />
                  ))}
                </div>
                <span className="mt-1.5 text-xs font-medium text-neutral-500">
                  Based on {reviewsSummary.totalReviews} verified reviews
                </span>
              </div>

              {/* Progress bars */}
              <div className="flex flex-col justify-center space-y-2 sm:col-span-8 sm:pl-6">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviewsSummary.ratingBreakdown?.[stars] || 0;
                  const pct = reviewsSummary.totalReviews > 0 ? (count / reviewsSummary.totalReviews) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="w-12 font-semibold text-neutral-600">{stars} Stars</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-neutral-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="mt-8 space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-[#E9DCC6] bg-[#FAF7F2] p-8 text-center text-xs text-neutral-500">
                No reviews yet for this product. Be the first to share your thoughts!
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-[#E9DCC6] bg-white p-5 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1F1A17]">{rev.customerName}</span>
                      {rev.isVerifiedPurchase && (
                        <span className="flex items-center gap-1 rounded bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-bold text-[#065F46]">
                          <CheckCircle2 size={11} />
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="mt-1.5 flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < rev.rating ? "fill-amber-500 text-amber-500" : "text-neutral-300"}
                      />
                    ))}
                  </div>

                  {rev.title && (
                    <h4 className="mt-2 text-xs font-bold text-[#1F1A17]">{rev.title}</h4>
                  )}
                  <p className="mt-1 text-xs leading-relaxed text-neutral-700">{rev.comment}</p>

                  {/* Customer photos */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {rev.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt="Customer upload"
                          className="h-16 w-16 rounded-lg object-cover border border-[#E9DCC6]"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      {/* WRITE A REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-lg font-bold">Write a Product Review</h3>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-neutral-500 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            {reviewSuccessMsg ? (
              <div className="py-8 text-center text-[#1B5E3A] font-bold text-sm">
                <CheckCircle2 size={36} className="mx-auto mb-2 text-[#1B5E3A]" />
                {reviewSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
                {/* Star selection */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-600">Your Rating</label>
                  <div className="mt-1.5 flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className="cursor-pointer text-amber-500 hover:scale-110 transition"
                      >
                        <Star
                          size={24}
                          className={s <= reviewRating ? "fill-amber-500" : "text-neutral-300"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="mt-1 w-full rounded-xl border border-[#E9DCC6] px-3 py-2 text-xs outline-none focus:border-[#7A5A3C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600">Email Address (Private)</label>
                    <input
                      type="email"
                      value={reviewEmail}
                      onChange={(e) => setReviewEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="mt-1 w-full rounded-xl border border-[#E9DCC6] px-3 py-2 text-xs outline-none focus:border-[#7A5A3C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600">Review Title</label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Exceptional aroma and flavor!"
                    className="mt-1 w-full rounded-xl border border-[#E9DCC6] px-3 py-2 text-xs outline-none focus:border-[#7A5A3C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-600">Your Feedback *</label>
                  <textarea
                    rows={4}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us what you loved about this product..."
                    className="mt-1 w-full rounded-xl border border-[#E9DCC6] px-3 py-2 text-xs outline-none focus:border-[#7A5A3C]"
                  />
                </div>

                {/* Photo upload */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-600">
                    Add Photos (Max 3)
                  </label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[#E9DCC6] text-neutral-400 hover:border-[#7A5A3C] hover:text-[#7A5A3C]">
                      <Upload size={18} />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {reviewPhotos.map((p, i) => (
                      <div key={i} className="relative h-16 w-16 rounded-xl border overflow-hidden">
                        <img src={p} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setReviewPhotos((all) => all.filter((_, idx) => idx !== i))}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="rounded-xl border border-neutral-300 px-5 py-2.5 text-xs font-bold uppercase text-neutral-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="rounded-xl bg-[#7A5A3C] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1F1A17] disabled:opacity-50"
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#7A5A3C]" />
        </div>
      }
    >
      <ProductDetailPageInner {...props} />
    </Suspense>
  );
}

