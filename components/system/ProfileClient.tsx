"use client";

import React from "react";

import { isStrongSystemPassword } from "@/lib/system/passwordPolicy";

type Me = {
  ok: boolean;
  user?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    role: "student" | "leader" | "super_admin";
  };
};

export function ProfileClient({ locale }: { locale: "zh" | "en" }) {
  const [me, setMe] = React.useState<Me | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/system/me", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as Me | null;
        if (!alive) return;
        setMe(json);
        setName(json?.user?.full_name || "");
        setPhone(json?.user?.phone || "");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const saveProfile = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/system/profile/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName: name, phone })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "update_failed");
    } catch (e: any) {
      setError(e?.message || "update_failed");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setError(null);
    if (!isStrongSystemPassword(newPassword)) {
      setError(
        locale === "zh"
          ? "新密码必须包含：大写+小写+数字+特殊字符，长度 8-64"
          : "Password must include upper/lower/digit/special and be 8-64 chars."
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/system/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error || "change_failed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: any) {
      setError(e?.message || "change_failed");
    } finally {
      setSaving(false);
    }
  };

  const newOk = newPassword ? isStrongSystemPassword(newPassword) : false;
  const canChangePassword = me?.ok && me.user?.role === "super_admin";

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">{locale === "zh" ? "个人资料" : "Profile"}</div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh"
            ? "修改姓名/手机号。"
            : "Update your info."}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
          {locale === "zh" ? "加载中…" : "Loading…"}
        </div>
      ) : null}

      {me?.ok ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="text-white/85 font-semibold">{locale === "zh" ? "资料" : "Info"}</div>
            <div>
              <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "姓名" : "Full name"}</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
              />
            </div>
            <div>
              <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "手机号" : "Phone"}</div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
              />
            </div>
            <div className="text-xs text-white/50">{locale === "zh" ? "邮箱：" : "Email: "} {me.user?.email || "-"}</div>
            <button
              type="button"
              disabled={saving}
              onClick={saveProfile}
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
            >
              {locale === "zh" ? "保存" : "Save"}
            </button>
          </div>

          {canChangePassword ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
              <div className="text-white/85 font-semibold">{locale === "zh" ? "修改密码" : "Password"}</div>
              <div>
                <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "当前密码" : "Current password"}</div>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
                />
              </div>
              <div>
                <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "新密码" : "New password"}</div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={[
                    "w-full rounded-xl bg-white/5 border px-3 py-2 text-white/85 text-sm",
                    newPassword && !newOk ? "border-rose-400/30" : "border-white/10"
                  ].join(" ")}
                />
              </div>
              <button
                type="button"
                disabled={saving || !currentPassword.trim() || !newOk}
                onClick={changePassword}
                className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
              >
                {locale === "zh" ? "更新密码" : "Update password"}
              </button>
              <div className="text-xs text-white/50">
                {locale === "zh"
                  ? "规则：大写+小写+数字+特殊字符，长度 8-64"
                  : "Rule: upper+lower+digit+special, 8-64 chars."}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 text-rose-100">
          {error}
        </div>
      ) : null}
    </div>
  );
}

