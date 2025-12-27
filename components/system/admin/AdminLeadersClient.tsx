"use client";

import React from "react";

import { isStrongSystemPassword } from "@/lib/system/passwordPolicy";

type LeaderRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "leader" | "super_admin";
  status: "active" | "frozen";
  created_at?: string;
  last_login_at?: string | null;
};

type AuditRow = {
  id: string;
  created_at: string;
  from_role: string;
  to_role: string;
  reason: string | null;
  target_id: string;
  actor_id: string;
  target?: { full_name: string | null; email: string | null } | null;
  actor?: { full_name: string | null; email: string | null } | null;
};

function roleLabelZh(role: string) {
  if (role === "super_admin") return "超管";
  if (role === "leader") return "团队长";
  if (role === "student") return "学员";
  return role;
}

export function AdminLeadersClient({ locale }: { locale: "zh" | "en" }) {
  const [items, setItems] = React.useState<LeaderRow[]>([]);
  const [audit, setAudit] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [createForm, setCreateForm] = React.useState({
    email: "",
    fullName: "",
    phone: "",
    password: "",
    reason: ""
  });
  const [creating, setCreating] = React.useState(false);

  const [changeForm, setChangeForm] = React.useState({
    email: "",
    toRole: "leader" as "student" | "leader" | "super_admin",
    leaderId: "",
    reason: ""
  });
  const [changing, setChanging] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadersRes, auditRes] = await Promise.all([
        fetch("/api/system/admin/leaders/list", { cache: "no-store" }),
        fetch("/api/system/admin/leaders/audit", { cache: "no-store" })
      ]);

      const leadersJson = await leadersRes.json().catch(() => null);
      if (!leadersRes.ok || !leadersJson?.ok) throw new Error(leadersJson?.error || "load_failed");
      setItems(Array.isArray(leadersJson.items) ? leadersJson.items : []);

      const auditJson = await auditRes.json().catch(() => null);
      if (auditRes.ok && auditJson?.ok) {
        setAudit(Array.isArray(auditJson.items) ? auditJson.items : []);
      }
    } catch (e: any) {
      setError(e?.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const createLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      if (!isStrongSystemPassword(createForm.password)) {
        throw new Error(locale === "zh" ? "密码强度不足" : "Weak password");
      }
      const res = await fetch("/api/system/admin/leaders/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: createForm.email,
          fullName: createForm.fullName || undefined,
          phone: createForm.phone || undefined,
          password: createForm.password,
          reason: createForm.reason || undefined
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "create_failed");
      setCreateForm({ email: "", fullName: "", phone: "", password: "", reason: "" });
      await load();
    } catch (e: any) {
      setError(e?.message || "create_failed");
    } finally {
      setCreating(false);
    }
  };

  const changeRoleByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setChanging(true);
    setError(null);
    try {
      const res = await fetch("/api/system/admin/leaders/role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: changeForm.email,
          toRole: changeForm.toRole,
          leaderId: changeForm.toRole === "student" ? changeForm.leaderId || undefined : undefined,
          reason: changeForm.reason || undefined
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "update_failed");
      await load();
    } catch (e: any) {
      setError(e?.message || "update_failed");
    } finally {
      setChanging(false);
    }
  };

  const quickChange = async (row: LeaderRow, toRole: "student" | "leader" | "super_admin") => {
    const reason = window.prompt(locale === "zh" ? "请输入原因（可选）" : "Reason (optional)") || "";
    const leaderId =
      toRole === "student"
        ? window.prompt(locale === "zh" ? "学员归属 leader_id（可留空）" : "leader_id for student (optional)") || ""
        : "";

    setError(null);
    try {
      const res = await fetch("/api/system/admin/leaders/role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetId: row.id,
          toRole,
          leaderId: toRole === "student" ? leaderId || undefined : undefined,
          reason: reason || undefined
        })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "update_failed");
      await load();
    } catch (e: any) {
      setError(e?.message || "update_failed");
    }
  };

  const passwordOk = createForm.password ? isStrongSystemPassword(createForm.password) : false;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">{locale === "zh" ? "团队长管理" : "Leaders"}</div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh"
            ? "创建团队长账号、升降级，并记录审计日志。仅超管可用。"
            : "Create leaders, change roles, and view audit logs (super admin only)."}
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">{error}</div>
      ) : null}

      <form onSubmit={createLeader} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
        <div className="text-white/85 font-semibold">{locale === "zh" ? "创建团队长账号" : "Create leader"}</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input
            value={createForm.email}
            onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder="Email"
            required
          />
          <input
            value={createForm.fullName}
            onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "姓名（可选）" : "Full name (optional)"}
          />
          <input
            value={createForm.phone}
            onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "手机号（可选）" : "Phone (optional)"}
          />
          <input
            value={createForm.password}
            onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "初始密码" : "Initial password"}
            required
            type="password"
          />
          <input
            value={createForm.reason}
            onChange={(e) => setCreateForm((p) => ({ ...p, reason: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "原因（可选）" : "Reason (optional)"}
          />
          <button
            type="submit"
            disabled={creating || !passwordOk}
            className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white hover:bg-white/15 disabled:opacity-50"
          >
            {creating ? (locale === "zh" ? "创建中…" : "Creating…") : locale === "zh" ? "创建" : "Create"}
          </button>
        </div>
        <div className="text-xs text-white/45">
          {locale === "zh"
            ? "密码规则：大写+小写+数字+特殊字符，长度 8-64"
            : "Password rule: upper+lower+digit+special, 8-64 chars."}
        </div>
      </form>

      <form onSubmit={changeRoleByEmail} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
        <div className="text-white/85 font-semibold">{locale === "zh" ? "按邮箱升降级" : "Change role by email"}</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={changeForm.email}
            onChange={(e) => setChangeForm((p) => ({ ...p, email: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder="Email"
            required
          />
          <select
            value={changeForm.toRole}
            onChange={(e) => setChangeForm((p) => ({ ...p, toRole: e.target.value as any }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
          >
            <option value="leader">{locale === "zh" ? "升为团队长" : "Promote to leader"}</option>
            <option value="super_admin">{locale === "zh" ? "升为超管" : "Promote to super admin"}</option>
            <option value="student">{locale === "zh" ? "降为学员" : "Demote to student"}</option>
          </select>
          <input
            value={changeForm.leaderId}
            onChange={(e) => setChangeForm((p) => ({ ...p, leaderId: e.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "leader_id（仅降为学员时可选）" : "leader_id (optional for student)"}
            disabled={changeForm.toRole !== "student"}
          />
          <div className="flex items-center gap-2">
            <input
              value={changeForm.reason}
              onChange={(e) => setChangeForm((p) => ({ ...p, reason: e.target.value }))}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 text-sm"
              placeholder={locale === "zh" ? "原因（可选）" : "Reason (optional)"}
            />
            <button
              type="submit"
              disabled={changing}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
            >
              {changing ? (locale === "zh" ? "处理中…" : "Updating…") : locale === "zh" ? "执行" : "Apply"}
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 text-white/85 font-semibold">
          {locale === "zh" ? "团队长 / 超管列表" : "Leaders / Super admins"}
        </div>

        {loading ? <div className="p-6 text-white/60">{locale === "zh" ? "加载中…" : "Loading…"}</div> : null}
        {!loading && !items.length ? <div className="p-6 text-white/60">{locale === "zh" ? "暂无数据" : "No items"}</div> : null}

        <div className="divide-y divide-white/10">
          {items.map((row) => (
            <div key={row.id} className="px-6 py-4 flex flex-wrap items-center gap-3">
              <div className="min-w-[260px]">
                <div className="text-white/90 font-semibold">{row.full_name || "-"}</div>
                <div className="text-xs text-white/50 mt-1">
                  {row.email || "-"} {row.phone ? `· ${row.phone}` : ""}
                </div>
              </div>
              <div className="text-xs text-white/50">
                {locale === "zh" ? "角色" : "Role"}:{" "}
                <span className="text-white/80">{locale === "zh" ? roleLabelZh(row.role) : row.role}</span>
              </div>
              <div className="text-xs text-white/50">
                {locale === "zh" ? "状态" : "Status"}:{" "}
                <span className={row.status === "active" ? "text-emerald-300" : "text-rose-300"}>
                  {row.status}
                </span>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {row.role === "leader" ? (
                  <button
                    type="button"
                    onClick={() => quickChange(row, "super_admin")}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                  >
                    {locale === "zh" ? "升为超管" : "Promote"}
                  </button>
                ) : null}
                {row.role === "super_admin" ? (
                  <button
                    type="button"
                    onClick={() => quickChange(row, "leader")}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                  >
                    {locale === "zh" ? "降为团队长" : "Demote"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => quickChange(row, "student")}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-100 hover:bg-rose-500/15"
                >
                  {locale === "zh" ? "降为学员" : "To student"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 text-white/85 font-semibold">
          {locale === "zh" ? "审计日志" : "Audit logs"}
        </div>
        {!audit.length ? (
          <div className="p-6 text-white/60">{locale === "zh" ? "暂无数据" : "No items"}</div>
        ) : (
          <div className="divide-y divide-white/10">
            {audit.slice(0, 50).map((a) => (
              <div key={a.id} className="px-6 py-3 text-sm text-white/75 flex flex-wrap gap-2">
                <div className="text-white/50">
                  {a.created_at ? new Date(a.created_at).toLocaleString() : "-"}
                </div>
                <div className="text-white/80">
                  {(a.actor?.full_name || a.actor?.email || a.actor_id || "-") as any}
                </div>
                <div className="text-white/50">{locale === "zh" ? "把" : "changed"}</div>
                <div className="text-white/80">
                  {(a.target?.full_name || a.target?.email || a.target_id || "-") as any}
                </div>
                <div className="text-white/50">{locale === "zh" ? "从" : "from"}</div>
                <div className="text-white/80">{locale === "zh" ? roleLabelZh(a.from_role) : a.from_role}</div>
                <div className="text-white/50">{locale === "zh" ? "改为" : "to"}</div>
                <div className="text-white/80">{locale === "zh" ? roleLabelZh(a.to_role) : a.to_role}</div>
                {a.reason ? <div className="text-white/50">{`· ${a.reason}`}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

