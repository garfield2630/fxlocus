import { NextResponse } from "next/server";

import { requireStudent } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import { getIpFromHeaders, getUserAgent } from "@/lib/system/requestMeta";

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

    if (!fileId) return json({ ok: false, error: "INVALID_BODY" }, 400);

    const perm = await admin
      .from("file_permissions")
      .select("id")
      .eq("user_id", user.id)
      .eq("file_id", fileId)
      .maybeSingle();

    if (!perm.data) return json({ ok: false, error: "NOT_AUTHORIZED" }, 403);

    const f = await admin.from("files").select("*").eq("id", fileId).single();
    if (f.error) return json({ ok: false, error: f.error.message }, 500);

    const signed = await admin.storage
      .from(f.data.storage_bucket)
      .createSignedUrl(f.data.storage_path, 60);

    if (signed.error) return json({ ok: false, error: signed.error.message }, 500);

    const ip = getIpFromHeaders(req.headers);
    const ua = getUserAgent(req.headers);
    await admin.from("file_download_logs").insert({
      file_id: fileId,
      user_id: user.id,
      ip,
      user_agent: ua
    });

    return json({ ok: true, url: signed.data.signedUrl });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

