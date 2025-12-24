export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const { user } = await requireAdmin();
    const admin = supabaseAdmin();

    const form = await req.formData();
    const file = form.get("file");
    const category = String(form.get("category") || "misc");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "MISSING_FILE" }, { status: 400 });
    }

    // ✅ 注意：这里 bucket 名要和 Supabase Storage 里完全一致
    const bucket = "fxlocus_files"; // <- 如果你实际叫 fxlocus-files 或别的，这里改成实际名字

    const safeName = (file.name || "upload.bin").replace(/[^\w.\-()+\s]/g, "_");
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
        name: safeName,
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
