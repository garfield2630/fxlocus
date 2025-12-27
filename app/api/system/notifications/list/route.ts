import { NextRequest, NextResponse } from "next/server";

import { requireSystemUser } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_req: NextRequest) {
  try {
    const { user, supabase } = await requireSystemUser();
    const { data, error } = await supabase
    .from("notifications")
    .select("id,title,content,from_user_id,read_at,created_at")
    .eq("to_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

    if (error) return noStoreJson({ ok: false, error: error.message }, 500);
    return noStoreJson({ ok: true, items: data || [] });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return noStoreJson({ ok: false, error: code }, status);
  }
}
