import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const admin = supabaseAdmin();
    const body = await req.json().catch(() => null);

    const fileId = String(body?.fileId || "");
    const userId = String(body?.userId || "");

    if (!fileId || !userId) return json({ ok: false, error: "INVALID_BODY" }, 400);

    await admin.from("file_permissions").delete().eq("file_id", fileId).eq("user_id", userId);
    const ins = await admin
      .from("file_permissions")
      .insert({ file_id: fileId, user_id: userId })
      .select("*")
      .single();

    if (ins.error) return json({ ok: false, error: ins.error.message }, 500);
    return json({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

