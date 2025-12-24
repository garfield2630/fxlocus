import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/system/guard";
import { hashPassword } from "@/lib/system/password";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const admin = supabaseAdmin();
    const body = await req.json().catch(() => null);
    const userId = String(body?.userId || "");
    const newPassword = String(body?.newPassword || "");

    if (!userId || !newPassword) return json({ ok: false, error: "INVALID_BODY" }, 400);

    const now = new Date().toISOString();
    const passwordHash = await hashPassword(newPassword);

    const up = await admin
      .from("system_users")
      .update({ password_hash: passwordHash, updated_at: now, must_change_password: false })
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

