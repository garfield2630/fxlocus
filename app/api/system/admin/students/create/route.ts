import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/system/guard";
import { isStrongSystemPassword } from "@/lib/system/passwordPolicy";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(3).max(40).optional().or(z.literal("")),
  initialPassword: z.string().min(8).max(64),
  defaultOpenCourses: z.number().int().min(0).max(20).optional().default(0),
  leaderId: z.string().uuid().optional().or(z.literal(""))
});

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let actorId = "";
  let actorRole: "leader" | "super_admin" = "leader";
  try {
    const ctx = await requireAdmin();
    actorId = ctx.user.id;
    actorRole = ctx.user.role === "super_admin" ? "super_admin" : "leader";
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

  const email = parsed.data.email.trim().toLowerCase();
  const phone = parsed.data.phone?.trim() || null;

  const leaderIdRaw = parsed.data.leaderId?.trim() || "";
  let leaderId: string | null = null;
  if (actorRole === "leader") {
    leaderId = actorId;
  } else {
    leaderId = leaderIdRaw ? leaderIdRaw : null;
    if (leaderId) {
      const { data: leader } = await admin.from("profiles").select("id,role").eq("id", leaderId).maybeSingle();
      if (!leader?.id || leader.role !== "leader") {
        return noStoreJson({ ok: false, error: "INVALID_LEADER" }, 400);
      }
    }
  }

  const createdAuth = await admin.auth.admin.createUser({
    email,
    password: parsed.data.initialPassword,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName }
  });

  if (createdAuth.error || !createdAuth.data.user?.id) {
    return noStoreJson({ ok: false, error: createdAuth.error?.message || "AUTH_CREATE_FAILED" }, 500);
  }

  const createdUserId = createdAuth.data.user.id;

  const profileUpsert = await admin.from("profiles").upsert(
    {
      id: createdUserId,
      email,
      full_name: parsed.data.fullName,
      phone,
      role: "student",
      leader_id: leaderId,
      student_status: "普通学员",
      status: "active",
      created_at: now,
      updated_at: now
    } as any,
    { onConflict: "id" }
  );

  if (profileUpsert.error) {
    await admin.auth.admin.deleteUser(createdUserId);
    return noStoreJson({ ok: false, error: profileUpsert.error.message }, 500);
  }

  if (parsed.data.defaultOpenCourses > 0) {
    const courseIds = Array.from({ length: parsed.data.defaultOpenCourses }).map((_, i) => i + 1);
    await admin.from("course_access").upsert(
      courseIds.map((courseId) => ({
        user_id: createdUserId,
        course_id: courseId,
        status: "approved",
        requested_at: now,
        reviewed_at: now,
        reviewed_by: actorId,
        updated_at: now
      })),
      { onConflict: "user_id,course_id" }
    );
  }

  return noStoreJson({ ok: true, id: createdUserId });
}
