import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const ctx = await requireAdmin();

    const { data: users, error } = await ctx.supabase
      .from("profiles")
      .select("id,full_name,email,phone,role,status,created_at,last_login_at,student_status,leader_id")
      .eq("role", "student")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);

    const userIds = (users || []).map((u: any) => u.id);
    const { data: access } = userIds.length
      ? await ctx.supabase
          .from("course_access")
          .select("user_id,status")
          .in("user_id", userIds)
      : { data: [] as any[] };

    const statsByUser = new Map<
      string,
      { requested: number; approved: number; completed: number; rejected: number }
    >();
    (access || []).forEach((row: any) => {
      const s = statsByUser.get(row.user_id) || {
        requested: 0,
        approved: 0,
        completed: 0,
        rejected: 0
      };
      if (row.status === "requested") s.requested += 1;
      if (row.status === "approved") s.approved += 1;
      if (row.status === "completed") s.completed += 1;
      if (row.status === "rejected") s.rejected += 1;
      statsByUser.set(row.user_id, s);
    });

    const items = (users || []).map((u: any) => ({
      ...u,
      full_name: u.full_name || "",
      stats: statsByUser.get(u.id) || { requested: 0, approved: 0, completed: 0, rejected: 0 }
    }));

    return noStoreJson({ ok: true, items });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return noStoreJson({ ok: false, error: code }, status);
  }
}
