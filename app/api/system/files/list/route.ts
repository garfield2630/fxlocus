import { NextResponse } from "next/server";

import { requireStudent } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const { user } = await requireStudent();
    const admin = supabaseAdmin();

    const perms = await admin
      .from("file_permissions")
      .select("file_id")
      .eq("user_id", user.id);

    if (perms.error) return json({ ok: false, error: perms.error.message }, 500);

    const fileIds = Array.from(
      new Set((perms.data || []).map((p: any) => p.file_id).filter(Boolean))
    );

    if (!fileIds.length) return json({ ok: true, files: [] });

    const files = await admin
      .from("files")
      .select("id,category,name,description,size_bytes,created_at")
      .in("id", fileIds)
      .order("created_at", { ascending: false });

    if (files.error) return json({ ok: false, error: files.error.message }, 500);
    return json({ ok: true, files: files.data || [] });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}
