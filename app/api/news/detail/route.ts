import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sb = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const locale = (searchParams.get("locale") === "en" ? "en" : "zh") as "zh" | "en";
  if (!slug) return NextResponse.json({ ok: false }, { status: 400 });

  const { data, error } = await sb
    .from("news_articles")
    .select("*,news_sources(name,logo_url),news_metrics(views,clicks,avg_dwell_seconds)")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ ok: false }, { status: 404 });

  if (
    data.status !== "published" ||
    (data.scheduled_at && new Date(data.scheduled_at) > new Date())
  ) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const metrics = Array.isArray(data.news_metrics) ? data.news_metrics[0] : data.news_metrics;
  const source = Array.isArray(data.news_sources) ? data.news_sources[0] : data.news_sources;
  const title = locale === "zh" ? data.title_zh || data.title_en : data.title_en || data.title_zh;
  const titleAlt = locale === "zh" ? data.title_en || data.title_zh : data.title_zh || data.title_en;
  const summary =
    locale === "zh" ? data.summary_zh || data.summary_en : data.summary_en || data.summary_zh;
  const keyPoints = locale === "zh" ? data.key_points_zh || [] : data.key_points_en || [];
  const lens = locale === "zh" ? data.fxlocus_lens_zh || "" : data.fxlocus_lens_en || "";
  const content =
    locale === "zh"
      ? data.content_zh || data.content_en || ""
      : data.content_en || data.content_zh || "";

  return NextResponse.json(
    {
      ok: true,
      article: {
        id: data.id,
        slug: data.slug,
        url: data.url,
        source: source?.name,
        logo: source?.logo_url,
        author: data.author,
        publishedAt: data.published_at,
        category: data.category,
        importance: data.importance,
        sentiment: data.sentiment,
        symbols: data.symbols || [],
        title,
        titleAlt,
        summary,
        coverImage: data.cover_image_url,
        keyPoints,
        lens,
        content,
        views: metrics?.views || 0,
        clicks: metrics?.clicks || 0
      }
    },
    { status: 200 }
  );
}
