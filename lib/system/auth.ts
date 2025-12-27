import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
  student_status:
    | "\u666e\u901a\u5b66\u5458"
    | "\u8003\u6838\u901a\u8fc7"
    | "\u5b66\u4e60\u4e2d"
    | "\u6350\u8d60\u5b66\u5458";
  status: "active" | "frozen";
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
  leader_id: string | null;
  student_status: string | null;
  status: string | null;
};

async function fetchProfileWithFallback(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string
) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,phone,role,leader_id,student_status,status")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.id) return { profile: profile as ProfileRow, adminError: null };

  let adminError: string | null = error?.message ?? null;
  try {
    const admin = createSupabaseAdminClient();
    const { data: adminProfile, error: adminErr } = await admin
      .from("profiles")
      .select("id,email,full_name,phone,role,leader_id,student_status,status")
      .eq("id", userId)
      .maybeSingle();
    if (adminErr) {
      adminError = adminErr.message;
      return { profile: null, adminError };
    }
    return { profile: adminProfile as ProfileRow | null, adminError };
  } catch (e: any) {
    adminError = e?.message ?? "ADMIN_PROFILE_QUERY_FAILED";
    return { profile: null, adminError };
  }
}

export async function getSystemAuth() {
  cookies();

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user?.id) return { ok: false as const, reason: "NO_SESSION" as const };

    const { profile, adminError } = await fetchProfileWithFallback(supabase, user.id);
    if (!profile?.id) {
      if (adminError) return { ok: false as const, reason: "PROFILE_QUERY_FAILED" as const };
      return { ok: false as const, reason: "NO_PROFILE" as const };
    }

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
