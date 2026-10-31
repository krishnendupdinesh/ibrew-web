import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Admin uses permanent credentials configured by the store owner." },
    { status: 403 }
  );
}
