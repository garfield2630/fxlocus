import { NextRequest, NextResponse } from "next/server";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_req: NextRequest) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);

  const admin = supabaseAdmin();

  if (auth.user.role === "admin") {
    const { data, error } = await admin
      .from("files")
      .select("id,category,name,description,size_bytes,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
    return noStoreJson({ ok: true, items: data || [] });
  }

  const { data: classRows } = await admin
    .from("system_class_members")
    .select("class_id")
    .eq("user_id", auth.user.id);

  const classIds = (classRows || []).map((r: any) => r.class_id).filter(Boolean);

  const orParts = [`user_id.eq.${auth.user.id}`];
  if (classIds.length) orParts.push(`class_id.in.(${classIds.join(",")})`);

  const { data: perms, error: permErr } = await admin
    .from("file_permissions")
    .select("file_id")
    .or(orParts.join(","));
  if (permErr) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);

  const fileIds = Array.from(
    new Set((perms || []).map((p: any) => p.file_id).filter(Boolean))
  );

  if (!fileIds.length) return noStoreJson({ ok: true, items: [] });

  const { data: files, error: fileErr } = await admin
    .from("files")
    .select("id,category,name,description,size_bytes,created_at")
    .in("id", fileIds)
    .order("created_at", { ascending: false });

  if (fileErr) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
  return noStoreJson({ ok: true, items: files || [] });
}
