import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdmin } from "@/lib/system/guard";
import { isStrongSystemPassword } from "@/lib/system/passwordPolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(64)
});

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const ctx = await requireSuperAdmin();

    const raw = await req.json().catch(() => null);
    const parsed = Body.safeParse(raw);
    if (!parsed.success) return json({ ok: false, error: "INVALID_BODY" }, 400);

    if (!isStrongSystemPassword(parsed.data.newPassword)) {
      return json({ ok: false, error: "WEAK_PASSWORD" }, 400);
    }

    const reauth = await ctx.supabase.auth.signInWithPassword({
      email: ctx.user.email,
      password: parsed.data.currentPassword
    });
    if (reauth.error) return json({ ok: false, error: "BAD_PASSWORD" }, 401);

    const up = await ctx.supabase.auth.updateUser({ password: parsed.data.newPassword });
    if (up.error) return json({ ok: false, error: up.error.message }, 500);

    return json({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}
