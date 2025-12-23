import { NextRequest, NextResponse } from "next/server";

import { ingestOnce } from "@/lib/news/ingest";

export const runtime = "nodejs";

async function handle(secret: string | null) {
  if (!secret || secret !== process.env.NEWS_CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await ingestOnce();
  return NextResponse.json({ ok: true, result }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  return handle(secret);
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  return handle(secret);
}
