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

  const { data: access } = await admin
    .from("course_access")
    .select("id,status")
    .eq("user_id", auth.user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!access) return noStoreJson({ ok: false, error: "NO_ACCESS" }, 403);
  if (access.status !== "approved" && access.status !== "completed") {
    return noStoreJson({ ok: false, error: "NOT_APPROVED" }, 403);
  }

  const { error } = await admin
    .from("course_access")
    .update({
      status: "completed",
      progress: 100,
      completed_at: now,
      updated_at: now
    })
    .eq("id", access.id);

  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
  return noStoreJson({ ok: true });
}

