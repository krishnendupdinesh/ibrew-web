import { NextRequest, NextResponse } from "next/server";
import { readServerCatalog, writeServerCatalog } from "../../../../../lib/serverProductCatalog";
import type { ProductSize } from "../../../../../lib/productStore";

const BACKEND_BASE = process.env.BACKEND_URL || "http://localhost:5001";

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

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const sizes = normalizeSizes(body.sizes);
    if (sizes.length === 0) {
      return NextResponse.json(
        { error: "Add at least one size with a valid label and price." },
        { status: 400 }
      );
    }

    const catalog = readServerCatalog();
    const idx = catalog.findIndex((p) => p.id === id || p.slug === id);
    const existing = idx >= 0 ? catalog[idx] : null;

    const cleanTags: string[] = Array.isArray(body.tags)
      ? Array.from(new Set(body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)))
      : existing?.tags ?? [];

    if (body.isBestSeller && !cleanTags.includes("Bestseller")) cleanTags.push("Bestseller");
    if (body.isMostSelling && !cleanTags.includes("Most Selling")) cleanTags.push("Most Selling");

    let updatedProduct = {
      ...(existing ?? {}),
      id: existing?.id ?? id,
      slug: existing?.slug ?? id,
      name: String(body.name ?? existing?.name ?? "").trim(),
      section: body.section ?? existing?.section ?? "coffee",
      category: String(body.category ?? existing?.category ?? "").trim(),
      description: String(body.description ?? existing?.description ?? "").trim(),
      detail:
        String(body.detail ?? "").trim() ||
        String(body.description ?? existing?.description ?? "")
          .trim()
          .slice(0, 60),
      image: String(body.image ?? existing?.image ?? "").trim(),
      badge: String(body.badge ?? "").trim(),
      tags: cleanTags,
      isBestSeller: Boolean(body.isBestSeller),
      isMostSelling: Boolean(body.isMostSelling),
      featuredOnHome: body.featuredOnHome !== undefined ? Boolean(body.featuredOnHome) : true,
      rating: Math.min(5, Math.max(0, Number(body.rating) || 4.7)),
      reviewCount: Math.max(0, Math.floor(Number(body.reviewCount) || 0)),
      sizes,
    };

    try {
      const backendRes = await fetch(`${BACKEND_BASE}/api/admin/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify(body),
      });
      if (backendRes.status === 401 || backendRes.status === 403 || backendRes.status === 400 || backendRes.status === 404) {
        const errData = await backendRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData.error || "Could not update product." },
          { status: backendRes.status }
        );
      }
      if (backendRes.ok) {
        const backendData = await backendRes.json();
        if (backendData?.product) updatedProduct = backendData.product;
      }
    } catch {
      // fallback to local server catalog
    }

    if (idx >= 0) {
      catalog[idx] = updatedProduct;
      writeServerCatalog(catalog);
    } else {
      writeServerCatalog([updatedProduct, ...catalog]);
    }

    return NextResponse.json({ product: updatedProduct });
  } catch {
    return NextResponse.json({ error: "Could not update product." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const catalog = readServerCatalog();
    const idx = catalog.findIndex((p) => p.id === id || p.slug === id);

    // 1. Try Express + MySQL backend first
    try {
      const backendRes = await fetch(`${BACKEND_BASE}/api/admin/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify(body),
      });
      if (backendRes.status === 401 || backendRes.status === 403 || backendRes.status === 400 || backendRes.status === 404) {
        const errData = await backendRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData.error || "Could not update product." },
          { status: backendRes.status }
        );
      }
      if (backendRes.ok) {
        const backendData = await backendRes.json();
        if (backendData?.product) {
          if (idx >= 0) {
            catalog[idx] = backendData.product;
            writeServerCatalog(catalog);
          } else {
            writeServerCatalog([backendData.product, ...catalog]);
          }
          return NextResponse.json({ product: backendData.product });
        }
      }
    } catch {
      // fallback to local server catalog below
    }

    if (idx < 0) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const existing = { ...catalog[idx], tags: [...(catalog[idx].tags ?? [])] };

    if (body.isBestSeller !== undefined) {
      existing.isBestSeller = Boolean(body.isBestSeller);
      if (existing.isBestSeller && !existing.tags.includes("Bestseller")) {
        existing.tags.push("Bestseller");
      } else if (!existing.isBestSeller) {
        existing.tags = existing.tags.filter((t) => t !== "Bestseller");
      }
      if (existing.isBestSeller && !existing.badge) {
        existing.badge = "Bestseller";
      } else if (!existing.isBestSeller && existing.badge === "Bestseller") {
        existing.badge = existing.isMostSelling ? "Most Selling" : "";
      }
    }

    if (body.isMostSelling !== undefined) {
      existing.isMostSelling = Boolean(body.isMostSelling);
      if (existing.isMostSelling && !existing.tags.includes("Most Selling")) {
        existing.tags.push("Most Selling");
      } else if (!existing.isMostSelling) {
        existing.tags = existing.tags.filter((t) => t !== "Most Selling");
      }
      if (existing.isMostSelling && (!existing.badge || existing.badge === "Bestseller")) {
        existing.badge = "Most Selling";
      } else if (!existing.isMostSelling && existing.badge === "Most Selling") {
        existing.badge = existing.isBestSeller ? "Bestseller" : "";
      }
    }

    if (body.featuredOnHome !== undefined) {
      existing.featuredOnHome = Boolean(body.featuredOnHome);
    }

    if (body.badge !== undefined) {
      existing.badge = String(body.badge).trim();
    }

    if (body.sizes !== undefined) {
      const sizes = normalizeSizes(body.sizes);
      if (sizes.length > 0) existing.sizes = sizes;
    }

    catalog[idx] = existing;
    writeServerCatalog(catalog);
    return NextResponse.json({ product: existing });
  } catch {
    return NextResponse.json({ error: "Could not update product." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    try {
      const backendRes = await fetch(`${BACKEND_BASE}/api/admin/products/${id}`, {
        method: "DELETE",
        headers: {
          cookie: req.headers.get("cookie") || "",
        },
      });
      if (backendRes.status === 401 || backendRes.status === 403 || backendRes.status === 404) {
        const errData = await backendRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData.error || "Could not delete product." },
          { status: backendRes.status }
        );
      }
    } catch {
      // ignore backend error
    }

    const catalog = readServerCatalog().filter((p) => p.id !== id && p.slug !== id);
    writeServerCatalog(catalog);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete product." }, { status: 500 });
  }
}

