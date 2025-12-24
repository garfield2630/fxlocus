import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";

const Body = z.object({
  userId: z.string().optional(),
  classId: z.string().optional()
});

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest, ctx: { params: { fileId: string } }) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);
  if (auth.user.role !== "admin") return noStoreJson({ ok: false, error: "FORBIDDEN" }, 403);

  const fileId = ctx.params.fileId;
  if (!fileId) return noStoreJson({ ok: false, error: "INVALID_FILE" }, 400);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ ok: false, error: "INVALID_BODY" }, 400);

  const userId = parsed.data.userId || null;
  const classId = parsed.data.classId || null;
  if ((!userId && !classId) || (userId && classId)) {
    return noStoreJson({ ok: false, error: "INVALID_TARGET" }, 400);
  }

  const admin = supabaseAdmin();

  if (userId) {
    await admin.from("file_permissions").delete().eq("file_id", fileId).eq("user_id", userId);
  }
  if (classId) {
    await admin.from("file_permissions").delete().eq("file_id", fileId).eq("class_id", classId);
  }

  const { error } = await admin.from("file_permissions").insert({
    file_id: fileId,
    user_id: userId,
    class_id: classId
  });

  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
  return noStoreJson({ ok: true });
}
