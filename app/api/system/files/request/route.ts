import { NextResponse } from "next/server";

import { requireStudent } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const { user, supabase } = await requireStudent();
    const body = await req.json().catch(() => null);

    const fileId = String(body?.fileId || "");
    if (!fileId) return json({ ok: false, error: "INVALID_FILE" }, 400);

    const now = new Date().toISOString();

    const { data: existing, error: existErr } = await supabase
      .from("file_access_requests")
      .select("status")
      .eq("user_id", user.id)
      .eq("file_id", fileId)
      .maybeSingle();

    if (existErr) return json({ ok: false, error: existErr.message }, 500);

    if (!existing) {
      const ins = await supabase.from("file_access_requests").insert({
        user_id: user.id,
        file_id: fileId,
        status: "requested",
        requested_at: now,
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null
      } as any);
      if (ins.error) return json({ ok: false, error: ins.error.message }, 500);
      return json({ ok: true });
    }

    if (existing.status === "rejected") {
      const up = await supabase
        .from("file_access_requests")
        .update({
          status: "requested",
          requested_at: now,
          reviewed_at: null,
          reviewed_by: null,
          rejection_reason: null
        } as any)
        .eq("user_id", user.id)
        .eq("file_id", fileId);

      if (up.error) return json({ ok: false, error: up.error.message }, 500);
    }

    return json({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

