import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const q = await supabase
      .from("course_access")
      .select("id,user_id,course_id,status,requested_at")
      .eq("status", "requested")
      .order("requested_at", { ascending: false })
      .limit(300);

    if (q.error) return json({ ok: false, error: q.error.message }, 500);

    const rows = q.data || [];
    const userIds = Array.from(new Set(rows.map((r: any) => String(r.user_id)).filter(Boolean)));
    const courseIds = Array.from(new Set(rows.map((r: any) => Number(r.course_id)).filter(Boolean)));

    const [usersRes, coursesRes] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id,full_name,email,phone").in("id", userIds)
        : Promise.resolve({ data: [], error: null } as any),
      courseIds.length
        ? supabase.from("courses").select("id,title_zh,title_en").in("id", courseIds)
        : Promise.resolve({ data: [], error: null } as any)
    ]);

    if (usersRes.error) return json({ ok: false, error: usersRes.error.message }, 500);
    if (coursesRes.error) return json({ ok: false, error: coursesRes.error.message }, 500);

    const usersById = new Map((usersRes.data || []).map((u: any) => [u.id, u]));
    const coursesById = new Map((coursesRes.data || []).map((c: any) => [c.id, c]));

    const items = rows.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      course_id: r.course_id,
      status: r.status,
      requested_at: r.requested_at,
      user: usersById.get(r.user_id) || null,
      course: coursesById.get(r.course_id) || null
    }));

    return json({ ok: true, items });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}
