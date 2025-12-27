import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  status: z.enum(["active", "frozen"])
});

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest, ctx: { params: { userId: string } }) {
  const { supabase } = await requireAdmin();
  const userId = ctx.params.userId;
  if (!userId) return noStoreJson({ ok: false, error: "INVALID_USER" }, 400);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ ok: false, error: "INVALID_BODY" }, 400);

  const now = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ status: parsed.data.status, updated_at: now } as any)
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) return noStoreJson({ ok: false, error: error.message }, 500);
  if (!updated?.id) return noStoreJson({ ok: false, error: "NOT_FOUND" }, 404);

  return noStoreJson({ ok: true });
}
