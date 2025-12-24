import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";

const Body = z.object({
  userId: z.string().optional(),
  fromCourseId: z.number().int().min(1).max(20).optional(),
  toCourseId: z.number().int().min(1).max(20).optional()
});

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);
  if (auth.user.role !== "admin") return noStoreJson({ ok: false, error: "FORBIDDEN" }, 403);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ ok: false, error: "INVALID_BODY" }, 400);

  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  let query = admin
    .from("course_access")
    .update({
      status: "approved",
      reviewed_at: now,
      reviewed_by: auth.user.id,
      rejection_reason: null,
      updated_at: now
    })
    .eq("status", "requested");

  if (parsed.data.userId) query = query.eq("user_id", parsed.data.userId);
  if (parsed.data.fromCourseId) query = query.gte("course_id", parsed.data.fromCourseId);
  if (parsed.data.toCourseId) query = query.lte("course_id", parsed.data.toCourseId);

  const { error } = await query;
  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
  return noStoreJson({ ok: true });
}

