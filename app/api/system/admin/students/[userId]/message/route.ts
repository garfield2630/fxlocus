import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  title: z.string().min(1).max(120).optional(),
  content: z.string().min(1).max(10_000)
});

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest, ctx: { params: { userId: string } }) {
  const { user, supabase } = await requireAdmin();
  const userId = ctx.params.userId;
  if (!userId) return noStoreJson({ ok: false, error: "INVALID_USER" }, 400);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ ok: false, error: "INVALID_BODY" }, 400);

  const { error } = await supabase.from("notifications").insert({
    to_user_id: userId,
    from_user_id: user.id,
    title: parsed.data.title || "Message",
    content: parsed.data.content
  });

  if (error) return noStoreJson({ ok: false, error: error.message }, 500);
  return noStoreJson({ ok: true });
}
