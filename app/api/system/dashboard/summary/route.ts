import { NextResponse } from "next/server";

import { requireSystemUser } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

const STUDENT_STATUSES = ["普通学员", "考核通过", "学习中", "捐赠学员"] as const;
const COURSE_STATUSES = ["requested", "approved", "rejected", "completed"] as const;

export async function GET() {
  try {
    const { user, supabase } = await requireSystemUser();

    if (user.role === "student") {
      const q = await supabase
        .from("course_access")
        .select("course_id,status,progress,updated_at")
        .eq("user_id", user.id);

      if (q.error) return json({ ok: false, error: q.error.message }, 500);

      const rows = (q.data || []).map((r: any) => ({
        course_id: Number(r.course_id),
        status: String(r.status || "requested"),
        progress: Number(r.progress || 0),
        updated_at: r.updated_at ? String(r.updated_at) : null
      }));

      const totalCourses = 20;
      const completed = rows.filter((r) => r.status === "completed").length;
      const approved = rows.filter((r) => r.status === "approved").length;
      const requested = rows.filter((r) => r.status === "requested").length;

      const latest = rows
        .slice()
        .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
        .slice(0, 3);

      return json({
        ok: true,
        kind: "student",
        role: user.role,
        totalCourses,
        counts: { completed, approved, requested },
        items: rows,
        latest
      });
    }

    const profilesQ = supabase
      .from("profiles")
      .select("id,student_status,status")
      .eq("role", "student")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (user.role === "leader") profilesQ.eq("leader_id", user.id);

    const profilesRes = await profilesQ;
    if (profilesRes.error) return json({ ok: false, error: profilesRes.error.message }, 500);

    const students = profilesRes.data || [];
    const totalStudents = students.length;
    const frozenStudents = students.filter((s: any) => String(s.status || "active") === "frozen").length;

    const byStudentStatus: Record<string, number> = {};
    for (const s of STUDENT_STATUSES) byStudentStatus[s] = 0;
    for (const row of students) {
      const key = String((row as any).student_status || "普通学员");
      byStudentStatus[key] = (byStudentStatus[key] || 0) + 1;
    }

    const courseCounts: Record<string, number> = {};
    for (const st of COURSE_STATUSES) courseCounts[st] = 0;

    const countQueries = await Promise.all(
      COURSE_STATUSES.map((st) =>
        supabase.from("course_access").select("id", { count: "exact", head: true }).eq("status", st)
      )
    );
    for (let i = 0; i < COURSE_STATUSES.length; i += 1) {
      const res: any = countQueries[i];
      if (res?.error) return json({ ok: false, error: res.error.message }, 500);
      courseCounts[COURSE_STATUSES[i]] = Number(res?.count || 0);
    }

    const fileReq = await supabase
      .from("file_access_requests")
      .select("file_id", { count: "exact", head: true })
      .eq("status", "requested");
    if (fileReq.error) return json({ ok: false, error: fileReq.error.message }, 500);

    return json({
      ok: true,
      kind: "admin",
      role: user.role,
      students: { total: totalStudents, frozen: frozenStudents, byStatus: byStudentStatus },
      courses: courseCounts,
      pending: { fileAccessRequests: Number(fileReq.count || 0) }
    });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

