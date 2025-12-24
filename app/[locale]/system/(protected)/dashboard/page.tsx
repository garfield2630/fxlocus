import { unstable_noStore } from "next/cache";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import { StatusBadge } from "@/components/system/StatusBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: { locale: "zh" | "en" } }) {
  unstable_noStore();
  const locale = params.locale === "en" ? "en" : "zh";
  const auth = await getSystemAuth();
  if (!auth.ok) return null;

  const admin = supabaseAdmin();
  const { data: accessRows } = await admin
    .from("course_access")
    .select("status,updated_at,course_id,progress")
    .eq("user_id", auth.user.id);

  const totalCourses = 20;
  const completed = (accessRows || []).filter((r: any) => r.status === "completed").length;
  const approved = (accessRows || []).filter((r: any) => r.status === "approved").length;
  const requested = (accessRows || []).filter((r: any) => r.status === "requested").length;

  const latest = (accessRows || [])
    .slice()
    .sort((a: any, b: any) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">
          {locale === "zh" ? "学习仪表盘" : "Dashboard"}
        </div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh"
            ? "概览你的课程权限、进度与最近记录。"
            : "Overview of your course access, progress and recent activity."}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">{locale === "zh" ? "已完成" : "Completed"}</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {completed}/{totalCourses}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">{locale === "zh" ? "已授权" : "Approved"}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{approved}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">{locale === "zh" ? "待审批" : "Requested"}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{requested}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/85 font-semibold">{locale === "zh" ? "最近学习" : "Recent learning"}</div>
        <div className="mt-3 space-y-2">
          {latest.length ? (
            latest.map((row: any) => (
              <div key={row.course_id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-white/85 text-sm font-semibold">
                  {locale === "zh" ? `第${row.course_id}课` : `Lesson ${row.course_id}`}
                </div>
                <div className="text-white/50 text-xs">
                  {row.updated_at ? new Date(row.updated_at).toLocaleString() : ""}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <StatusBadge value={row.status} locale={locale} />
                  <span className="text-white/60 text-xs">{row.progress ?? 0}%</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-white/60 text-sm">
              {locale === "zh" ? "暂无记录。去课程页申请并开始学习。" : "No activity yet. Request a course and start learning."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

