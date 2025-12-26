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

    if (!userId) return json({ ok: false, error: "INVALID_BODY" }, 400);

    const { data: target, error: targetErr } = await admin
      .from("system_users")
      .select("id,role")
      .eq("id", userId)
      .maybeSingle();
    if (targetErr || !target) return json({ ok: false, error: "NOT_FOUND" }, 404);
    if (!isSuperAdmin(adminUser.role) && target.role !== "student") {
      return json({ ok: false, error: "FORBIDDEN" }, 403);
    }

    await admin.from("system_sessions").delete().eq("user_id", userId);
    await admin.from("course_access").delete().eq("user_id", userId);
    await admin.from("course_notes").delete().eq("user_id", userId);
    await admin.from("file_permissions").delete().eq("user_id", userId);
    await admin.from("file_download_logs").delete().eq("user_id", userId);
    await admin.from("ladder_authorizations").delete().eq("user_id", userId);
    await admin.from("system_class_members").delete().eq("user_id", userId);
    await admin.from("notifications").delete().eq("to_user_id", userId);
    await admin.from("notifications").delete().eq("from_user_id", userId);
    await admin.from("system_login_logs").delete().eq("user_id", userId);

    const del = await admin.from("system_users").delete().eq("id", userId);
    if (del.error) return json({ ok: false, error: del.error.message }, 500);

    return json({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}
