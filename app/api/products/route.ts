import { NextRequest, NextResponse } from "next/server";
import {
  filterCatalogBySection,
  readServerCatalog,
  writeServerCatalog,
} from "../../../lib/serverProductCatalog";
import type { StoreProduct } from "../../../lib/productStore";
import { getBackendUrl } from "../../../lib/backendConfig";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section");
  const q = req.nextUrl.searchParams.get("q");
  const category = req.nextUrl.searchParams.get("category");
  const localCatalog = readServerCatalog();
  const backendBase = getBackendUrl();

  try {
    const backendUrl = new URL("/api/products", backendBase);
    if (section) backendUrl.searchParams.set("section", section);
    if (q) backendUrl.searchParams.set("q", q);
    if (category) backendUrl.searchParams.set("category", category);

    const res = await fetch(backendUrl.toString(), {
      cache: "no-store",
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.products)) {
        const backendList: StoreProduct[] = data.products;
        if (!section && !q && !category) {
          writeServerCatalog(backendList);
        }
        return NextResponse.json({ products: backendList }, { headers: NO_CACHE_HEADERS });
      }
    }
  } catch {
    // Backend unreachable or not restarted yet — fall back to server catalog file
  }

  let filtered = filterCatalogBySection(localCatalog, section);
  if (q) {
    const query = q.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.badge?.toLowerCase().includes(query) ||
        p.tags?.some((t) => t.toLowerCase().includes(query))
    );
  }
  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }

  return NextResponse.json(
    { products: filtered },
    { headers: NO_CACHE_HEADERS }
  );
}

