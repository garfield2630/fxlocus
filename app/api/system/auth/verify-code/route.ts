import { NextResponse } from "next/server";
import { z } from "zod";

import { SYSTEM_COOKIE } from "@/lib/system/auth";
import { qualifyIdentifier, hashCode, normalizeIdentifier } from "@/lib/system/loginCodes";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import { signSystemJwt } from "@/lib/system/jwt";
import { getIpFromHeaders, getUserAgent, parseDevice } from "@/lib/system/requestMeta";

export const runtime = "nodejs";

const Body = z.object({
  identifier: z.string().min(3),
  code: z.string().min(4).max(10)
});

function escapeOrValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 2 * 60 * 60
  };
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
  const qualified = qualifyIdentifier("login", identifier);
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

  if (!row) {
    await admin.from("system_login_logs").insert({
      user_id: null,
      event: "login_failed",
      ip,
      user_agent: ua,
      device,
      meta: { identifier, reason: "CODE_NOT_FOUND" }
    });
    return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 401 });
  }

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
    await admin.from("system_login_logs").insert({
      user_id: null,
      event: "login_failed",
      ip,
      user_agent: ua,
      device,
      meta: { identifier, reason: "BAD_CODE" }
    });
    return NextResponse.json({ ok: false, error: "INVALID_CODE" }, { status: 401 });
  }

  await admin.from("system_login_codes").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);

  const orValue = escapeOrValue(identifier);
  const { data: user } = await admin
    .from("system_users")
    .select("*")
    .or(`email.eq."${orValue}",phone.eq."${orValue}"`)
    .maybeSingle();

  if (!user) {
    await admin.from("system_login_logs").insert({
      user_id: null,
      event: "login_failed",
      ip,
      user_agent: ua,
      device,
      meta: { identifier, reason: "NO_USER" }
    });
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  if (user.status !== "active") {
    await admin.from("system_login_logs").insert({
      user_id: user.id,
      event: "account_frozen",
      ip,
      user_agent: ua,
      device
    });
    return NextResponse.json({ ok: false, error: "ACCOUNT_FROZEN" }, { status: 403 });
  }

  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const { data: session, error: sessErr } = await admin
    .from("system_sessions")
    .insert({
      user_id: user.id,
      expires_at: expiresAt,
      ip,
      user_agent: ua,
      device
    })
    .select("id, issued_at")
    .single();

  if (sessErr || !session?.id) {
    return NextResponse.json({ ok: false, error: "SESSION_CREATE_FAILED" }, { status: 500 });
  }

  const { data: sessions } = await admin
    .from("system_sessions")
    .select("id, issued_at")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("issued_at", { ascending: false });

  if (sessions && sessions.length > 2) {
    const revokeIds = sessions.slice(2).map((s) => s.id);
    await admin
      .from("system_sessions")
      .update({
        revoked_at: new Date().toISOString(),
        revoke_reason: "max_concurrent"
      })
      .in("id", revokeIds);

    await admin.from("system_login_logs").insert({
      user_id: user.id,
      event: "session_revoked",
      ip,
      user_agent: ua,
      device,
      meta: { revokeIds }
    });
  }

  await admin.from("system_login_logs").insert({
    user_id: user.id,
    event: "login_success",
    ip,
    user_agent: ua,
    device,
    meta: { method: "code" }
  });

  await admin.from("system_users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

  const token = await signSystemJwt({ sub: user.id, sid: session.id, role: user.role });
  const res = NextResponse.json(
    {
      ok: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        must_change_password: user.must_change_password
      },
      must_change_password: user.must_change_password
    },
    { headers: { "Cache-Control": "no-store" } }
  );

  res.cookies.set(SYSTEM_COOKIE, token, cookieOptions());
  return res;
}

