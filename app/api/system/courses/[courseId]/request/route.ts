import { NextRequest, NextResponse } from "next/server";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(_req: NextRequest, ctx: { params: { courseId: string } }) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);

  const courseId = Number(ctx.params.courseId);
  if (!Number.isInteger(courseId) || courseId < 1 || courseId > 20) {
    return noStoreJson({ ok: false, error: "INVALID_COURSE" }, 400);
  }

  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  const { data: existing, error: existErr } = await admin
    .from("course_access")
    .select("id,status")
    .eq("user_id", auth.user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existErr) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);

  if (!existing) {
    const { error } = await admin.from("course_access").insert({
      user_id: auth.user.id,
      course_id: courseId,
      status: "requested",
      requested_at: now,
      updated_at: now
    });
    if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
    return noStoreJson({ ok: true });
  }

  if (existing.status === "rejected") {
    const { error } = await admin
      .from("course_access")
      .update({
        status: "requested",
        requested_at: now,
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null,
        updated_at: now
      })
      .eq("id", existing.id);
    if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
  }

  return noStoreJson({ ok: true });
}

