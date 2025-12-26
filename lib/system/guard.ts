import { cookies } from "next/headers";

import { SYSTEM_COOKIE } from "@/lib/system/auth";
import { isAdminRole, isSuperAdmin, type SystemRole } from "@/lib/system/roles";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import { verifySystemJwt } from "@/lib/system/jwt";

export type SystemStatus = "active" | "frozen";
export type { SystemRole };

export type SystemUserSafe = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: SystemRole;
  status: SystemStatus;
};

type JwtPayload = {
  sub: string; // user id
  sid: string; // session id
  role: SystemRole;
  iat?: number;
  exp?: number;
};

function err(code: string) {
  const e = new Error(code);
  (e as any).code = code;
  return e;
}

export async function getSystemContext(): Promise<
  | { user: SystemUserSafe; sessionId: string; token: string }
  | null
> {
  const token = cookies().get(SYSTEM_COOKIE)?.value;
  if (!token) return null;

  const payload = (await verifySystemJwt(token).catch(() => null)) as JwtPayload | null;
  if (!payload?.sub || !payload?.sid || !payload?.role) return null;

  const admin = supabaseAdmin();

  const { data: sess } = await admin
    .from("system_sessions")
    .select("id,user_id,expires_at,revoked_at")
    .eq("id", payload.sid)
    .maybeSingle();

  if (!sess) return null;
  if (sess.user_id !== payload.sub) return null;
  if (sess.revoked_at) return null;
  if (new Date(sess.expires_at).getTime() <= Date.now()) return null;

  const { data: user } = await admin
    .from("system_users")
    .select("id,full_name,email,phone,role,status")
    .eq("id", payload.sub)
    .maybeSingle();

  if (!user) return null;
  if (user.role !== payload.role) return null;

  return {
    token,
    sessionId: payload.sid,
    user: user as SystemUserSafe
  };
}

export async function requireSystemUser() {
  const ctx = await getSystemContext();
  if (!ctx) throw err("UNAUTHORIZED");
  if (ctx.user.status !== "active") throw err("FROZEN");
  return ctx;
}

export async function requireAdmin() {
  const ctx = await requireSystemUser();
  if (!isAdminRole(ctx.user.role)) throw err("FORBIDDEN");
  return ctx;
}

export async function requireStudent() {
  const ctx = await requireSystemUser();
  if (ctx.user.role !== "student") throw err("FORBIDDEN");
  return ctx;
}

export async function requireSuperAdmin() {
  const ctx = await requireSystemUser();
  if (!isSuperAdmin(ctx.user.role)) throw err("FORBIDDEN");
  return ctx;
}
