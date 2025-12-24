import { NextRequest, NextResponse } from "next/server";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

function safeFilename(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "file";
}

export async function POST(req: NextRequest) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);
  if (auth.user.role !== "admin") return noStoreJson({ ok: false, error: "FORBIDDEN" }, 403);

  const form = await req.formData().catch(() => null);
  if (!form) return noStoreJson({ ok: false, error: "INVALID_FORM" }, 400);

  const file = form.get("file");
  if (!(file instanceof File)) return noStoreJson({ ok: false, error: "MISSING_FILE" }, 400);

  const category = String(form.get("category") || "General").slice(0, 80);
  const name = String(form.get("name") || file.name || "File").slice(0, 160);
  const description = String(form.get("description") || "").slice(0, 1000);

  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  const bucket = "fxlocus-files";
  const filename = safeFilename(file.name || "upload.bin");
  const path = `${now.slice(0, 10)}/${Date.now()}-${Math.random().toString(16).slice(2)}-${filename}`;

  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await admin.storage.from(bucket).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });
  if (uploadErr) return noStoreJson({ ok: false, error: "UPLOAD_FAILED" }, 500);

  const { data: row, error: dbErr } = await admin
    .from("files")
    .insert({
      category,
      name,
      description,
      storage_bucket: bucket,
      storage_path: path,
      size_bytes: bytes.length,
      mime_type: file.type || null,
      uploaded_by: auth.user.id,
      created_at: now
    })
    .select("*")
    .single();

  if (dbErr || !row?.id) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);

  return noStoreJson({ ok: true, file: row });
}
