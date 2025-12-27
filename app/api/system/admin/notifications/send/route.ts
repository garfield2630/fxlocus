import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  title: z.string().min(1).max(80),
  content: z.string().max(2000).optional()
});

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const { user, supabase } = await requireAdmin();
    const raw = await req.json().catch(() => null);
    const parsed = Body.safeParse(raw);
    if (!parsed.success) return json({ ok: false, error: "INVALID_BODY" }, 400);

    const rows = parsed.data.userIds.map((id) => ({
      to_user_id: id,
      from_user_id: user.id,
      title: parsed.data.title,
      content: parsed.data.content ?? null
    }));

    const ins = await supabase.from("notifications").insert(rows);
    if (ins.error) return json({ ok: false, error: ins.error.message }, 500);
    return json({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

