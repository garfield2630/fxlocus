import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { isAdminRole, isSuperAdmin, type SystemRole } from "@/lib/system/roles";

export type SystemStatus = "active" | "frozen";
export type { SystemRole };

export type SystemUserSafe = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: SystemRole;
  leader_id: string | null;
  student_status: "普通学员" | "考核通过" | "学习中" | "捐赠学员";
  status: SystemStatus;
};

function err(code: string) {
  const e = new Error(code);
  (e as any).code = code;
  return e;
}

export async function getSystemContext(): Promise<{ user: SystemUserSafe; supabase: ReturnType<typeof createSupabaseServerClient> }> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();

  if (!authUser?.id) throw err("UNAUTHORIZED");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,phone,role,leader_id,student_status,status")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) throw err("UNAUTHORIZED");
  if (!profile?.id) throw err("UNAUTHORIZED");

  const email = String(profile.email || authUser.email || "").trim().toLowerCase();
  if (!email) throw err("UNAUTHORIZED");

  if ((profile as any).status === "frozen") throw err("FROZEN");

  return {
    supabase,
    user: {
      id: profile.id,
      email,
      full_name: (profile as any).full_name ?? null,
      phone: (profile as any).phone ?? null,
      role: profile.role as SystemRole,
      leader_id: (profile as any).leader_id ?? null,
      student_status: profile.student_status as any,
      status: ((profile as any).status ?? "active") as SystemStatus
    }
  };
}

export async function requireSystemUser() {
  const ctx = await getSystemContext();
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
