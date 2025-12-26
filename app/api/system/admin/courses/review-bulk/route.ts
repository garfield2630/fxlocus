import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  items: z
    .array(
      z.object({
        userId: z.string().uuid(),
        courseId: z.coerce.number().int().min(1).max(20)
      })
    )
    .min(1),
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional()
});

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const { user: adminUser } = await requireAdmin();
    const admin = supabaseAdmin();
    const raw = await req.json().catch(() => null);
    const parsed = Body.safeParse(raw);
    if (!parsed.success) return json({ ok: false, error: "INVALID_BODY" }, 400);

    const now = new Date().toISOString();
    const status = parsed.data.action === "approve" ? "approved" : "rejected";
    const rejectionReason = status === "rejected" ? String(parsed.data.reason || "Rejected") : null;

    const rows = parsed.data.items.map((it) => ({
      user_id: it.userId,
      course_id: it.courseId,
      status,
      reviewed_at: now,
      reviewed_by: adminUser.id,
      rejection_reason: rejectionReason
    }));

    const up = await admin.from("course_access").upsert(rows as any, { onConflict: "user_id,course_id" });
    if (up.error) return json({ ok: false, error: up.error.message }, 500);

    const courseIds = Array.from(new Set(parsed.data.items.map((it) => it.courseId)));
    const { data: courses, error: courseErr } = courseIds.length
      ? await admin.from("courses").select("id,title_zh,title_en").in("id", courseIds)
      : { data: [], error: null };
    if (courseErr) return json({ ok: false, error: courseErr.message }, 500);

    const courseById = new Map((courses || []).map((c: any) => [c.id, c]));
    const notifications = parsed.data.items.map((it) => {
      const c = courseById.get(it.courseId);
      const label = `#${it.courseId} ${c?.title_zh || c?.title_en || ""}`.trim();
      const title =
        status === "approved"
          ? "课程申请已通过 / Course approved"
          : "课程申请被拒绝 / Course rejected";
      const content =
        status === "approved"
          ? `你的课程申请已通过：${label}\n\nYour course request has been approved: ${label}`
          : `你的课程申请被拒绝：${label}\n原因：${rejectionReason}\n\nYour course request was rejected: ${label}\nReason: ${rejectionReason}`;

      return {
        to_user_id: it.userId,
        from_user_id: adminUser.id,
        title,
        content
      };
    });

    const ins = await admin.from("notifications").insert(notifications as any);
    if (ins.error) return json({ ok: false, error: ins.error.message }, 500);

    return json({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}
