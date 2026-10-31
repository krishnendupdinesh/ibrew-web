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
        const backendList: StoreProduct[] = data.products;
        if (!section) {
          writeServerCatalog(backendList);
        }
        return NextResponse.json({ products: backendList });
      }
    }
  } catch {
    // Backend unreachable or not restarted yet — fall back to server catalog file
  }

  return NextResponse.json({
    products: filterCatalogBySection(localCatalog, section),
  });
}

