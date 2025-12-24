import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import { hashPassword } from "@/lib/system/password";
import { hashCode, normalizeIdentifier, qualifyIdentifier } from "@/lib/system/loginCodes";
import { getIpFromHeaders, getUserAgent, parseDevice } from "@/lib/system/requestMeta";

export const runtime = "nodejs";

const Body = z.object({
  identifier: z.string().min(3),
  code: z.string().min(4).max(10),
  newPassword: z.string().min(8).max(128)
});

function escapeOrValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function POST(req: Request) {
  const ip = getIpFromHeaders(req.headers);
  const ua = getUserAgent(req.headers);
  const device = parseDevice(ua);

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const identifier = normalizeIdentifier(parsed.data.identifier);
  const qualified = qualifyIdentifier("reset", identifier);
  const code = parsed.data.code.trim();

  const admin = supabaseAdmin();
  const { data: row } = await admin
    .from("system_login_codes")
    .select("id, code_hash, expires_at, attempts, consumed_at")
    .eq("identifier", qualified)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 401 });
  if (Number(row.attempts || 0) >= 5) {
    return NextResponse.json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, { status: 429 });
  }

  const expected = row.code_hash;
  const actual = hashCode(code);
  if (expected !== actual) {
    await admin
      .from("system_login_codes")
      .update({ attempts: Number(row.attempts || 0) + 1 })
      .eq("id", row.id);
    return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 401 });
  }

  await admin.from("system_login_codes").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);

  const orValue = escapeOrValue(identifier);
  const { data: user } = await admin
    .from("system_users")
    .select("id, status")
    .or(`email.eq."${orValue}",phone.eq."${orValue}"`)
    .maybeSingle();

  if (!user) return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 404 });
  if (user.status !== "active") return NextResponse.json({ ok: false, error: "ACCOUNT_FROZEN" }, { status: 403 });

  const newHash = await hashPassword(parsed.data.newPassword);
  await admin
    .from("system_users")
    .update({ password_hash: newHash, must_change_password: false, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  await admin
    .from("system_sessions")
    .update({ revoked_at: new Date().toISOString(), revoke_reason: "password_reset" })
    .eq("user_id", user.id)
    .is("revoked_at", null);

  await admin.from("system_login_logs").insert({
    user_id: user.id,
    event: "password_changed",
    ip,
    user_agent: ua,
    device,
    meta: { via: "reset" }
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

