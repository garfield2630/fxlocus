export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { requireAdmin } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

function safeFilename(name: string) {
  return (name || "upload.bin").replace(/[^\w.\-()+\s]/g, "_").slice(0, 120) || "upload.bin";
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const admin = supabaseAdmin();

    const form = await req.formData().catch(() => null);
    if (!form) return json({ ok: false, error: "INVALID_FORM" }, 400);

    const courseId = Number(form.get("courseId"));
    const file = form.get("file");

    if (!Number.isInteger(courseId) || courseId < 1 || courseId > 20) {
      return json({ ok: false, error: "INVALID_COURSE" }, 400);
    }
    if (!(file instanceof File)) return json({ ok: false, error: "MISSING_FILE" }, 400);

    const bucket = "fxlocus_files";
    const now = Date.now();
    const safeName = safeFilename(file.name);
    const path = `courses/${courseId}/${now}-${randomUUID()}-${safeName}`;

    const bytes = await file.arrayBuffer();
    const up = await admin.storage.from(bucket).upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });
    if (up.error) return json({ ok: false, error: up.error.message }, 500);

    const db = await admin
      .from("courses")
      .update({
        content_bucket: bucket,
        content_path: path,
        content_mime_type: file.type || null,
        content_file_name: safeName,
        updated_at: new Date().toISOString()
      } as any)
      .eq("id", courseId)
      .select("*")
      .single();

    if (db.error) return json({ ok: false, error: db.error.message }, 500);
    return json({ ok: true, course: db.data });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

