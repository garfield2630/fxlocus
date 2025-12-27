import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdmin } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  courseId: z.coerce.number().int().min(1).max(20),
  title_zh: z.string().max(200).optional(),
  title_en: z.string().max(200).optional(),
  published: z.boolean().optional(),
  deleted: z.boolean().optional()
});

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const { supabase } = await requireSuperAdmin();
    const raw = await req.json().catch(() => null);
    const parsed = Body.safeParse(raw);
    if (!parsed.success) return json({ ok: false, error: "INVALID_BODY" }, 400);

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { updated_at: now };

    if (typeof parsed.data.title_zh === "string") patch.title_zh = parsed.data.title_zh;
    if (typeof parsed.data.title_en === "string") patch.title_en = parsed.data.title_en;
    if (typeof parsed.data.published === "boolean") patch.published = parsed.data.published;
    if (typeof parsed.data.deleted === "boolean") {
      patch.deleted_at = parsed.data.deleted ? now : null;
      if (parsed.data.deleted) patch.published = false;
    }

    const up = await supabase
      .from("courses")
      .update(patch as any)
      .eq("id", parsed.data.courseId)
      .select("*")
      .single();

    if (up.error) return json({ ok: false, error: up.error.message }, 500);
    return json({ ok: true, course: up.data });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

