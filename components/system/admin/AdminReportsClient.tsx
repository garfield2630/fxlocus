"use client";

import React from "react";

import { EChart } from "@/components/system/charts/EChart";

type LeaderRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "leader" | "super_admin";
};

type Summary = {
  ok: true;
  role: "leader" | "super_admin";
  scope: { leaderId: string | null };
  students: { total: number; frozen: number; byStatus: Record<string, number> };
  courses: Record<"requested" | "approved" | "rejected" | "completed", number>;
  pending: { courseAccessRequests: number; fileAccessRequests: number };
  generatedAt: string;
};

const COURSE_STATUSES = ["requested", "approved", "rejected", "completed"] as const;

function courseStatusLabel(value: (typeof COURSE_STATUSES)[number], locale: "zh" | "en") {
  const zh: Record<string, string> = {
    requested: "待审批",
    approved: "已通过",
    rejected: "已拒绝",
    completed: "已完成"
  };
  const en: Record<string, string> = {
    requested: "Requested",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed"
  };
  return (locale === "zh" ? zh : en)[value] || value;
}

function makeStudentStatusPie(locale: "zh" | "en", byStatus: Record<string, number>) {
  const items = Object.entries(byStatus).map(([name, value]) => ({ name, value: Number(value || 0) }));
  return {
    tooltip: { trigger: "item" },
    legend: { top: 0, textStyle: { color: "rgba(255,255,255,0.7)" } },
    series: [
      {
        type: "pie",
        radius: ["35%", "70%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: "#050a14", borderWidth: 2 },
        label: { color: "rgba(255,255,255,0.75)" },
        labelLine: { lineStyle: { color: "rgba(255,255,255,0.25)" } },
        data: items
      }
    ],
    title: {
      text: locale === "zh" ? "学员状态分布" : "Student status",
      left: "center",
      top: 32,
      textStyle: { color: "rgba(255,255,255,0.85)", fontSize: 14 }
    }
  };
}

function makeCourseStatusBar(locale: "zh" | "en", courses: Summary["courses"]) {
  const labels = COURSE_STATUSES.map((s) => courseStatusLabel(s, locale));
  const values = COURSE_STATUSES.map((s) => Number(courses[s] || 0));
  return {
    tooltip: { trigger: "axis" },
    grid: { left: 16, right: 16, top: 48, bottom: 24, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { color: "rgba(255,255,255,0.65)" },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.2)" } }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "rgba(255,255,255,0.65)" },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.12)" } }
    },
    series: [
      {
        name: locale === "zh" ? "数量" : "Count",
        type: "bar",
        data: values,
        itemStyle: { borderRadius: [8, 8, 0, 0], color: "#38bdf8" }
      }
    ],
    title: {
      text: locale === "zh" ? "课程申请/进度状态" : "Course access status",
      left: "center",
      top: 12,
      textStyle: { color: "rgba(255,255,255,0.85)", fontSize: 14 }
    }
  };
}

function makePendingBar(locale: "zh" | "en", pending: Summary["pending"]) {
  const labels = [locale === "zh" ? "课程待审批" : "Course requests", locale === "zh" ? "文件待审批" : "File requests"];
  const values = [Number(pending.courseAccessRequests || 0), Number(pending.fileAccessRequests || 0)];
  return {
    tooltip: { trigger: "axis" },
    grid: { left: 16, right: 16, top: 48, bottom: 24, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { color: "rgba(255,255,255,0.65)" },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.2)" } }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "rgba(255,255,255,0.65)" },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.12)" } }
    },
    series: [
      {
        type: "bar",
        data: values,
        itemStyle: { borderRadius: [8, 8, 0, 0], color: "#f59e0b" }
      }
    ],
    title: {
      text: locale === "zh" ? "待处理" : "Pending",
      left: "center",
      top: 12,
      textStyle: { color: "rgba(255,255,255,0.85)", fontSize: 14 }
    }
  };
}

export function AdminReportsClient({ locale, meRole }: { locale: "zh" | "en"; meRole: "leader" | "super_admin" }) {
  const [leaders, setLeaders] = React.useState<LeaderRow[]>([]);
  const [leaderId, setLeaderId] = React.useState<string>("");

  const [data, setData] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadSummary = React.useCallback(
    async (nextLeaderId: string) => {
      setLoading(true);
      setError(null);
      try {
        const qs = nextLeaderId ? `?leaderId=${encodeURIComponent(nextLeaderId)}` : "";
        const res = await fetch(`/api/system/admin/reports/summary${qs}`, { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.ok) throw new Error(json?.error || "load_failed");
        setData(json as Summary);
      } catch (e: any) {
        setError(e?.message || "load_failed");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    loadSummary("");
  }, [loadSummary]);

  React.useEffect(() => {
    if (meRole !== "super_admin") return;
    let alive = true;
    const loadLeaders = async () => {
      try {
        const res = await fetch("/api/system/admin/leaders/list", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        if (!res.ok || !json?.ok) return;
        const rows = (Array.isArray(json.items) ? json.items : []) as LeaderRow[];
        setLeaders(rows.filter((r) => r.role === "leader"));
      } catch {
        // ignore
      }
    };
    loadLeaders();
    return () => {
      alive = false;
    };
  }, [meRole]);

  const studentPie = React.useMemo(() => (data ? makeStudentStatusPie(locale, data.students.byStatus) : null), [data, locale]);
  const courseBar = React.useMemo(() => (data ? makeCourseStatusBar(locale, data.courses) : null), [data, locale]);
  const pendingBar = React.useMemo(() => (data ? makePendingBar(locale, data.pending) : null), [data, locale]);

  const empty = !loading && !error && data && data.students.total === 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">{locale === "zh" ? "统计报表" : "Reports"}</div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh"
            ? meRole === "super_admin"
              ? "全局统计，可按团队长筛选。"
              : "仅统计你的团队数据（不含捐赠/联系记录）。"
            : meRole === "super_admin"
              ? "Global stats with leader filter."
              : "Team-scoped stats (no donate/contact records)."}
        </div>
      </div>

      {meRole === "super_admin" ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-wrap items-center gap-3">
          <div className="text-sm text-white/70">{locale === "zh" ? "团队长筛选" : "Leader filter"}</div>
          <select
            value={leaderId}
            onChange={(e) => {
              const v = e.target.value;
              setLeaderId(v);
              loadSummary(v);
            }}
            className="rounded-xl border border-white/10 bg-[#050a14] px-3 py-2 text-white/85 text-sm"
          >
            <option value="">{locale === "zh" ? "全部" : "All"}</option>
            {leaders.map((l) => (
              <option key={l.id} value={l.id}>
                {(l.full_name || l.email || l.id).slice(0, 80)}
              </option>
            ))}
          </select>
          <div className="ml-auto text-xs text-white/45">
            {data?.generatedAt ? `${locale === "zh" ? "生成时间" : "Generated"}: ${new Date(data.generatedAt).toLocaleString()}` : ""}
          </div>
        </div>
      ) : (
        <div className="text-xs text-white/45">{data?.generatedAt ? `${locale === "zh" ? "生成时间" : "Generated"}: ${new Date(data.generatedAt).toLocaleString()}` : ""}</div>
      )}

      {loading ? <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">{locale === "zh" ? "加载中…" : "Loading…"}</div> : null}
      {error ? <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">{error}</div> : null}

      {!loading && !error && data ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/50">{locale === "zh" ? "学员数" : "Students"}</div>
              <div className="mt-2 text-3xl font-semibold text-white">{data.students.total}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/50">{locale === "zh" ? "冻结" : "Frozen"}</div>
              <div className="mt-2 text-3xl font-semibold text-white">{data.students.frozen}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/50">{locale === "zh" ? "课程待审批" : "Course requests"}</div>
              <div className="mt-2 text-3xl font-semibold text-white">{data.pending.courseAccessRequests}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/50">{locale === "zh" ? "文件待审批" : "File requests"}</div>
              <div className="mt-2 text-3xl font-semibold text-white">{data.pending.fileAccessRequests}</div>
            </div>
          </div>

          {empty ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-white/60">
              {locale === "zh" ? "暂无数据" : "No data"}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 h-[380px]">
                {studentPie ? <EChart option={studentPie as any} className="h-full w-full" /> : null}
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 h-[380px]">
                {courseBar ? <EChart option={courseBar as any} className="h-full w-full" /> : null}
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 h-[380px]">
                {pendingBar ? <EChart option={pendingBar as any} className="h-full w-full" /> : null}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

