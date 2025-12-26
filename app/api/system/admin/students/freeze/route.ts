import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/system/guard";
import { isSuperAdmin } from "@/lib/system/roles";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const { user: adminUser } = await requireAdmin();
    const admin = supabaseAdmin();
    const body = await req.json().catch(() => null);
    const userId = String(body?.userId || "");
    const freeze = Boolean(body?.freeze);

    if (!userId) return json({ ok: false, error: "INVALID_BODY" }, 400);

    const now = new Date().toISOString();
    const { data: target, error: targetErr } = await admin
      .from("system_users")
      .select("id,role")
      .eq("id", userId)
      .maybeSingle();
    if (targetErr || !target) return json({ ok: false, error: "NOT_FOUND" }, 404);
    if (!isSuperAdmin(adminUser.role) && target.role !== "student") {
      return json({ ok: false, error: "FORBIDDEN" }, 403);
    }
    const up = await admin
      .from("system_users")
      .update({ status: freeze ? "frozen" : "active", updated_at: now })
      .eq("id", userId);
    if (up.error) return json({ ok: false, error: up.error.message }, 500);

    if (freeze) {
      await admin
        .from("system_sessions")
        .update({ revoked_at: now, revoke_reason: "frozen" })
        .eq("user_id", userId)
        .is("revoked_at", null);
    }

    return json({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}
