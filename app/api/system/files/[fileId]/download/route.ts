import { NextRequest, NextResponse } from "next/server";

import { getIpFromHeaders, getUserAgent } from "@/lib/system/requestMeta";
import { getSystemAuth } from "@/lib/system/auth";
import { isAdminRole } from "@/lib/system/roles";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest, ctx: { params: { fileId: string } }) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);

  const fileId = ctx.params.fileId;
  if (!fileId) return noStoreJson({ ok: false, error: "INVALID_FILE" }, 400);

  const admin = supabaseAdmin();

  const { data: file, error: fileErr } = await admin
    .from("files")
    .select("id,storage_bucket,storage_path")
    .eq("id", fileId)
    .maybeSingle();

  if (fileErr || !file) return noStoreJson({ ok: false, error: "NOT_FOUND" }, 404);

  if (!isAdminRole(auth.user.role)) {
    const { data: classRows } = await admin
      .from("system_class_members")
      .select("class_id")
      .eq("user_id", auth.user.id);
    const classIds = (classRows || []).map((r: any) => r.class_id).filter(Boolean);

    const orParts = [`user_id.eq.${auth.user.id}`];
    if (classIds.length) orParts.push(`class_id.in.(${classIds.join(",")})`);

    const { data: perm } = await admin
      .from("file_permissions")
      .select("id")
      .eq("file_id", fileId)
      .or(orParts.join(","))
      .limit(1);
    if (!perm || !perm.length) return noStoreJson({ ok: false, error: "FORBIDDEN" }, 403);
  }

  const { data: signed, error: signErr } = await admin.storage
    .from(file.storage_bucket)
    .createSignedUrl(file.storage_path, 60);

  if (signErr || !signed?.signedUrl) return noStoreJson({ ok: false, error: "SIGN_FAILED" }, 500);

  const ip = getIpFromHeaders(req.headers);
  const ua = getUserAgent(req.headers);
  await admin.from("file_download_logs").insert({
    file_id: fileId,
    user_id: auth.user.id,
    ip,
    user_agent: ua
  });

  return noStoreJson({ ok: true, url: signed.signedUrl });
}
