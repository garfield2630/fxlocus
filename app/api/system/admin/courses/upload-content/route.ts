export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { requireAdmin } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4"
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "mp4"]);

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

function safeFilename(name: string) {
  return (name || "upload.bin").replace(/[^\w.\-()+\s]/g, "_").slice(0, 120) || "upload.bin";
}

function fileTypeFrom(file: File) {
  const name = String(file.name || "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() || "" : "";
  if (ext === "pdf") return "pdf";
  if (ext === "doc") return "doc";
  if (ext === "docx") return "docx";
  if (ext === "mp4") return "mp4";

  const mime = String(file.type || "").toLowerCase();
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("msword")) return "doc";
  if (mime.includes("officedocument")) return "docx";
  if (mime.includes("mp4")) return "mp4";
  return null;
}

export async function POST(req: Request) {
  try {
    const { user } = await requireAdmin();
    const admin = supabaseAdmin();

    const form = await req.formData().catch(() => null);
    if (!form) return json({ ok: false, error: "INVALID_FORM" }, 400);

    const courseId = Number(form.get("courseId"));
    const file = form.get("file");

    if (!Number.isInteger(courseId) || courseId < 1 || courseId > 20) {
      return json({ ok: false, error: "INVALID_COURSE" }, 400);
    }
    if (!(file instanceof File)) return json({ ok: false, error: "MISSING_FILE" }, 400);

    const ext = String(file.name || "")
      .toLowerCase()
      .split(".")
      .pop();
    const mime = String(file.type || "").toLowerCase();
    if ((!ext || !ALLOWED_EXTENSIONS.has(ext)) && !ALLOWED_MIME_TYPES.has(mime)) {
      return json({ ok: false, error: "INVALID_FILE_TYPE" }, 400);
    }

    const bucketCandidates = [process.env.SYSTEM_FILES_BUCKET, "fxlocus_files", "fxlocus-files"].filter(Boolean) as string[];
    const now = Date.now();
    const safeName = safeFilename(file.name);
    const path = `courses/${courseId}/${now}-${randomUUID()}-${safeName}`;

    const bytes = await file.arrayBuffer();

    let bucketUsed = bucketCandidates[0] || "fxlocus_files";
    let uploadError: { message: string } | null = null;
    for (const candidate of bucketCandidates.length ? bucketCandidates : [bucketUsed]) {
      const up = await admin.storage.from(candidate).upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false
      });
      if (!up.error) {
        bucketUsed = candidate;
        uploadError = null;
        break;
      }
      uploadError = up.error;
      if (!/bucket/i.test(up.error.message)) break;
    }
    if (uploadError) return json({ ok: false, error: uploadError.message }, 500);

    const db = await admin
      .from("courses")
      .update({
        content_bucket: bucketUsed,
        content_path: path,
        content_mime_type: file.type || null,
        content_file_name: safeName,
        updated_at: new Date().toISOString()
      } as any)
      .eq("id", courseId)
      .select("*")
      .single();

    if (db.error) return json({ ok: false, error: db.error.message }, 500);

    const fileIns = await admin.from("files").insert({
      category: "course-content",
      name: safeName,
      description: null,
      storage_bucket: bucketUsed,
      storage_path: path,
      size_bytes: file.size,
      mime_type: file.type || null,
      file_type: fileTypeFrom(file),
      course_id: courseId,
      lesson_id: courseId,
      thumbnail_bucket: null,
      thumbnail_path: null,
      uploaded_by: user.id
    } as any);

    if (fileIns.error) return json({ ok: false, error: fileIns.error.message }, 500);
    return json({ ok: true, course: db.data });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

