import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getIpFromHeaders, getUserAgent, parseDevice } from "@/lib/system/requestMeta";
import { getSystemAuth } from "@/lib/system/auth";
import { isAdminRole, isSuperAdmin } from "@/lib/system/roles";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";

const Body = z.object({
  status: z.enum(["active", "frozen"])
});

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest, ctx: { params: { userId: string } }) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);
  if (!isAdminRole(auth.user.role)) return noStoreJson({ ok: false, error: "FORBIDDEN" }, 403);

  const userId = ctx.params.userId;
  if (!userId) return noStoreJson({ ok: false, error: "INVALID_USER" }, 400);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ ok: false, error: "INVALID_BODY" }, 400);

  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  const { data: target, error: targetErr } = await admin
    .from("system_users")
    .select("id,role")
    .eq("id", userId)
    .maybeSingle();
  if (targetErr || !target) return noStoreJson({ ok: false, error: "NOT_FOUND" }, 404);
  if (!isSuperAdmin(auth.user.role) && target.role !== "student") {
    return noStoreJson({ ok: false, error: "FORBIDDEN" }, 403);
  }

  const { error } = await admin
    .from("system_users")
    .update({ status: parsed.data.status, updated_at: now })
    .eq("id", userId);
  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);

  if (parsed.data.status === "frozen") {
    await admin
      .from("system_sessions")
      .update({ revoked_at: now, revoke_reason: "account_frozen" })
      .eq("user_id", userId)
      .is("revoked_at", null);
  }

  const ip = getIpFromHeaders(req.headers);
  const ua = getUserAgent(req.headers);
  const device = parseDevice(ua);
  await admin.from("system_login_logs").insert({
    user_id: userId,
    event: parsed.data.status === "frozen" ? "account_frozen" : "account_unfrozen",
    ip,
    user_agent: ua,
    device,
    meta: { by: auth.user.id }
  });

  return noStoreJson({ ok: true });
}
