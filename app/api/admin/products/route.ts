import { NextRequest, NextResponse } from "next/server";
import { readServerCatalog, writeServerCatalog } from "../../../../lib/serverProductCatalog";
import type { ProductSection, ProductSize, StoreProduct } from "../../../../lib/productStore";

const BACKEND_BASE = process.env.BACKEND_URL || "http://localhost:5001";

const ALLOWED_SECTIONS: ProductSection[] = [
  "coffee",
  "coffee-skin",
  "spices",
  "fragrances",
  "importedbed",
  "groceries",
  "dates",
];

function normalizeSizes(rawSizes: unknown): ProductSize[] {
  if (!Array.isArray(rawSizes) || rawSizes.length === 0) return [];
  return rawSizes
    .map((s: Record<string, unknown>) => {
      const label = String(s?.label ?? "").trim();
      const price = Number(s?.price);
      const mrp =
        s?.mrp !== undefined && s?.mrp !== "" && Number(s?.mrp) > 0
          ? Number(s.mrp)
          : undefined;
      const stock = Math.max(0, Math.floor(Number(s?.stock ?? 0)));
      if (!label || Number.isNaN(price) || price < 0) return null;
      return {
        label,
        price,
        ...(mrp && mrp > price ? { mrp } : {}),
        stock: Number.isNaN(stock) ? 0 : stock,
      };
    })
    .filter((x): x is ProductSize => x !== null);
}

export async function GET(req: NextRequest) {
  const localCatalog = readServerCatalog();

  try {
    const res = await fetch(`${BACKEND_BASE}/api/admin/products`, {
      cache: "no-store",
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.products)) {
        const backendList: StoreProduct[] = data.products;
        const seen = new Set(backendList.map((p) => (p.slug || p.id || p.name).toLowerCase()));
        const extraFromLocal = localCatalog.filter(
          (p) => !seen.has((p.slug || p.id || p.name).toLowerCase())
        );
        const merged = [...extraFromLocal, ...backendList];
        writeServerCatalog(merged);
        return NextResponse.json({ products: merged });
      }
    }
  } catch {
    // Fallback to local server file
  }

  return NextResponse.json({ products: localCatalog });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      section,
      category,
      description = "",
      detail = "",
      image = "",
      badge = "",
      tags = [],
      isBestSeller = false,
      isMostSelling = false,
      featuredOnHome = true,
      rating = 4.7,
      reviewCount = 24,
      sizes: rawSizes,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    }
    if (!ALLOWED_SECTIONS.includes(section)) {
      return NextResponse.json({ error: "Please choose a valid store section." }, { status: 400 });
    }
    if (!category || !String(category).trim()) {
      return NextResponse.json({ error: "Product category is required." }, { status: 400 });
    }

    const sizes = normalizeSizes(rawSizes);
    if (sizes.length === 0) {
      return NextResponse.json(
        { error: "Add at least one size with a valid label and price." },
        { status: 400 }
      );
    }

    const cleanTags: string[] = Array.isArray(tags)
      ? Array.from(new Set(tags.map((t: unknown) => String(t).trim()).filter(Boolean)))
      : [];

    if (isBestSeller && !cleanTags.includes("Bestseller")) cleanTags.push("Bestseller");
    if (isMostSelling && !cleanTags.includes("Most Selling")) cleanTags.push("Most Selling");

    const resolvedBadge =
      String(badge).trim() ||
      (isMostSelling ? "Most Selling" : isBestSeller ? "Bestseller" : "");

    const slug =
      String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

    let savedProduct: StoreProduct = {
      id: slug,
      slug,
      name: String(name).trim(),
      section,
      category: String(category).trim(),
      description: String(description).trim(),
      detail: String(detail).trim() || String(description).trim().slice(0, 60),
      image: String(image).trim(),
      badge: resolvedBadge,
      tags: cleanTags,
      isBestSeller: Boolean(isBestSeller),
      isMostSelling: Boolean(isMostSelling),
      featuredOnHome: Boolean(featuredOnHome),
      rating: Math.min(5, Math.max(0, Number(rating) || 4.7)),
      reviewCount: Math.max(0, Math.floor(Number(reviewCount) || 0)),
      sizes,
      createdAt: new Date().toISOString(),
    };

    // Try saving to Express + MongoDB backend if running
    try {
      const backendRes = await fetch(`${BACKEND_BASE}/api/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify(body),
      });
      if (backendRes.ok) {
        const backendData = await backendRes.json();
        if (backendData?.product) {
          savedProduct = backendData.product;
        }
      }
    } catch {
      // Save to local server catalog below
    }

    const catalog = readServerCatalog();
    writeServerCatalog([savedProduct, ...catalog]);

    return NextResponse.json({ product: savedProduct }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create product." }, { status: 500 });
  }
}

