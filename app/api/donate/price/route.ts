import { NextResponse } from "next/server";

import { getDonatePrice } from "@/lib/donate/pricing";

export async function GET() {
  try {
    const data = await getDonatePrice();
    return NextResponse.json({ ok: true, ...data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
