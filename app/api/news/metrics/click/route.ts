import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const articleId = body.articleId as string | undefined;

  if (!articleId) return NextResponse.json({ ok: false }, { status: 400 });

  const { data } = await sb
    .from("news_metrics")
    .select("*")
    .eq("article_id", articleId)
    .maybeSingle();

  if (!data) {
    await sb.from("news_metrics").insert({ article_id: articleId, clicks: 1 });
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const clicks = Number(data.clicks || 0) + 1;
  await sb
    .from("news_metrics")
    .update({ clicks, updated_at: new Date().toISOString() })
    .eq("article_id", articleId);

  return NextResponse.json({ ok: true }, { status: 200 });
}
