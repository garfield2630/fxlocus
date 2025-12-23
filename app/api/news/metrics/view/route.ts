import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const articleId = body.articleId as string | undefined;
  const dwellSeconds = Number(body.dwellSeconds || 0);

  if (!articleId) return NextResponse.json({ ok: false }, { status: 400 });

  const { data } = await sb
    .from("news_metrics")
    .select("*")
    .eq("article_id", articleId)
    .maybeSingle();

  if (!data) {
    await sb.from("news_metrics").insert({
      article_id: articleId,
      views: 1,
      avg_dwell_seconds: dwellSeconds || 0
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const views = Number(data.views || 0) + 1;
  const prevAvg = Number(data.avg_dwell_seconds || 0);
  const ds = Math.max(0, dwellSeconds);
  const avg = ds ? (prevAvg * (views - 1) + ds) / views : prevAvg;

  await sb
    .from("news_metrics")
    .update({ views, avg_dwell_seconds: avg, updated_at: new Date().toISOString() })
    .eq("article_id", articleId);

  return NextResponse.json({ ok: true }, { status: 200 });
}
