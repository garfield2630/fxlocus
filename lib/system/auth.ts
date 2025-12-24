import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { supabaseAdmin } from "./supabaseAdmin";
import { verifySystemJwt } from "./jwt";

export const SYSTEM_COOKIE = "fxlocus_system_token";

export type Locale = "zh" | "en";

export type SystemUser = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: "admin" | "student";
  status: "active" | "frozen";
  must_change_password: boolean;
  default_open_courses: number;
};

export async function getSystemAuth() {
  const token = cookies().get(SYSTEM_COOKIE)?.value;
  if (!token) return { ok: false as const, reason: "NO_TOKEN" as const };

  try {
    const payload = await verifySystemJwt(token);
    const admin = supabaseAdmin();

    const { data: session } = await admin
      .from("system_sessions")
      .select("id, user_id, expires_at, revoked_at")
      .eq("id", payload.sid)
      .maybeSingle();

    if (!session) return { ok: false as const, reason: "NO_SESSION" as const };
    if (session.revoked_at) return { ok: false as const, reason: "REVOKED" as const };
    if (new Date(session.expires_at).getTime() <= Date.now()) {
      return { ok: false as const, reason: "EXPIRED" as const };
    }

    const { data: user } = await admin
      .from("system_users")
      .select(
        "id, full_name, email, phone, role, status, must_change_password, default_open_courses"
      )
      .eq("id", session.user_id)
      .maybeSingle();

    if (!user) return { ok: false as const, reason: "NO_USER" as const };
    if (user.status !== "active") return { ok: false as const, reason: "FROZEN" as const };

    return { ok: true as const, user: user as SystemUser, sessionId: session.id };
  } catch {
    return { ok: false as const, reason: "BAD_TOKEN" as const };
  }
}

export async function requireSystemUser(
  locale: Locale
) {
  const res = await getSystemAuth();
  if (!res.ok) {
    redirect(`/${locale}/system/login`);
  }

  return res.user;
}

export async function requireAdmin(locale: Locale) {
  const user = await requireSystemUser(locale);
  if (user.role !== "admin") redirect(`/${locale}/system/403`);
  return user;
}

