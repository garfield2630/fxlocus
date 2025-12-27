import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.NEWS_CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sb = supabaseAdmin();
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status") || "pending";
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(10, Number(searchParams.get("pageSize") || 20)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = sb
    .from("news_articles")
    .select(
      "id,slug,url,title_en,title_zh,summary_en,summary_zh,author,published_at,category,importance,sentiment,symbols,status,scheduled_at,news_sources(name,logo_url),news_metrics(views,clicks,avg_dwell_seconds)",
      { count: "exact" }
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q.length >= 2) {
    query = query.or(`title_en.ilike.%${q}%,title_zh.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ items: [], total: 0 }, { status: 200 });

  const items = (data || []).map((item: any) => {
    const metrics = Array.isArray(item.news_metrics) ? item.news_metrics[0] : item.news_metrics;
    const source = Array.isArray(item.news_sources) ? item.news_sources[0] : item.news_sources;
    return {
      ...item,
      news_metrics: metrics || null,
      news_sources: source || null
    };
  });

  return NextResponse.json({ items, total: count || 0 }, { status: 200 });
}

