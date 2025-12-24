"use client";

import React from "react";

type RequestItem = {
  id: string;
  user_id: string;
  course_id: number;
  requested_at?: string | null;
  system_users?: { full_name?: string; email?: string | null; phone?: string | null } | any;
  courses?: { title_en?: string; title_zh?: string } | any;
};

export function AdminCourseAccessClient({ locale }: { locale: "zh" | "en" }) {
  const [items, setItems] = React.useState<RequestItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/system/admin/courses/requests", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "load_failed");
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch (e: any) {
      setError(e?.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const review = async (item: RequestItem, action: "approve" | "reject") => {
    setBusyId(item.id);
    setError(null);
    try {
      const res = await fetch("/api/system/admin/courses/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          accessId: item.id,
          action,
          rejectionReason: rejectReason[item.id] || undefined
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "update_failed");
      await load();
    } catch (e: any) {
      setError(e?.message || "update_failed");
    } finally {
      setBusyId(null);
    }
  };

  const approveAll = async () => {
    setBusyId("ALL");
    try {
      await fetch("/api/system/admin/courses/batch-approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex items-center gap-3">
        <div>
          <div className="text-white/90 font-semibold text-xl">
            {locale === "zh" ? "课程权限审批" : "Course access"}
          </div>
          <div className="mt-2 text-white/60 text-sm">
            {locale === "zh"
              ? "处理学员课程申请：通过/拒绝。"
              : "Review student requests: approve or reject."}
          </div>
        </div>
        <button
          type="button"
          disabled={busyId === "ALL"}
          onClick={approveAll}
          className="ml-auto px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
        >
          {locale === "zh" ? "一键通过全部" : "Approve all"}
        </button>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 text-white/85 font-semibold">
          {locale === "zh" ? "待审批列表" : "Pending list"}
        </div>

        {loading ? (
          <div className="p-6 text-white/60">{locale === "zh" ? "加载中…" : "Loading…"}</div>
        ) : null}

        {!loading && !items.length ? (
          <div className="p-6 text-white/60">{locale === "zh" ? "暂无申请" : "No requests"}</div>
        ) : null}

        <div className="divide-y divide-white/10">
          {items.map((it) => {
            const user = Array.isArray(it.system_users) ? it.system_users[0] : it.system_users;
            const course = Array.isArray(it.courses) ? it.courses[0] : it.courses;
            const title = locale === "zh" ? course?.title_zh : course?.title_en;
            return (
              <div key={it.id} className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-white/90 font-semibold">
                    #{it.course_id} {title || ""}
                  </div>
                  <div className="text-xs text-white/50">
                    {user?.full_name || "-"} {user?.email ? `· ${user.email}` : ""}
                  </div>
                  <div className="ml-auto text-xs text-white/50">
                    {it.requested_at ? new Date(it.requested_at).toLocaleString() : ""}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === it.id}
                    onClick={() => review(it, "approve")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-400/15 border border-emerald-400/30 text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50"
                  >
                    {locale === "zh" ? "通过" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === it.id}
                    onClick={() => review(it, "reject")}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-100 hover:bg-rose-500/15 disabled:opacity-50"
                  >
                    {locale === "zh" ? "拒绝" : "Reject"}
                  </button>
                  <input
                    value={rejectReason[it.id] || ""}
                    onChange={(e) => setRejectReason((p) => ({ ...p, [it.id]: e.target.value }))}
                    className="ml-auto min-w-[240px] rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85"
                    placeholder={locale === "zh" ? "拒绝原因（可选）" : "Reject reason (optional)"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

