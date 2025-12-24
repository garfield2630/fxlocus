"use client";

import React from "react";

type Me = {
  ok: boolean;
  user?: {
    full_name: string;
    email: string | null;
    phone: string | null;
    role: "admin" | "student";
    status: "active" | "frozen";
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

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">{locale === "zh" ? "个人资料" : "Profile"}</div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh" ? "修改姓名/手机号，密码在此更新。" : "Update your info and password."}
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
            <div className="text-xs text-white/50">
              {locale === "zh" ? "邮箱：" : "Email: "} {me.user?.email || "-"}
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={saveProfile}
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
            >
              {locale === "zh" ? "保存" : "Save"}
            </button>
          </div>

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
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={saving || !currentPassword.trim() || !newPassword.trim()}
              onClick={changePassword}
              className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
            >
              {locale === "zh" ? "更新密码" : "Update password"}
            </button>
            <div className="text-xs text-white/50">
              {locale === "zh" ? "建议使用 8 位以上强密码。" : "Use a strong password (8+ chars)."}
            </div>
          </div>
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
