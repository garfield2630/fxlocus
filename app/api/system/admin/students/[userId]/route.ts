import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_req: Request, ctx: { params: { userId: string } }) {
  let supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"] | null = null;
  try {
    const res = await requireAdmin();
    supabase = res.supabase;
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return noStoreJson({ ok: false, error: code }, status);
  }

  const userId = ctx.params.userId;
  if (!userId) return noStoreJson({ ok: false, error: "INVALID_USER" }, 400);

  const [{ data: user, error: userErr }, { data: access, error: accessErr }] = await Promise.all([
    supabase!
      .from("profiles")
      .select("id,full_name,email,phone,role,status,created_at,last_login_at,student_status,leader_id")
      .eq("id", userId)
      .maybeSingle(),
    supabase!.from("course_access").select("*").eq("user_id", userId).order("course_id", { ascending: true })
  ]);

  if (userErr) return noStoreJson({ ok: false, error: userErr.message }, 500);
  if (!user?.id) return noStoreJson({ ok: false, error: "NOT_FOUND" }, 404);
  if (user.role !== "student") return noStoreJson({ ok: false, error: "NOT_FOUND" }, 404);
  if (accessErr) return noStoreJson({ ok: false, error: accessErr.message }, 500);

  return noStoreJson({ ok: true, user, access: access || [] });
}
