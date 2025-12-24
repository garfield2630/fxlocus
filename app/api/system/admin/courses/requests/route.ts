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
  if (auth.user.role !== "admin") return noStoreJson({ ok: false, error: "FORBIDDEN" }, 403);

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("course_access")
    .select(
      "id,user_id,course_id,status,requested_at,system_users(full_name,email,phone),courses(title_en,title_zh)"
    )
    .eq("status", "requested")
    .order("requested_at", { ascending: false })
    .limit(300);

  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
  return noStoreJson({ ok: true, items: data || [] });
}

