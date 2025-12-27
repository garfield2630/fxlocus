import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const { supabase } = await requireSuperAdmin();

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,phone,role,status,created_at,last_login_at")
      .in("role", ["leader", "super_admin"])
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, items: data || [] });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

