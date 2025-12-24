import { NextRequest, NextResponse } from "next/server";

import { ingestOnce } from "@/lib/news/ingest";

export const runtime = "nodejs";

function isVercelCron(req: NextRequest) {
  return Boolean(req.headers.get("x-vercel-cron"));
}

async function handle(req: NextRequest, secret: string | null) {
  const configuredSecret = process.env.NEWS_CRON_SECRET;
  if (configuredSecret) {
    if (!secret || secret !== configuredSecret) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  } else {
    if (!isVercelCron(req) && process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }
  const result = await ingestOnce();
  return NextResponse.json({ ok: true, result }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  return handle(req, secret);
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  return handle(req, secret);
}
