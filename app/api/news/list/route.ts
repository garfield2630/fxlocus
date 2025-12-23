import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sb = supabaseAdmin();
  const { searchParams } = new URL(req.url);

  const locale = (searchParams.get("locale") === "en" ? "en" : "zh") as "zh" | "en";
  const category = searchParams.get("category") || "all";
  const importance = searchParams.get("importance") || "all";
  const range = searchParams.get("range") || "today";
  const symbol = (searchParams.get("symbol") || "").trim().toUpperCase();
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(30, Math.max(10, Number(searchParams.get("pageSize") || 20)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const now = new Date();
  const start = new Date(now);
  if (range === "today") start.setDate(now.getDate() - 1);
  if (range === "week") start.setDate(now.getDate() - 7);
  if (range === "month") start.setMonth(now.getMonth() - 1);

  let query = sb
    .from("news_articles")
    .select(
      "id,slug,url,source_id,title_en,title_zh,summary_en,summary_zh,author,published_at,category,importance,sentiment,symbols,cover_image_url,status,scheduled_at,news_sources(name,logo_url),news_metrics(views,clicks)",
      { count: "exact" }
    )
    .eq("status", "published")
    .gte("published_at", start.toISOString())
    .or(`scheduled_at.is.null,scheduled_at.lte.${now.toISOString()}`)
    .order("published_at", { ascending: false })
    .range(from, to);

  if (category !== "all") query = query.eq("category", category);
  if (importance !== "all") query = query.eq("importance", importance);
  if (symbol) query = query.contains("symbols", [symbol]);

  if (q.length >= 2) {
    query = query.or(
      `title_en.ilike.%${q}%,title_zh.ilike.%${q}%,summary_en.ilike.%${q}%,summary_zh.ilike.%${q}%`
    );
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ items: [], total: 0 }, { status: 200 });

  const items = (data || []).map((item: any) => {
    const metrics = Array.isArray(item.news_metrics) ? item.news_metrics[0] : item.news_metrics;
    const source = Array.isArray(item.news_sources) ? item.news_sources[0] : item.news_sources;
    return {
      id: item.id,
      slug: item.slug,
      url: item.url,
      source: source?.name,
      logo: source?.logo_url,
      title: locale === "zh" ? item.title_zh || item.title_en : item.title_en || item.title_zh,
      summary:
        locale === "zh" ? item.summary_zh || item.summary_en : item.summary_en || item.summary_zh,
      author: item.author,
      publishedAt: item.published_at,
      category: item.category,
      importance: item.importance,
      sentiment: item.sentiment,
      symbols: item.symbols || [],
      views: metrics?.views || 0,
      clicks: metrics?.clicks || 0
    };
  });

  return NextResponse.json({ items, total: count || 0 }, { status: 200 });
}
