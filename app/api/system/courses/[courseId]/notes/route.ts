import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireStudent } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  contentMd: z.string().max(200_000)
});

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: NextRequest, ctx: { params: { courseId: string } }) {
  let userId = "";
  let supabase: Awaited<ReturnType<typeof requireStudent>>["supabase"];
  try {
    const res = await requireStudent();
    userId = res.user.id;
    supabase = res.supabase;
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return noStoreJson({ ok: false, error: code }, status);
  }

  const courseId = Number(ctx.params.courseId);
  if (!Number.isInteger(courseId) || courseId < 1 || courseId > 20) {
    return noStoreJson({ ok: false, error: "INVALID_COURSE" }, 400);
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ ok: false, error: "INVALID_BODY" }, 400);

  const now = new Date().toISOString();

  const { data: access } = await supabase!
    .from("course_access")
    .select("id,status")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!access) return noStoreJson({ ok: false, error: "NO_ACCESS" }, 403);
  if (access.status !== "approved" && access.status !== "completed") {
    return noStoreJson({ ok: false, error: "NOT_APPROVED" }, 403);
  }

  const { error } = await supabase!.from("course_notes").upsert(
    {
      user_id: userId,
      course_id: courseId,
      content_md: parsed.data.contentMd,
      updated_at: now
    },
    { onConflict: "user_id,course_id" }
  );

  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
  return noStoreJson({ ok: true });
}
