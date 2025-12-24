import { NextResponse } from "next/server";
import { z } from "zod";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import { hashPassword, verifyPassword } from "@/lib/system/password";
import { getIpFromHeaders, getUserAgent, parseDevice } from "@/lib/system/requestMeta";

export const runtime = "nodejs";

const Body = z.object({
  currentPassword: z.string().min(6).max(128).optional(),
  newPassword: z.string().min(8).max(128)
});

export async function POST(req: Request) {
  const ip = getIpFromHeaders(req.headers);
  const ua = getUserAgent(req.headers);
  const device = parseDevice(ua);

  const auth = await getSystemAuth();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.reason }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: user } = await admin
    .from("system_users")
    .select("id, password_hash, must_change_password")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!user) return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 404 });

  if (!user.must_change_password) {
    if (!parsed.data.currentPassword) {
      return NextResponse.json({ ok: false, error: "CURRENT_PASSWORD_REQUIRED" }, { status: 400 });
    }
    const ok = await verifyPassword(parsed.data.currentPassword, user.password_hash);
    if (!ok) return NextResponse.json({ ok: false, error: "BAD_PASSWORD" }, { status: 401 });
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await admin
    .from("system_users")
    .update({ password_hash: newHash, must_change_password: false, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  await admin.from("system_login_logs").insert({
    user_id: user.id,
    event: "password_changed",
    ip,
    user_agent: ua,
    device,
    meta: { via: "change_password" }
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

