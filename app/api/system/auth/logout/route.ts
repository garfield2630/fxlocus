import { NextRequest, NextResponse } from "next/server";

import { SYSTEM_COOKIE } from "@/lib/system/auth";
import { verifySystemJwt } from "@/lib/system/jwt";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import { getIpFromHeaders, getUserAgent, parseDevice } from "@/lib/system/requestMeta";

export const runtime = "nodejs";

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0
  };
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SYSTEM_COOKIE)?.value;
  const ip = getIpFromHeaders(req.headers);
  const ua = getUserAgent(req.headers);
  const device = parseDevice(ua);

  if (token) {
    try {
      const payload = await verifySystemJwt(token);
      const admin = supabaseAdmin();

      await admin
        .from("system_sessions")
        .update({
          revoked_at: new Date().toISOString(),
          revoke_reason: "logout"
        })
        .eq("id", payload.sid);

      await admin.from("system_login_logs").insert({
        user_id: payload.sub,
        event: "logout",
        ip,
        user_agent: ua,
        device
      });
    } catch {
      // ignore
    }
  }

  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(SYSTEM_COOKIE, "", cookieOptions());
  return res;
}

