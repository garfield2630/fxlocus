import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdmin } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  userId: z.string().uuid()
});

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
    const admin = supabaseAdmin();
    const parsed = Body.safeParse(await req.json().catch(() => null));

    if (!parsed.success) return json({ ok: false, error: "INVALID_BODY" }, 400);

    const userId = parsed.data.userId;

    const { data: target, error: targetErr } = await admin.from("profiles").select("id,role").eq("id", userId).maybeSingle();
    if (targetErr) return json({ ok: false, error: targetErr.message }, 500);
    if (!target?.id) return json({ ok: false, error: "NOT_FOUND" }, 404);
    if (target.role !== "student") return json({ ok: false, error: "FORBIDDEN" }, 403);

    await admin.from("ladder_authorizations").delete().eq("user_id", userId);

    const del = await admin.auth.admin.deleteUser(userId);
    if (del.error) return json({ ok: false, error: del.error.message }, 500);

    return json({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}
