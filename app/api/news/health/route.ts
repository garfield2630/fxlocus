import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  if (!hasSupabaseUrl || !hasServiceRole) {
    return NextResponse.json({
      ok: true,
      sourcesCount: 0,
      articlesCount: 0,
      publishedCount: 0,
      env: {
        hasSupabaseUrl,
        hasServiceRole,
        hasOpenAI
      }
    });
  }

  const sb = supabaseAdmin();

  const [{ count: sourcesCount }, { count: articlesCount }, { count: publishedCount }] =
    await Promise.all([
      sb.from("news_sources").select("*", { count: "exact", head: true }),
      sb.from("news_articles").select("*", { count: "exact", head: true }),
      sb.from("news_articles").select("*", { count: "exact", head: true }).eq("status", "published")
    ]);

  return NextResponse.json({
    ok: true,
    sourcesCount: sourcesCount || 0,
    articlesCount: articlesCount || 0,
    publishedCount: publishedCount || 0,
    env: {
      hasSupabaseUrl,
      hasServiceRole,
      hasOpenAI
    }
  });
}
