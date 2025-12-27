import { NextRequest, NextResponse } from "next/server";

import { getIpFromHeaders, getUserAgent } from "@/lib/system/requestMeta";
import { requireSystemUser } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest, ctx: { params: { fileId: string } }) {
  const fileId = ctx.params.fileId;
  if (!fileId) return noStoreJson({ ok: false, error: "INVALID_FILE" }, 400);

  try {
    const { user, supabase } = await requireSystemUser();

    const { data: file, error: fileErr } = await supabase
      .from("files")
      .select("id,storage_bucket,storage_path")
      .eq("id", fileId)
      .maybeSingle();

    if (fileErr) return noStoreJson({ ok: false, error: fileErr.message }, 500);
    if (!file?.id) return noStoreJson({ ok: false, error: "NOT_FOUND" }, 404);

    let allowed = user.role === "super_admin";
    if (!allowed) {
      const seg = String(file.storage_path || "").split("/")[0];
      if (seg && seg === user.id) {
        allowed = true;
      } else {
        const perm = await supabase.from("file_permissions").select("file_id").eq("file_id", fileId).limit(1);
        allowed = Boolean(perm.data && perm.data.length);
      }
    }

    if (!allowed) return noStoreJson({ ok: false, error: "FORBIDDEN" }, 403);

    const { data: signed, error: signErr } = await supabase.storage
      .from(file.storage_bucket)
      .createSignedUrl(file.storage_path, 60);

    if (signErr || !signed?.signedUrl) return noStoreJson({ ok: false, error: "SIGN_FAILED" }, 500);

    const ip = getIpFromHeaders(req.headers);
    const ua = getUserAgent(req.headers);
    await supabase.from("file_download_logs").insert({
      file_id: fileId,
      user_id: user.id,
      ip,
      user_agent: ua
    } as any);

    return noStoreJson({ ok: true, url: signed.signedUrl });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return noStoreJson({ ok: false, error: code }, status);
  }
}
