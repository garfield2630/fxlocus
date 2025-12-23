import { NextRequest, NextResponse } from "next/server";

import { ingestOnce } from "@/lib/news/ingest";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.NEWS_CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await ingestOnce();
  return NextResponse.json({ ok: true, result }, { status: 200 });
}
