import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/system/guard";
import { isSuperAdmin, type SystemRole } from "@/lib/system/roles";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_req: Request, ctx: { params: { userId: string } }) {
  let adminRole: SystemRole | null = null;
  try {
    const { user } = await requireAdmin();
    adminRole = user.role;
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return noStoreJson({ ok: false, error: code }, status);
  }

  const userId = ctx.params.userId;
  if (!userId) return noStoreJson({ ok: false, error: "INVALID_USER" }, 400);

  const admin = supabaseAdmin();

  const [{ data: user }, { data: access }] = await Promise.all([
    admin
      .from("system_users")
      .select(
        "id,full_name,email,phone,role,status,must_change_password,default_open_courses,created_at,last_login_at,password_updated_at,password_updated_reason,password_updated_by"
      )
      .eq("id", userId)
      .maybeSingle(),
    admin.from("course_access").select("*").eq("user_id", userId).order("course_id", { ascending: true })
  ]);

  if (!user) return noStoreJson({ ok: false, error: "NOT_FOUND" }, 404);
  if (!adminRole || (!isSuperAdmin(adminRole) && user.role !== "student")) {
    return noStoreJson({ ok: false, error: "FORBIDDEN" }, 403);
  }

  return noStoreJson({ ok: true, user, access: access || [] });
}
