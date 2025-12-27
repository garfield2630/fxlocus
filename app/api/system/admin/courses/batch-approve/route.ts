import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  userId: z.string().optional(),
  fromCourseId: z.number().int().min(1).max(20).optional(),
  toCourseId: z.number().int().min(1).max(20).optional()
});

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let adminUserId = "";
  let supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"];
  try {
    const ctx = await requireAdmin();
    adminUserId = ctx.user.id;
    supabase = ctx.supabase;
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return noStoreJson({ ok: false, error: code }, status);
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ ok: false, error: "INVALID_BODY" }, 400);

  const now = new Date().toISOString();

  let selectQuery = supabase!
    .from("course_access")
    .select("user_id,course_id")
    .eq("status", "requested");

  if (parsed.data.userId) selectQuery = selectQuery.eq("user_id", parsed.data.userId);
  if (parsed.data.fromCourseId) selectQuery = selectQuery.gte("course_id", parsed.data.fromCourseId);
  if (parsed.data.toCourseId) selectQuery = selectQuery.lte("course_id", parsed.data.toCourseId);

  const { data: targets, error: selErr } = await selectQuery.limit(2000);
  if (selErr) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);

  let updateQuery = supabase!
    .from("course_access")
    .update({
      status: "approved",
      reviewed_at: now,
      reviewed_by: adminUserId,
      rejection_reason: null
    })
    .eq("status", "requested");

  if (parsed.data.userId) updateQuery = updateQuery.eq("user_id", parsed.data.userId);
  if (parsed.data.fromCourseId) updateQuery = updateQuery.gte("course_id", parsed.data.fromCourseId);
  if (parsed.data.toCourseId) updateQuery = updateQuery.lte("course_id", parsed.data.toCourseId);

  const { error } = await updateQuery;
  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);

  const courseIds = Array.from(new Set((targets || []).map((t: any) => Number(t.course_id)).filter(Boolean)));
  const { data: courses } = courseIds.length
    ? await supabase!.from("courses").select("id,title_zh,title_en").in("id", courseIds)
    : { data: [] as any[] };
  const courseById = new Map((courses || []).map((c: any) => [c.id, c]));

  const notifications = (targets || []).map((t: any) => {
    const c = courseById.get(Number(t.course_id));
    const label = `#${t.course_id} ${c?.title_zh || c?.title_en || ""}`.trim();
    return {
      to_user_id: t.user_id,
      from_user_id: adminUserId,
      title: "课程申请已通过 / Course approved",
      content: `你的课程申请已通过：${label}\n\nYour course request has been approved: ${label}`
    };
  });

  if (notifications.length) {
    const ins = await supabase!.from("notifications").insert(notifications as any);
    if (ins.error) return noStoreJson({ ok: false, error: "NOTIFY_FAILED" }, 500);
  }

  return noStoreJson({ ok: true });
}
