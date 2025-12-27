"use client";

import React from "react";

import { isStrongSystemPassword } from "@/lib/system/passwordPolicy";

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
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: "student";
  status: "active" | "frozen";
  student_status: "普通学员" | "考核通过" | "学习中" | "捐赠学员";
  leader_id: string | null;
  created_at?: string;
  last_login_at?: string | null;
};

export function AdminStudentDetailClient({
  locale,
  userId
}: {
  locale: "zh" | "en";
  userId: string;
}) {
  const [meRole, setMeRole] = React.useState<"leader" | "super_admin" | null>(null);
  const [user, setUser] = React.useState<UserRow | null>(null);
  const [access, setAccess] = React.useState<AccessRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [resetPw, setResetPw] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState({ title: "", content: "" });
  const [busy, setBusy] = React.useState(false);
  const [customPassword, setCustomPassword] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/system/me", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        const role = json?.ok ? String(json?.user?.role || "") : "";
        if (role === "super_admin") setMeRole("super_admin");
        else if (role === "leader") setMeRole("leader");
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
    if (!user || meRole !== "super_admin") return;
    setBusy(true);
    setResetPw(null);
    setError(null);
    try {
      if (customPassword && !isStrongSystemPassword(customPassword)) {
        throw new Error(locale === "zh" ? "新密码强度不足" : "Weak password");
      }

      const res = await fetch(`/api/system/admin/students/${user.id}/reset-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(customPassword ? { newPassword: customPassword } : {})
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "reset_failed");
      setResetPw(String(json.newPassword || ""));
      setCustomPassword("");
      await load();
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
    if (!user || meRole !== "super_admin") return;
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

  const field = (label: string, value?: string | null) => (
    <div className="text-xs text-white/50">
      {label}: <span className="text-white/80">{value || "-"}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
          {locale === "zh" ? "加载中…" : "Loading…"}
        </div>
      ) : null}

      {user ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-white/90 font-semibold text-xl">
              {locale === "zh" ? "学员详情" : "Student details"}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={toggleStatus}
                className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
              >
                {user.status === "active" ? (locale === "zh" ? "冻结账号" : "Freeze") : locale === "zh" ? "解冻账号" : "Unfreeze"}
              </button>
              {meRole === "super_admin" ? (
                <>
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
                </>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
              <div className="text-white/85 font-semibold">{locale === "zh" ? "基本信息" : "Profile"}</div>
              {field(locale === "zh" ? "姓名" : "Name", user.full_name)}
              {field(locale === "zh" ? "邮箱" : "Email", user.email)}
              {field(locale === "zh" ? "手机号" : "Phone", user.phone)}
              {field(locale === "zh" ? "角色" : "Role", user.role)}
              {field(locale === "zh" ? "状态" : "Status", user.status)}
              {field(locale === "zh" ? "学员状态" : "Student status", user.student_status)}
              {field(locale === "zh" ? "注册时间" : "Created", user.created_at ? new Date(user.created_at).toLocaleString() : null)}
              {field(locale === "zh" ? "最后登录" : "Last login", user.last_login_at ? new Date(user.last_login_at).toLocaleString() : null)}
              <div className="pt-2">
                <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "修改学员状态" : "Update status"}</div>
                <select
                  value={user.student_status}
                  onChange={async (e) => {
                    const next = e.target.value;
                    setBusy(true);
                    setError(null);
                    try {
                      const res = await fetch(`/api/system/admin/students/${user.id}/student-status`, {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ student_status: next })
                      });
                      const json = await res.json().catch(() => null);
                      if (!res.ok || !json?.ok) throw new Error(json?.error || "update_failed");
                      await load();
                    } catch (err: any) {
                      setError(err?.message || "update_failed");
                    } finally {
                      setBusy(false);
                    }
                  }}
                  disabled={busy}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
                >
                  <option value="普通学员">普通学员</option>
                  <option value="考核通过">考核通过</option>
                  <option value="学习中">学习中</option>
                  <option value="捐赠学员">捐赠学员</option>
                </select>
              </div>
            </div>

            {meRole === "super_admin" ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="text-white/85 font-semibold">{locale === "zh" ? "重置密码" : "Reset password"}</div>
                <input
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
                  placeholder={locale === "zh" ? "输入新密码（可选）" : "Custom password (optional)"}
                />
                <div className="text-xs text-white/45">
                  {locale === "zh"
                    ? "规则：大写+小写+数字+特殊字符，长度 8-64"
                    : "Rule: upper+lower+digit+special, 8-64 chars."}
                </div>
                {resetPw ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                    {locale === "zh" ? "新密码：" : "New password: "} <span className="font-semibold">{resetPw}</span>
                  </div>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={resetPassword}
                  className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
                >
                  {locale === "zh" ? "执行重置" : "Reset now"}
                </button>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="text-white/85 font-semibold">{locale === "zh" ? "发送通知" : "Send message"}</div>
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy || !msg.content.trim()}
                onClick={sendMessage}
                className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
              >
                {locale === "zh" ? "发送" : "Send"}
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
            <div className="text-xs text-white/45">
              {locale === "zh"
                ? "消息会出现在学员系统的“通知”里。"
                : "Messages show up in student's Notifications."}
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">{error}</div>
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

