import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/system/guard";
import { isSuperAdmin } from "@/lib/system/roles";
import { hashPassword } from "@/lib/system/password";
import { isStrongSystemPassword } from "@/lib/system/passwordPolicy";
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
    const newPassword = String(body?.newPassword || "");

    if (!userId || !newPassword) return json({ ok: false, error: "INVALID_BODY" }, 400);
    if (!isStrongSystemPassword(newPassword)) return json({ ok: false, error: "WEAK_PASSWORD" }, 400);

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
    const passwordHash = await hashPassword(newPassword);

    const up = await admin
      .from("system_users")
      .update({
        password_hash: passwordHash,
        must_change_password: false,
        password_updated_at: now,
        password_updated_by: adminUser.id,
        password_updated_reason: "admin_reset",
        updated_at: now
      } as any)
      .eq("id", userId);

    if (up.error) return json({ ok: false, error: up.error.message }, 500);

    await admin
      .from("system_sessions")
      .update({ revoked_at: now, revoke_reason: "password_reset" })
      .eq("user_id", userId)
      .is("revoked_at", null);

    return json({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}
