import { NextRequest, NextResponse } from "next/server";
import { readServerCatalog, writeServerCatalog } from "../../../../../lib/serverProductCatalog";
import type { ProductSize } from "../../../../../lib/productStore";
import { getBackendUrl } from "../../../../../lib/backendConfig";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

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

    const backendBase = getBackendUrl();
    let updatedProduct;

    try {
      const backendRes = await fetch(`${backendBase}/api/admin/products/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify(body),
      });

      const backendData = await backendRes.json().catch(() => ({}));
      if (!backendRes.ok) {
        return NextResponse.json(
          { error: backendData.error || "Could not update product in database." },
          { status: backendRes.status || 500 }
        );
      }
      if (backendData?.product) {
        updatedProduct = backendData.product;
      }
    } catch (err) {
      console.error("Backend MySQL connection error in admin PUT:", err);
      return NextResponse.json(
        { error: "Could not connect to database backend." },
        { status: 503 }
      );
    }

    const catalog = readServerCatalog();
    const idx = catalog.findIndex((p) => p.id === id || p.slug === id);
    if (idx >= 0 && updatedProduct) {
      catalog[idx] = updatedProduct;
      writeServerCatalog(catalog);
    }

    return NextResponse.json({ product: updatedProduct }, { headers: NO_CACHE_HEADERS });
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
    const backendBase = getBackendUrl();

    let updatedProduct;
    try {
      const backendRes = await fetch(`${backendBase}/api/admin/products/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
        },
        body: JSON.stringify(body),
      });

      const backendData = await backendRes.json().catch(() => ({}));
      if (!backendRes.ok) {
        return NextResponse.json(
          { error: backendData.error || "Could not patch product in database." },
          { status: backendRes.status || 500 }
        );
      }
      if (backendData?.product) {
        updatedProduct = backendData.product;
      }
    } catch (err) {
      console.error("Backend MySQL connection error in admin PATCH:", err);
      return NextResponse.json(
        { error: "Could not connect to database backend." },
        { status: 503 }
      );
    }

    const catalog = readServerCatalog();
    const idx = catalog.findIndex((p) => p.id === id || p.slug === id);
    if (idx >= 0 && updatedProduct) {
      catalog[idx] = updatedProduct;
      writeServerCatalog(catalog);
    }

    return NextResponse.json({ product: updatedProduct }, { headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: "Could not patch product." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const backendBase = getBackendUrl();

    let backendData: { error?: string; ok?: boolean } = {};
    let backendRes: Response | null = null;

    try {
      const headers: Record<string, string> = {};
      const cookie = req.headers.get("cookie");
      if (cookie) headers["cookie"] = cookie;
      const auth = req.headers.get("authorization");
      if (auth) headers["authorization"] = auth;

      backendRes = await fetch(`${backendBase}/api/admin/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers,
      });

      backendData = await backendRes.json().catch(() => ({}));
      if (!backendRes.ok) {
        const errorRes = NextResponse.json(
          { error: backendData.error || "Could not delete product from database." },
          { status: backendRes.status || 500 }
        );

        // Forward any Set-Cookie headers
        const setCookies = backendRes.headers.getSetCookie ? backendRes.headers.getSetCookie() : [];
        if (setCookies && setCookies.length > 0) {
          setCookies.forEach((c) => errorRes.headers.append("set-cookie", c));
        } else {
          const raw = backendRes.headers.get("set-cookie");
          if (raw) errorRes.headers.set("set-cookie", raw);
        }
        return errorRes;
      }
    } catch (err) {
      console.error("Backend MySQL connection error in admin DELETE:", err);
      return NextResponse.json(
        { error: "Could not connect to database backend." },
        { status: 503 }
      );
    }

    const catalog = readServerCatalog().filter((p) => p.id !== id && p.slug !== id);
    writeServerCatalog(catalog);

    const successRes = NextResponse.json({ ok: true }, { headers: NO_CACHE_HEADERS });
    if (backendRes) {
      const setCookies = backendRes.headers.getSetCookie ? backendRes.headers.getSetCookie() : [];
      if (setCookies && setCookies.length > 0) {
        setCookies.forEach((c) => successRes.headers.append("set-cookie", c));
      } else {
        const raw = backendRes.headers.get("set-cookie");
        if (raw) successRes.headers.set("set-cookie", raw);
      }
    }

    return successRes;
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "Could not delete product.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

