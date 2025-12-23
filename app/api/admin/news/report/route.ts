import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.NEWS_CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sb = supabaseAdmin();

  const { data } = await sb
    .from("news_metrics")
    .select(
      "views,clicks,avg_dwell_seconds,article_id,news_articles(category,slug,title_en,title_zh)"
    )
    .limit(5000);

  const metrics = data || [];
  const totals = {
    views: 0,
    clicks: 0,
    avgDwell: 0,
    ctr: 0
  };

  const categoryMap = new Map<
    string,
    { category: string; views: number; clicks: number; avgDwell: number; ctr: number }
  >();

  const articles = metrics.map((row: any) => {
    const article = Array.isArray(row.news_articles) ? row.news_articles[0] : row.news_articles;
    const views = Number(row.views || 0);
    const clicks = Number(row.clicks || 0);
    const avg = Number(row.avg_dwell_seconds || 0);
    const category = article?.category || "unknown";
    const title = article?.title_zh || article?.title_en || "Untitled";

    totals.views += views;
    totals.clicks += clicks;
    totals.avgDwell += avg * views;

    const current = categoryMap.get(category) || {
      category,
      views: 0,
      clicks: 0,
      avgDwell: 0,
      ctr: 0
    };
    current.views += views;
    current.clicks += clicks;
    current.avgDwell += avg * views;
    categoryMap.set(category, current);

    return {
      articleId: row.article_id,
      slug: article?.slug,
      title,
      views,
      clicks,
      avgDwellSeconds: avg,
      ctr: views > 0 ? clicks / views : 0
    };
  });

  totals.ctr = totals.views > 0 ? totals.clicks / totals.views : 0;
  totals.avgDwell = totals.views > 0 ? totals.avgDwell / totals.views : 0;

  const categories = Array.from(categoryMap.values()).map((item) => ({
    ...item,
    avgDwell: item.views > 0 ? item.avgDwell / item.views : 0,
    ctr: item.views > 0 ? item.clicks / item.views : 0
  }));

  articles.sort((a, b) => b.views - a.views);
  categories.sort((a, b) => b.views - a.views);

  return NextResponse.json(
    {
      totals,
      topArticles: articles.slice(0, 10),
      categories
    },
    { status: 200 }
  );
}
