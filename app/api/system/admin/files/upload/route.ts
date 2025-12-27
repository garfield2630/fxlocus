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

function safeSegment(input: string) {
  const s = (input || "").trim().toLowerCase();
  const cleaned = s.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "misc";
}

function safeFileName(name: string) {
  const base = (name || "").trim();
  const idx = base.lastIndexOf(".");
  const ext = idx >= 0 ? base.slice(idx).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const stem = idx >= 0 ? base.slice(0, idx) : base;

  const safeStem = stem
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return (safeStem || "file") + (ext || "");
}

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

    const ext = String(file.name || "")
      .toLowerCase()
      .split(".")
      .pop();
    const mime = String(file.type || "").toLowerCase();
    if ((!ext || !ALLOWED_EXTENSIONS.has(ext)) && !ALLOWED_MIME_TYPES.has(mime)) {
      return NextResponse.json({ ok: false, error: "INVALID_FILE_TYPE" }, { status: 400 });
    }

    const bucketCandidates = [
      process.env.SYSTEM_FILES_BUCKET,
      "fxlocus_files",
      "fxlocus-files"
    ].filter(Boolean) as string[];

    const folder = safeSegment(String(form.get("folder") || category));
    const safeName = safeFileName(file.name || "upload.bin");
    const finalName = displayName.trim() ? displayName.trim() : safeName;
    const path = `${folder}/${Date.now()}-${randomUUID()}-${safeName}`;
    if (path.startsWith("/") || path.includes("..") || path.includes("//")) {
      return NextResponse.json({ ok: false, error: "INVALID_KEY" }, { status: 400 });
    }

    const buf = await file.arrayBuffer();

    let bucketUsed = bucketCandidates[0] || "fxlocus_files";
    let uploadError: { message: string } | null = null;

    for (const candidate of bucketCandidates.length ? bucketCandidates : [bucketUsed]) {
      const up = await admin.storage.from(candidate).upload(path, buf, {
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

    if (uploadError) {
      console.error("[files/upload] storage upload error:", uploadError);
      return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
    }

    const ins = await admin
      .from("files")
      .insert({
        category: folder,
        name: finalName,
        description: description.trim() || null,
        storage_bucket: bucketUsed,
        storage_path: path,
        size_bytes: file.size,
        mime_type: file.type || null,
        file_type: fileTypeFrom(file),
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
