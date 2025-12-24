import { NextRequest, NextResponse } from "next/server";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_req: NextRequest) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("notifications")
    .select("id,title,content,from_user_id,read_at,created_at")
    .eq("to_user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
  return noStoreJson({ ok: true, items: data || [] });
}

