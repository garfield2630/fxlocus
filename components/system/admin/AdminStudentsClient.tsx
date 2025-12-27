"use client";

import React from "react";

import { isStrongSystemPassword } from "@/lib/system/passwordPolicy";
import { Tooltip } from "@/components/system/Tooltip";

type StudentRow = {
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
  stats?: { requested: number; approved: number; completed: number; rejected: number };
};

type LeaderRow = { id: string; role: "leader" | "super_admin"; full_name: string | null; email: string | null };

const STUDENT_STATUS_OPTIONS = ["普通学员", "考核通过", "学习中", "捐赠学员"] as const;
type StudentStatus = (typeof STUDENT_STATUS_OPTIONS)[number];

function formatTime(value: string | null | undefined, locale: "zh" | "en") {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString(locale === "zh" ? "zh-CN" : "en-US");
  } catch {
    return value;
  }
}

function passwordIssues(value: string, locale: "zh" | "en") {
  const pwd = String(value || "");
  const issues: string[] = [];
  if (pwd.length < 8) issues.push(locale === "zh" ? "至少 8 位" : "Min 8 chars");
  if (pwd.length > 64) issues.push(locale === "zh" ? "不超过 64 位" : "Max 64 chars");
  if (!/[a-z]/.test(pwd)) issues.push(locale === "zh" ? "需要小写字母" : "Lowercase required");
  if (!/[A-Z]/.test(pwd)) issues.push(locale === "zh" ? "需要大写字母" : "Uppercase required");
  if (!/\d/.test(pwd)) issues.push(locale === "zh" ? "需要数字" : "Digit required");
  if (!/[^A-Za-z0-9]/.test(pwd)) issues.push(locale === "zh" ? "需要特殊字符" : "Special char required");
  return issues;
}

export function AdminStudentsClient({ locale }: { locale: "zh" | "en" }) {
  const [items, setItems] = React.useState<StudentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [meRole, setMeRole] = React.useState<"leader" | "super_admin" | null>(null);
  const [leaders, setLeaders] = React.useState<LeaderRow[]>([]);

  const [filters, setFilters] = React.useState<{
    q: string;
    status: "all" | "active" | "frozen";
    studentStatus: "all" | StudentStatus;
  }>(() => ({ q: "", status: "all", studentStatus: "all" }));

  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    initialPassword: "",
    defaultOpenCourses: 0,
    leaderId: ""
  });
  const [creating, setCreating] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [bulkMsg, setBulkMsg] = React.useState({ title: "", content: "" });

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

  React.useEffect(() => {
    if (meRole !== "super_admin") return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/system/admin/leaders/list", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        if (!res.ok || !json?.ok) return;
        const raw: LeaderRow[] = Array.isArray(json.items) ? json.items : [];
        setLeaders(raw.filter((r) => r.role === "leader"));
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [meRole]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/system/admin/students/list", { cache: "no-store" });
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

  const createStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const issues = passwordIssues(form.initialPassword, locale);
      if (issues.length) throw new Error((locale === "zh" ? "密码不符合规则：" : "Password issues: ") + issues.join(" · "));

      const res = await fetch("/api/system/admin/students/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          initialPassword: form.initialPassword,
          defaultOpenCourses: Number(form.defaultOpenCourses || 0),
          leaderId: meRole === "super_admin" ? form.leaderId || undefined : undefined
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "create_failed");
      setForm({ fullName: "", email: "", phone: "", initialPassword: "", defaultOpenCourses: 0, leaderId: "" });
      await load();
    } catch (e: any) {
      setError(e?.message || "create_failed");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (row: StudentRow) => {
    const next = row.status === "active" ? "frozen" : "active";
    try {
      await fetch(`/api/system/admin/students/${row.id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next })
      });
      await load();
    } catch {
      // ignore
    }
  };

  const pwdIssues = form.initialPassword ? passwordIssues(form.initialPassword, locale) : [];
  const passwordOk = form.initialPassword ? isStrongSystemPassword(form.initialPassword) : false;
  const selectedList = Array.from(selected);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (items.length && prev.size !== items.length) {
        items.forEach((it) => next.add(it.id));
      } else {
        next.clear();
      }
      return next;
    });
  };

  const sendBulk = async () => {
    if (!selectedList.length || !bulkMsg.title.trim()) return;
    setError(null);
    try {
      const res = await fetch("/api/system/admin/notifications/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userIds: selectedList,
          title: bulkMsg.title.trim(),
          content: bulkMsg.content.trim() || undefined
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "send_failed");
      setBulkMsg({ title: "", content: "" });
      setSelected(new Set());
    } catch (e: any) {
      setError(e?.message || "send_failed");
    }
  };

  const filtered = React.useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
    return items.filter((row) => {
      if (filters.status !== "all" && row.status !== filters.status) return false;
      if (filters.studentStatus !== "all" && row.student_status !== filters.studentStatus) return false;
      if (!needle) return true;
      const hay = `${row.full_name || ""} ${row.email || ""} ${row.phone || ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [filters.q, filters.status, filters.studentStatus, items]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">{locale === "zh" ? "学员管理" : "Students"}</div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh"
            ? "创建学员、冻结账号、查看课程申请与进度。"
            : "Create students, freeze accounts, and review progress."}
        </div>
      </div>

      <form onSubmit={createStudent} className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/85 font-semibold">{locale === "zh" ? "创建学员" : "Create student"}</div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "姓名" : "Full name"}</div>
            <input
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
              placeholder={locale === "zh" ? "请输入真实姓名/昵称" : "Enter name"}
              required
            />
          </div>
          <div>
            <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "邮箱（登录账号）" : "Email (login)"}</div>
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "手机号（可选）" : "Phone (optional)"}</div>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
              placeholder={locale === "zh" ? "用于联系（可留空）" : "Optional"}
            />
          </div>
          <div>
            <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "初始密码" : "Initial password"}</div>
            <input
              value={form.initialPassword}
              onChange={(e) => setForm((p) => ({ ...p, initialPassword: e.target.value }))}
              className={[
                "w-full rounded-xl border bg-white/5 px-3 py-2 text-white/85 text-sm",
                form.initialPassword && !passwordOk ? "border-rose-400/30" : "border-white/10"
              ].join(" ")}
              placeholder={locale === "zh" ? "至少 8 位，包含大小写/数字/特殊字符" : "8+ chars, upper/lower/digit/special"}
              required
              type="password"
            />
            {form.initialPassword && pwdIssues.length ? (
              <div className="mt-2 text-xs text-rose-200/90">{pwdIssues.join(" · ")}</div>
            ) : (
              <div className="mt-2 text-xs text-white/45">
                {locale === "zh" ? "规则：大写+小写+数字+特殊字符，长度 8-64" : "Rule: upper+lower+digit+special, 8-64 chars."}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-white/55 mb-2">
              {locale === "zh" ? "默认开通课程多少节" : "Default open lessons"}
            </div>
            <input
              type="number"
              min={0}
              max={20}
              value={form.defaultOpenCourses}
              onChange={(e) => setForm((p) => ({ ...p, defaultOpenCourses: Number(e.target.value || 0) }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            />
            <div className="mt-2 text-xs text-white/45">
              {locale === "zh"
                ? "例如填 3，则默认开通第 1~3 课（可后续在课程审批中调整）。"
                : "E.g. 3 means course #1~#3 approved by default."}
            </div>
          </div>

          {meRole === "super_admin" ? (
            <div>
              <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "归属团队长" : "Leader owner"}</div>
              <select
                value={form.leaderId}
                onChange={(e) => setForm((p) => ({ ...p, leaderId: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
              >
                <option value="">{locale === "zh" ? "（可选）不指定" : "(optional) Unassigned"}</option>
                {leaders.map((l) => (
                  <option key={l.id} value={l.id}>
                    {(l.full_name || l.email || l.id) as any}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-white/45">
                {locale === "zh"
                  ? "团队长创建时会自动归属到自己；超管可在此指定归属。"
                  : "Leader-created students auto-assign; super admin can set owner here."}
              </div>
            </div>
          ) : null}

          <div className="md:col-span-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={creating || !passwordOk}
              className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white hover:bg-white/15 disabled:opacity-50"
            >
              {creating ? (locale === "zh" ? "创建中…" : "Creating…") : locale === "zh" ? "创建学员" : "Create student"}
            </button>
          </div>
        </div>
      </form>

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">{error}</div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 text-white/85 font-semibold">
          {locale === "zh" ? "学员列表" : "List"}
        </div>

        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center gap-2">
          <input
            value={filters.q}
            onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
            className="min-w-[220px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85"
            placeholder={locale === "zh" ? "搜索：姓名/邮箱/手机" : "Search: name/email/phone"}
          />
          <select
            value={filters.studentStatus}
            onChange={(e) => setFilters((p) => ({ ...p, studentStatus: e.target.value as any }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85"
          >
            <option value="all">{locale === "zh" ? "全部学员状态" : "All student status"}</option>
            {STUDENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value as any }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85"
          >
            <option value="all">{locale === "zh" ? "全部账号状态" : "All account status"}</option>
            <option value="active">{locale === "zh" ? "正常" : "Active"}</option>
            <option value="frozen">{locale === "zh" ? "冻结" : "Frozen"}</option>
          </select>
        </div>

        {loading ? <div className="p-6 text-white/60">{locale === "zh" ? "加载中…" : "Loading…"}</div> : null}
        {!loading && !filtered.length ? <div className="p-6 text-white/60">{locale === "zh" ? "暂无数据" : "No items"}</div> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs text-white/50">
              <tr className="border-b border-white/10">
                <th className="px-6 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={Boolean(filtered.length) && selected.size === filtered.length}
                    onChange={() => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (filtered.length && prev.size !== filtered.length) filtered.forEach((it) => next.add(it.id));
                        else filtered.forEach((it) => next.delete(it.id));
                        return next;
                      });
                    }}
                    className="h-4 w-4 accent-sky-400"
                    aria-label="select all"
                  />
                </th>
                <th className="px-6 py-3 text-left">{locale === "zh" ? "姓名" : "Name"}</th>
                <th className="px-6 py-3 text-left">{locale === "zh" ? "邮箱" : "Email"}</th>
                <th className="px-6 py-3 text-left">{locale === "zh" ? "手机号" : "Phone"}</th>
                <th className="px-6 py-3 text-left">{locale === "zh" ? "学员状态" : "Student status"}</th>
                <th className="px-6 py-3 text-left">{locale === "zh" ? "账号" : "Account"}</th>
                <th className="px-6 py-3 text-left">{locale === "zh" ? "最近登录" : "Last login"}</th>
                <th className="px-6 py-3 text-right">{locale === "zh" ? "操作" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 align-middle">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelected(row.id)}
                      className="h-4 w-4 accent-sky-400"
                      aria-label="select"
                    />
                  </td>
                  <td className="px-6 py-4 text-white/90 font-semibold">{row.full_name || "-"}</td>
                  <td className="px-6 py-4 text-white/70">
                    <Tooltip content={row.email || "-"}>
                      <span className="block max-w-[240px] truncate">{row.email || "-"}</span>
                    </Tooltip>
                  </td>
                  <td className="px-6 py-4 text-white/70">
                    <Tooltip content={row.phone || "-"}>
                      <span className="block max-w-[160px] truncate">{row.phone || "-"}</span>
                    </Tooltip>
                  </td>
                  <td className="px-6 py-4 text-white/70">{row.student_status || "-"}</td>
                  <td className="px-6 py-4 text-white/70">
                    <span className={row.status === "active" ? "text-emerald-300" : "text-rose-300"}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/60">{formatTime(row.last_login_at, locale)}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <a
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                      href={`/${locale}/system/admin/students/${row.id}`}
                    >
                      {locale === "zh" ? "详情" : "Details"}
                    </a>
                    <button
                      type="button"
                      onClick={() => toggleStatus(row)}
                      className="ml-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                    >
                      {row.status === "active" ? (locale === "zh" ? "冻结" : "Freeze") : locale === "zh" ? "解冻" : "Unfreeze"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-white/10 text-xs text-white/50 flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
          >
            {selected.size === items.length && items.length
              ? locale === "zh"
                ? "取消全选"
                : "Clear all"
              : locale === "zh"
                ? "全选当前"
                : "Select all"}
          </button>
          <span className="ml-auto">
            {locale === "zh" ? "已选" : "Selected"} {selected.size}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
        <div className="text-white/85 font-semibold">
          {locale === "zh" ? "批量通知" : "Bulk notifications"}
        </div>
        <div className="text-xs text-white/50">
          {locale === "zh"
            ? "已选学员会收到系统通知（支持多选）。"
            : "Selected students will receive a system notification."}
        </div>
        <input
          value={bulkMsg.title}
          onChange={(e) => setBulkMsg((p) => ({ ...p, title: e.target.value }))}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
          placeholder={locale === "zh" ? "标题（必填）" : "Title (required)"}
        />
        <textarea
          value={bulkMsg.content}
          onChange={(e) => setBulkMsg((p) => ({ ...p, content: e.target.value }))}
          className="w-full min-h-[120px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
          placeholder={locale === "zh" ? "内容（可选）" : "Content (optional)"}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!selectedList.length || !bulkMsg.title.trim()}
            onClick={sendBulk}
            className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
          >
            {locale === "zh" ? `发送给已选(${selectedList.length})` : `Send (${selectedList.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
