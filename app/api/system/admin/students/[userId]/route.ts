import { NextRequest, NextResponse } from "next/server";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_req: NextRequest, ctx: { params: { userId: string } }) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);
  if (auth.user.role !== "admin") return noStoreJson({ ok: false, error: "FORBIDDEN" }, 403);

  const userId = ctx.params.userId;
  if (!userId) return noStoreJson({ ok: false, error: "INVALID_USER" }, 400);

  const admin = supabaseAdmin();

  const [{ data: user }, { data: access }] = await Promise.all([
    admin
      .from("system_users")
      .select(
        "id,full_name,email,phone,role,status,must_change_password,default_open_courses,created_at,last_login_at"
      )
      .eq("id", userId)
      .maybeSingle(),
    admin.from("course_access").select("*").eq("user_id", userId).order("course_id", { ascending: true })
  ]);

  if (!user) return noStoreJson({ ok: false, error: "NOT_FOUND" }, 404);

  return noStoreJson({ ok: true, user, access: access || [] });
}

