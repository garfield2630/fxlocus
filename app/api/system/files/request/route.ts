import { NextResponse } from "next/server";

import { requireStudent } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const { user } = await requireStudent();
    const admin = supabaseAdmin();
    const body = await req.json().catch(() => null);

    const fileId = String(body?.fileId || "");
    if (!fileId) return json({ ok: false, error: "INVALID_FILE" }, 400);

    const now = new Date().toISOString();
    const up = await admin
      .from("file_access_requests")
      .upsert(
        {
          user_id: user.id,
          file_id: fileId,
          status: "requested",
          requested_at: now,
          reviewed_at: null,
          reviewed_by: null,
          rejection_reason: null
        } as any,
        { onConflict: "user_id,file_id" }
      )
      .select("user_id,file_id,status")
      .maybeSingle();

    if (up.error) return json({ ok: false, error: up.error.message }, 500);
    return json({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

