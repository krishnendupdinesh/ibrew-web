import { NextRequest, NextResponse } from "next/server";
import {
  filterCatalogBySection,
  readServerCatalog,
  writeServerCatalog,
} from "../../../lib/serverProductCatalog";
import type { StoreProduct } from "../../../lib/productStore";

const BACKEND_BASE = process.env.BACKEND_URL || "http://localhost:5001";

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section");
  const q = req.nextUrl.searchParams.get("q");
  const category = req.nextUrl.searchParams.get("category");
  const localCatalog = readServerCatalog();

  try {
    const backendUrl = new URL("/api/products", BACKEND_BASE);
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
        return NextResponse.json({ products: backendList });
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

  return NextResponse.json({
    products: filtered,
  });
}

