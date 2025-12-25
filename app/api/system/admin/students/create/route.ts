import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/system/guard";
import { hashPassword } from "@/lib/system/password";
import { isStrongSystemPassword } from "@/lib/system/passwordPolicy";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(3).max(40).optional().or(z.literal("")),
  initialPassword: z.string().min(6).max(128),
  defaultOpenCourses: z.number().int().min(0).max(20).optional().default(0)
});

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let adminUserId = "";
  try {
    const ctx = await requireAdmin();
    adminUserId = ctx.user.id;
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return noStoreJson({ ok: false, error: code }, status);
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ ok: false, error: "INVALID_BODY" }, 400);
  if (!isStrongSystemPassword(parsed.data.initialPassword)) {
    return noStoreJson({ ok: false, error: "WEAK_PASSWORD" }, 400);
  }

  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  const passwordHash = await hashPassword(parsed.data.initialPassword);
  const email = parsed.data.email?.trim() || null;
  const phone = parsed.data.phone?.trim() || null;

  const { data: created, error } = await admin
    .from("system_users")
    .insert({
      full_name: parsed.data.fullName,
      email,
      phone,
      password_hash: passwordHash,
      role: "student",
      status: "active",
      must_change_password: true,
      default_open_courses: parsed.data.defaultOpenCourses,
      created_at: now,
      password_updated_at: now,
      password_updated_by: adminUserId,
      password_updated_reason: "admin_reset",
      updated_at: now
    })
    .select("id")
    .single();

  if (error || !created?.id) {
    return noStoreJson({ ok: false, error: error?.message || "DB_ERROR" }, 500);
  }

  if (parsed.data.defaultOpenCourses > 0) {
    const courseIds = Array.from({ length: parsed.data.defaultOpenCourses }).map((_, i) => i + 1);
    await admin.from("course_access").upsert(
      courseIds.map((courseId) => ({
        user_id: created.id,
        course_id: courseId,
        status: "approved",
        requested_at: now,
        reviewed_at: now,
        reviewed_by: adminUserId,
        updated_at: now
      })),
      { onConflict: "user_id,course_id" }
    );
  }

  await admin.from("system_login_logs").insert({
    user_id: adminUserId,
    event: "user_created",
    meta: { createdUserId: created.id }
  });

  return noStoreJson({ ok: true, id: created.id });
}
