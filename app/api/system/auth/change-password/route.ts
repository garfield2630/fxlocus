import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSystemUser } from "@/lib/system/guard";
import { hashPassword, verifyPassword } from "@/lib/system/password";
import { isStrongSystemPassword } from "@/lib/system/passwordPolicy";
import { getIpFromHeaders, getUserAgent, parseDevice } from "@/lib/system/requestMeta";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

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
  const ip = getIpFromHeaders(req.headers);
  const ua = getUserAgent(req.headers);
  const device = parseDevice(ua);

  try {
    const { user } = await requireSystemUser();
    const raw = await req.json().catch(() => null);
    const parsed = Body.safeParse(raw);
    if (!parsed.success) return json({ ok: false, error: "INVALID_BODY" }, 400);

    if (!isStrongSystemPassword(parsed.data.newPassword)) {
      return json({ ok: false, error: "WEAK_PASSWORD" }, 400);
    }

    const admin = supabaseAdmin();
    const { data: dbUser, error: userErr } = await admin
      .from("system_users")
      .select("id,password_hash")
      .eq("id", user.id)
      .maybeSingle();

    if (userErr) return json({ ok: false, error: userErr.message }, 500);
    if (!dbUser) return json({ ok: false, error: "NO_USER" }, 404);

    const ok = await verifyPassword(parsed.data.currentPassword, dbUser.password_hash);
    if (!ok) return json({ ok: false, error: "BAD_PASSWORD" }, 401);

    const now = new Date().toISOString();
    const passwordHash = await hashPassword(parsed.data.newPassword);

    const up = await admin
      .from("system_users")
      .update({
        password_hash: passwordHash,
        must_change_password: false,
        password_updated_at: now,
        password_updated_by: user.id,
        password_updated_reason: "self",
        updated_at: now
      } as any)
      .eq("id", user.id);

    if (up.error) return json({ ok: false, error: up.error.message }, 500);

    await admin.from("system_login_logs").insert({
      user_id: user.id,
      event: "password_changed",
      ip,
      user_agent: ua,
      device,
      meta: { via: "change_password" }
    });

    return json({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

