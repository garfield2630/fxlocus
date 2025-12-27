import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/system/guard";
import { isSuperAdmin } from "@/lib/system/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

const LeaderIdParam = z.string().uuid();

const COURSE_STATUSES = ["requested", "approved", "rejected", "completed"] as const;

export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireAdmin();

    const leaderIdRaw = req.nextUrl.searchParams.get("leaderId");
    const leaderId =
      leaderIdRaw && isSuperAdmin(user.role)
        ? LeaderIdParam.safeParse(leaderIdRaw).success
          ? leaderIdRaw
          : null
        : null;

    const scopeLeaderId = user.role === "leader" ? user.id : leaderId;

    const studentCounts = await supabase.rpc(
      "report_student_status_counts",
      scopeLeaderId ? ({ _leader_id: scopeLeaderId } as any) : ({} as any)
    );
    if (studentCounts.error) return json({ ok: false, error: studentCounts.error.message }, 500);

    const courseCounts = await supabase.rpc(
      "report_course_access_status_counts",
      scopeLeaderId ? ({ _leader_id: scopeLeaderId } as any) : ({} as any)
    );
    if (courseCounts.error) return json({ ok: false, error: courseCounts.error.message }, 500);

    const filePending = await supabase.rpc(
      "report_pending_file_access_requests",
      scopeLeaderId ? ({ _leader_id: scopeLeaderId } as any) : ({} as any)
    );
    if (filePending.error) return json({ ok: false, error: filePending.error.message }, 500);

    const byStudentStatus: Record<string, number> = {};
    let studentsTotal = 0;
    let studentsFrozen = 0;

    for (const row of (studentCounts.data || []) as any[]) {
      const key = String(row.student_status || "普通学员");
      const total = Number(row.total || 0);
      const frozen = Number(row.frozen || 0);
      byStudentStatus[key] = total;
      studentsTotal += total;
      studentsFrozen += frozen;
    }

    const courses: Record<(typeof COURSE_STATUSES)[number], number> = {
      requested: 0,
      approved: 0,
      rejected: 0,
      completed: 0
    };

    for (const row of (courseCounts.data || []) as any[]) {
      const st = String(row.status || "");
      if ((COURSE_STATUSES as readonly string[]).includes(st)) {
        (courses as any)[st] = Number(row.total || 0);
      }
    }

    const pendingFileAccessRequests = Number((filePending.data as any[])?.[0]?.total || 0);

    return json({
      ok: true,
      role: user.role,
      scope: { leaderId: scopeLeaderId || null },
      students: { total: studentsTotal, frozen: studentsFrozen, byStatus: byStudentStatus },
      courses,
      pending: { courseAccessRequests: courses.requested, fileAccessRequests: pendingFileAccessRequests },
      generatedAt: new Date().toISOString()
    });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

