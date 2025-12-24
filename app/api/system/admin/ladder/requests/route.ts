import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    await requireAdmin();
    const admin = supabaseAdmin();

    const q = await admin
      .from("ladder_authorizations")
      .select("user_id,status,requested_at,system_users(full_name,email,phone)")
      .eq("status", "requested")
      .order("requested_at", { ascending: false })
      .limit(300);

    if (q.error) return json({ ok: false, error: q.error.message }, 500);
    return json({ ok: true, items: q.data || [] });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

