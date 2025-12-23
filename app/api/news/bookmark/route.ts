import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sb = supabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const userId = body.userId as string | undefined;
  const articleId = body.articleId as string | undefined;
  const action = body.action as string | undefined;

  if (!userId || !articleId) return NextResponse.json({ ok: false }, { status: 400 });

  if (action === "remove") {
    await sb.from("news_bookmarks").delete().eq("user_id", userId).eq("article_id", articleId);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await sb
    .from("news_bookmarks")
    .upsert({ user_id: userId, article_id: articleId }, { onConflict: "user_id,article_id" });
  return NextResponse.json({ ok: true }, { status: 200 });
}
