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
        fileId: z.string().uuid()
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

    const unique = new Map<string, { userId: string; fileId: string }>();
    for (const it of parsed.data.items) unique.set(`${it.userId}:${it.fileId}`, it);
    const items = Array.from(unique.values());

    if (status === "approved") {
      const perms = items.map((it) => ({ user_id: it.userId, file_id: it.fileId }));
      const up = await admin
        .from("file_permissions")
        .upsert(perms as any, { onConflict: "user_id,file_id" });
      if (up.error) return json({ ok: false, error: up.error.message }, 500);
    }

    const reqRows = items.map((it) => ({
      user_id: it.userId,
      file_id: it.fileId,
      status,
      reviewed_at: now,
      reviewed_by: adminUser.id,
      rejection_reason: rejectionReason
    }));

    const upReq = await admin
      .from("file_access_requests")
      .upsert(reqRows as any, { onConflict: "user_id,file_id" });
    if (upReq.error) return json({ ok: false, error: upReq.error.message }, 500);

    const fileIds = Array.from(new Set(items.map((it) => it.fileId)));
    const { data: files, error: fileErr } = fileIds.length
      ? await admin
          .from("files")
          .select("id,name,category")
          .in("id", fileIds)
      : { data: [], error: null };
    if (fileErr) return json({ ok: false, error: fileErr.message }, 500);
    const fileById = new Map((files || []).map((f: any) => [f.id, f]));

    const notifications = items.map((it) => {
      const f = fileById.get(it.fileId);
      const label = f ? `${f.category || ""} ${f.name || ""}`.trim() : it.fileId;
      return {
        to_user_id: it.userId,
        from_user_id: adminUser.id,
        title:
          status === "approved"
            ? "文件权限已通过 / File access approved"
            : "文件权限被拒绝 / File access rejected",
        content:
          status === "approved"
            ? `你的文件权限申请已通过：${label}\n\nYour file access request has been approved: ${label}`
            : `你的文件权限申请被拒绝：${label}\n原因：${rejectionReason}\n\nYour file access request was rejected: ${label}\nReason: ${rejectionReason}`
      };
    });

    const ins = await admin.from("notifications").insert(notifications as any);
    if (ins.error) return json({ ok: false, error: "NOTIFY_FAILED" }, 500);

    return json({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

