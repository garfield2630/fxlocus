import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return noStoreJson({ ok: false, error: code }, status);
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("files")
    .select("id,category,name,description,storage_bucket,storage_path,size_bytes,mime_type,created_at,uploaded_by")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
  return noStoreJson({ ok: true, items: data || [] });
}
