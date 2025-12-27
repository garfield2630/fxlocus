import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { isAdminRole } from "@/lib/system/roles";

export type Locale = "zh" | "en";

export type SystemUser = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "student" | "leader" | "super_admin";
  leader_id: string | null;
  student_status: "普通学员" | "考核通过" | "学习中" | "捐赠学员";
  status: "active" | "frozen";
};

export async function getSystemAuth() {
  // Ensure the request is not cached (auth is cookie-based).
  cookies();

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user?.id) return { ok: false as const, reason: "NO_SESSION" as const };

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,phone,role,leader_id,student_status,status")
      .eq("id", user.id)
      .maybeSingle();

    if (error) return { ok: false as const, reason: "PROFILE_QUERY_FAILED" as const };
    if (!profile?.id) return { ok: false as const, reason: "NO_PROFILE" as const };

    const email = String(profile.email || user.email || "").trim().toLowerCase();
    if (!email) return { ok: false as const, reason: "NO_EMAIL" as const };

    if ((profile as any).status === "frozen") return { ok: false as const, reason: "FROZEN" as const };

    return {
      ok: true as const,
      user: {
        id: profile.id,
        email,
        full_name: (profile as any).full_name ?? null,
        phone: (profile as any).phone ?? null,
        role: profile.role as SystemUser["role"],
        leader_id: (profile as any).leader_id ?? null,
        student_status: profile.student_status as SystemUser["student_status"],
        status: ((profile as any).status ?? "active") as SystemUser["status"]
      }
    };
  } catch {
    return { ok: false as const, reason: "AUTH_FAILED" as const };
  }
}

export async function requireSystemUser(locale: Locale) {
  const res = await getSystemAuth();
  if (!res.ok) {
    if (res.reason === "FROZEN") redirect(`/${locale}/system/403`);
    redirect(`/${locale}/system/login`);
  }
  return res.user;
}

export async function requireAdmin(locale: Locale) {
  const user = await requireSystemUser(locale);
  if (!isAdminRole(user.role)) redirect(`/${locale}/system/403`);
  return user;
}
