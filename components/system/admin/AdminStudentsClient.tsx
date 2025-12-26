"use client";

import React from "react";

import { isStrongSystemPassword } from "@/lib/system/passwordPolicy";
import type { SystemRole } from "@/lib/system/roles";

type StudentRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: SystemRole;
  status: "active" | "frozen";
  created_at?: string;
  last_login_at?: string | null;
  stats?: { requested: number; approved: number; completed: number; rejected: number };
};

export function AdminStudentsClient({ locale }: { locale: "zh" | "en" }) {
  const [items, setItems] = React.useState<StudentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    phone: "",
    initialPassword: "",
    defaultOpenCourses: 0
  });
  const [creating, setCreating] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [bulkMsg, setBulkMsg] = React.useState({ title: "", content: "" });

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
      if (!isStrongSystemPassword(form.initialPassword)) {
        throw new Error(locale === "zh" ? "初始密码强度不足" : "Weak password");
      }

      const res = await fetch("/api/system/admin/students/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          initialPassword: form.initialPassword,
          defaultOpenCourses: Number(form.defaultOpenCourses || 0)
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "create_failed");
      setForm({ fullName: "", email: "", phone: "", initialPassword: "", defaultOpenCourses: 0 });
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

  const roleLabel = (role: SystemRole) => {
    if (locale === "zh") {
      if (role === "super_admin") return "超级管理员";
      if (role === "admin") return "管理员";
      return "学员";
    }
    if (role === "super_admin") return "Super Admin";
    if (role === "admin") return "Admin";
    return "Student";
  };

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
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "姓名" : "Full name"}
            required
          />
          <input
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder="Email"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "手机号（可选）" : "Phone (optional)"}
          />
          <input
            value={form.initialPassword}
            onChange={(e) => setForm((p) => ({ ...p, initialPassword: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "初始密码" : "Initial password"}
            required
          />
          <input
            type="number"
            min={0}
            max={20}
            value={form.defaultOpenCourses}
            onChange={(e) => setForm((p) => ({ ...p, defaultOpenCourses: Number(e.target.value || 0) }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "默认开放课程数" : "Default open courses"}
          />
          <button
            type="submit"
            disabled={creating || !passwordOk}
            className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white hover:bg-white/15 disabled:opacity-50"
          >
            {creating ? (locale === "zh" ? "创建中…" : "Creating…") : locale === "zh" ? "创建" : "Create"}
          </button>
        </div>
        <div className="mt-3 text-xs text-white/45">
          {locale === "zh"
            ? "规则：大写+小写+数字+特殊字符，长度 8-64"
            : "Rule: upper+lower+digit+special, 8-64 chars."}
        </div>
      </form>

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">{error}</div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 text-white/85 font-semibold">
          {locale === "zh" ? "学员列表" : "List"}
        </div>

        {loading ? (
          <div className="p-6 text-white/60">{locale === "zh" ? "加载中…" : "Loading…"}</div>
        ) : null}

        {!loading && !items.length ? (
          <div className="p-6 text-white/60">{locale === "zh" ? "暂无数据" : "No items"}</div>
        ) : null}

        <div className="divide-y divide-white/10">
          {items.map((row) => (
            <div key={row.id} className="px-6 py-4 flex flex-wrap items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(row.id)}
                onChange={() => toggleSelected(row.id)}
                className="h-4 w-4 accent-sky-400"
                aria-label="select"
              />
              <div className="min-w-[220px]">
                <div className="text-white/90 font-semibold">{row.full_name}</div>
                <div className="text-xs text-white/50 mt-1">
                  {row.email || "-"} {row.phone ? `· ${row.phone}` : ""}
                </div>
              </div>

              <div className="text-xs text-white/50">
                {locale === "zh" ? "状态" : "Status"}:{" "}
                <span className={row.status === "active" ? "text-emerald-300" : "text-rose-300"}>
                  {row.status}
                </span>
              </div>

              <div className="text-xs text-white/50">
                {locale === "zh" ? "角色" : "Role"}:{" "}
                <span className={row.role === "student" ? "text-white/80" : "text-sky-200"}>
                  {roleLabel(row.role)}
                </span>
              </div>

              <div className="text-xs text-white/50">
                {locale === "zh" ? "课程" : "Courses"}:{" "}
                {row.stats ? (
                  <span>
                    {locale === "zh" ? "通过" : "Approved"} {row.stats.approved} ·{" "}
                    {locale === "zh" ? "完成" : "Completed"} {row.stats.completed} ·{" "}
                    {locale === "zh" ? "申请" : "Requested"} {row.stats.requested}
                  </span>
                ) : (
                  "-"
                )}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <a
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                  href={`/${locale}/system/admin/students/${row.id}`}
                >
                  {locale === "zh" ? "详情" : "Details"}
                </a>
                <button
                  type="button"
                  onClick={() => toggleStatus(row)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                >
                  {row.status === "active" ? (locale === "zh" ? "冻结" : "Freeze") : locale === "zh" ? "解冻" : "Unfreeze"}
                </button>
              </div>
            </div>
          ))}
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
