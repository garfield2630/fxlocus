"use client";

import React from "react";

type AccessRow = {
  id: string;
  course_id: number;
  status: string;
  progress: number;
  requested_at?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
};

type UserRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: "active" | "frozen";
  created_at?: string;
  last_login_at?: string | null;
  must_change_password?: boolean;
};

export function AdminStudentDetailClient({
  locale,
  userId
}: {
  locale: "zh" | "en";
  userId: string;
}) {
  const [user, setUser] = React.useState<UserRow | null>(null);
  const [access, setAccess] = React.useState<AccessRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [resetPw, setResetPw] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState({ title: "", content: "" });
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/system/admin/students/${userId}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "load_failed");
      setUser(json.user || null);
      setAccess(Array.isArray(json.access) ? json.access : []);
    } catch (e: any) {
      setError(e?.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const next = user.status === "active" ? "frozen" : "active";
      await fetch(`/api/system/admin/students/${user.id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next })
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!user) return;
    setBusy(true);
    setResetPw(null);
    try {
      const res = await fetch(`/api/system/admin/students/${user.id}/reset-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "reset_failed");
      setResetPw(String(json.newPassword || ""));
    } catch (e: any) {
      setError(e?.message || "reset_failed");
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async () => {
    if (!user) return;
    if (!msg.content.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/system/admin/students/${user.id}/message`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: msg.title || undefined, content: msg.content })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "send_failed");
      setMsg({ title: "", content: "" });
    } catch (e: any) {
      setError(e?.message || "send_failed");
    } finally {
      setBusy(false);
    }
  };

  const approveAll = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await fetch("/api/system/admin/courses/batch-approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const deleteStudent = async () => {
    if (!user) return;
    const ok = window.confirm(
      locale === "zh" ? "确认删除该学员？此操作不可恢复。" : "Delete this student? This cannot be undone."
    );
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/system/admin/students/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "delete_failed");
      window.location.href = `/${locale}/system/admin/students`;
    } catch (e: any) {
      setError(e?.message || "delete_failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex items-center gap-3">
        <div>
          <div className="text-white/90 font-semibold text-xl">
            {locale === "zh" ? "学员详情" : "Student detail"}
          </div>
          <div className="mt-1 text-white/60 text-sm">{userId}</div>
        </div>
        <a
          className="ml-auto px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
          href={`/${locale}/system/admin/students`}
        >
          {locale === "zh" ? "返回列表" : "Back"}
        </a>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
          {locale === "zh" ? "加载中…" : "Loading…"}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          {error}
        </div>
      ) : null}

      {user ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="text-white/85 font-semibold">{locale === "zh" ? "基本信息" : "Info"}</div>
            <div className="text-white/90 font-semibold text-lg">{user.full_name}</div>
            <div className="text-sm text-white/65">
              {user.email || "-"} {user.phone ? `· ${user.phone}` : ""}
            </div>
            <div className="text-xs text-white/50">
              {locale === "zh" ? "状态" : "Status"}:{" "}
              <span className={user.status === "active" ? "text-emerald-300" : "text-rose-300"}>
                {user.status}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={toggleStatus}
                className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
              >
                {user.status === "active" ? (locale === "zh" ? "冻结账号" : "Freeze") : locale === "zh" ? "解冻账号" : "Unfreeze"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={resetPassword}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-50"
              >
                {locale === "zh" ? "重置密码" : "Reset password"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={deleteStudent}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-100 hover:bg-rose-500/15 disabled:opacity-50"
              >
                {locale === "zh" ? "删除学员" : "Delete"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={approveAll}
                className="ml-auto px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-50"
              >
                {locale === "zh" ? "通过所有申请" : "Approve requests"}
              </button>
            </div>
            {resetPw ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                {locale === "zh" ? "新密码：" : "New password: "}{" "}
                <span className="font-semibold">{resetPw}</span>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="text-white/85 font-semibold">{locale === "zh" ? "发送消息" : "Send message"}</div>
            <input
              value={msg.title}
              onChange={(e) => setMsg((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
              placeholder={locale === "zh" ? "标题（可选）" : "Title (optional)"}
            />
            <textarea
              value={msg.content}
              onChange={(e) => setMsg((p) => ({ ...p, content: e.target.value }))}
              className="w-full min-h-[120px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
              placeholder={locale === "zh" ? "内容" : "Content"}
            />
            <button
              type="button"
              disabled={busy || !msg.content.trim()}
              onClick={sendMessage}
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
            >
              {locale === "zh" ? "发送" : "Send"}
            </button>
            <div className="text-xs text-white/45">
              {locale === "zh"
                ? "消息会出现在学员系统的“通知”里。"
                : "Messages show up in student's Notifications."}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 text-white/85 font-semibold">
          {locale === "zh" ? "课程状态" : "Course access"}
        </div>
        <div className="divide-y divide-white/10">
          {access.map((a) => (
            <div key={a.id} className="px-6 py-3 flex items-center gap-3 text-sm">
              <div className="w-16 text-white/80">#{a.course_id}</div>
              <div className="text-white/60">{a.status}</div>
              <div className="ml-auto text-white/50">{typeof a.progress === "number" ? `${a.progress}%` : "-"}</div>
            </div>
          ))}
          {!access.length ? <div className="px-6 py-4 text-white/60">-</div> : null}
        </div>
      </div>
    </div>
  );
}
