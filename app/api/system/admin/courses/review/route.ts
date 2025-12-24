import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";

const Body = z.object({
  accessId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().max(500).optional()
});

const BodyByUser = z.object({
  userId: z.string().min(1),
  courseId: z.coerce.number().int().min(1),
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional()
});

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);
  if (auth.user.role !== "admin") return noStoreJson({ ok: false, error: "FORBIDDEN" }, 403);

  const raw = await req.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  const parsedByUser = BodyByUser.safeParse(raw);
  if (!parsed.success && !parsedByUser.success) return noStoreJson({ ok: false, error: "INVALID_BODY" }, 400);

  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  if (parsed.success) {
    const payload: Record<string, unknown> = {
      reviewed_at: now,
      reviewed_by: auth.user.id,
      updated_at: now
    };

    if (parsed.data.action === "approve") {
      payload.status = "approved";
      payload.rejection_reason = null;
    } else {
      payload.status = "rejected";
      payload.rejection_reason = parsed.data.rejectionReason || "Rejected";
    }

    const { error } = await admin.from("course_access").update(payload).eq("id", parsed.data.accessId);
    if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
    return noStoreJson({ ok: true });
  }

  if (!parsedByUser.success) {
    return noStoreJson({ ok: false, error: "INVALID_BODY" }, 400);
  }

  const status = parsedByUser.data.action === "approve" ? "approved" : "rejected";
  const reason = parsedByUser.data.reason || "Rejected";

  const { data: existing, error: existErr } = await admin
    .from("course_access")
    .select("id")
    .eq("user_id", parsedByUser.data.userId)
    .eq("course_id", parsedByUser.data.courseId)
    .maybeSingle();

  if (existErr) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);

  if (!existing?.id) {
    const ins = await admin.from("course_access").insert({
      user_id: parsedByUser.data.userId,
      course_id: parsedByUser.data.courseId,
      status,
      reviewed_at: now,
      reviewed_by: auth.user.id,
      rejection_reason: status === "rejected" ? reason : null,
      updated_at: now
    } as any);
    if (ins.error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
    return noStoreJson({ ok: true });
  }

  const upd = await admin
    .from("course_access")
    .update({
      status,
      reviewed_at: now,
      reviewed_by: auth.user.id,
      rejection_reason: status === "rejected" ? reason : null,
      updated_at: now
    })
    .eq("id", existing.id);

  if (upd.error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);

  return noStoreJson({ ok: true });
}
