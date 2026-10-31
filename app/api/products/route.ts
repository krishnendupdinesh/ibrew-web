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
  const localCatalog = readServerCatalog();

  try {
    const backendUrl = new URL("/api/products", BACKEND_BASE);
    if (section) backendUrl.searchParams.set("section", section);

    const res = await fetch(backendUrl.toString(), {
      cache: "no-store",
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.products)) {
        // Merge any items in localCatalog that aren't in backend yet so newly added items never disappear
        const backendList: StoreProduct[] = data.products;
        const seen = new Set(backendList.map((p) => (p.slug || p.id || p.name).toLowerCase()));
        const extraFromLocal = filterCatalogBySection(localCatalog, section).filter(
          (p) => !seen.has((p.slug || p.id || p.name).toLowerCase())
        );
        return NextResponse.json({ products: [...extraFromLocal, ...backendList] });
      }
    }
  } catch {
    // Backend unreachable or not restarted yet — fall back to server catalog file
  }

  return NextResponse.json({
    products: filterCatalogBySection(localCatalog, section),
  });
}

