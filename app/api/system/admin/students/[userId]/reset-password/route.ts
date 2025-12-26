import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/system/guard";
import { isSuperAdmin, type SystemRole } from "@/lib/system/roles";
import { hashPassword } from "@/lib/system/password";
import { isStrongSystemPassword } from "@/lib/system/passwordPolicy";
import { getIpFromHeaders, getUserAgent, parseDevice } from "@/lib/system/requestMeta";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  newPassword: z.string().min(8).max(64).optional()
});

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

function randomStrongPassword(length = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*_-+=?";
  const all = `${upper}${lower}${digits}${special}`;

  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(special)];
  while (chars.length < length) chars.push(pick(all));

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

export async function POST(req: NextRequest, ctx: { params: { userId: string } }) {
  const ip = getIpFromHeaders(req.headers);
  const ua = getUserAgent(req.headers);
  const device = parseDevice(ua);

  let adminUserId = "";
  let adminRole: SystemRole | null = null;
  try {
    const { user } = await requireAdmin();
    adminUserId = user.id;
    adminRole = user.role;
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return noStoreJson({ ok: false, error: code }, status);
  }

  const userId = ctx.params.userId;
  if (!userId) return noStoreJson({ ok: false, error: "INVALID_USER" }, 400);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ ok: false, error: "INVALID_BODY" }, 400);

  const nextPassword = parsed.data.newPassword || randomStrongPassword();
  if (!isStrongSystemPassword(nextPassword)) {
    return noStoreJson({ ok: false, error: "WEAK_PASSWORD" }, 400);
  }

  const passwordHash = await hashPassword(nextPassword);
  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  const { data: target, error: targetErr } = await admin
    .from("system_users")
    .select("id,role")
    .eq("id", userId)
    .maybeSingle();
  if (targetErr || !target) return noStoreJson({ ok: false, error: "NOT_FOUND" }, 404);
  if (!adminRole || (!isSuperAdmin(adminRole) && target.role !== "student")) {
    return noStoreJson({ ok: false, error: "FORBIDDEN" }, 403);
  }

  const { error } = await admin
    .from("system_users")
    .update({
      password_hash: passwordHash,
      must_change_password: false,
      password_updated_at: now,
      password_updated_by: adminUserId,
      password_updated_reason: "admin_reset",
      updated_at: now
    } as any)
    .eq("id", userId);
  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);

  await admin
    .from("system_sessions")
    .update({ revoked_at: now, revoke_reason: "password_reset" })
    .eq("user_id", userId)
    .is("revoked_at", null);

  await admin.from("system_login_logs").insert({
    user_id: userId,
    event: "password_changed",
    ip,
    user_agent: ua,
    device,
    meta: { by: adminUserId, admin_reset: true }
  });

  return noStoreJson({ ok: true, newPassword: nextPassword });
}

