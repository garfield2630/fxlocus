export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { requireAdmin } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { user } = await requireAdmin();
    const admin = supabaseAdmin();

    const form = await req.formData();
    const file = form.get("file");
    const category = String(form.get("category") || "misc");
    const displayName = String(form.get("name") || "");
    const description = String(form.get("description") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "MISSING_FILE" }, { status: 400 });
    }

    // Bucket name must match Supabase Storage.
    const bucket = "fxlocus_files";

    const safeName = (file.name || "upload.bin").replace(/[^\w.\-()+\s]/g, "_");
    const finalName = displayName.trim() ? displayName.trim() : safeName;
    const path = `${category}/${Date.now()}-${randomUUID()}-${safeName}`;

    const buf = await file.arrayBuffer();

    const up = await admin.storage.from(bucket).upload(path, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (up.error) {
      console.error("[files/upload] storage upload error:", up.error);
      return NextResponse.json({ ok: false, error: up.error.message }, { status: 500 });
    }

    const ins = await admin
      .from("files")
      .insert({
        category,
        name: finalName,
        description: description.trim() || null,
        storage_bucket: bucket,
        storage_path: path,
        size_bytes: file.size,
        mime_type: file.type || null,
        uploaded_by: user.id
      })
      .select("*")
      .single();

    if (ins.error) {
      console.error("[files/upload] db insert error:", ins.error);
      return NextResponse.json({ ok: false, error: ins.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, file: ins.data }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    console.error("[files/upload] fatal:", e);
    return NextResponse.json({ ok: false, error: e?.message || "UPLOAD_FAILED" }, { status: 500 });
  }
}
