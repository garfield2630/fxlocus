import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
  student_status:
    | "\u666e\u901a\u5b66\u5458"
    | "\u8003\u6838\u901a\u8fc7"
    | "\u5b66\u4e60\u4e2d"
    | "\u6350\u8d60\u5b66\u5458";
  status: SystemStatus;
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

function err(code: string) {
  const e = new Error(code);
  (e as any).code = code;
  return e;
}

async function fetchProfileWithFallback(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,phone,role,leader_id,student_status,status")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.id) return profile as ProfileRow;

  try {
    const admin = createSupabaseAdminClient();
    const { data: adminProfile, error: adminErr } = await admin
      .from("profiles")
      .select("id,email,full_name,phone,role,leader_id,student_status,status")
      .eq("id", userId)
      .maybeSingle();
    if (adminErr) return null;
    return adminProfile as ProfileRow | null;
  } catch {
    return null;
  }
}

export async function getSystemContext(): Promise<{
  user: SystemUserSafe;
  supabase: ReturnType<typeof createSupabaseServerClient>;
}> {
  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  let authUser = session?.user ?? null;
  if (!authUser?.id) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    authUser = user ?? null;
  }

  if (!authUser?.id) throw err("UNAUTHORIZED");
  if (session?.expires_at && session.expires_at * 1000 <= Date.now()) throw err("UNAUTHORIZED");

  const profile = await fetchProfileWithFallback(supabase, authUser.id);
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
