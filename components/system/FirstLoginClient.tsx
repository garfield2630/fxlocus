"use client";

import React from "react";
import { useRouter } from "next/navigation";

export function FirstLoginClient({
  locale,
  userRole
}: {
  locale: "zh" | "en";
  userRole: "admin" | "student";
}) {
  const router = useRouter();
  const [pw1, setPw1] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (pw1.length < 8) {
      setError(locale === "zh" ? "密码至少 8 位。" : "Password must be 8+ chars.");
      return;
    }
    if (pw1 !== pw2) {
      setError(locale === "zh" ? "两次输入不一致。" : "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/system/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newPassword: pw1 })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(locale === "zh" ? "修改失败，请稍后重试。" : "Update failed.");
        return;
      }
      router.replace(userRole === "admin" ? `/${locale}/system/admin` : `/${locale}/system/dashboard`);
    } catch {
      setError(locale === "zh" ? "网络错误，请稍后重试。" : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[520px] py-12">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white font-semibold text-xl">
          {locale === "zh" ? "首次登录：请修改密码" : "First login: change password"}
        </div>
        <div className="mt-2 text-white/60 text-sm leading-6">
          {locale === "zh"
            ? "为保障安全，首次登录必须设置新密码。"
            : "For security, you must set a new password."}
        </div>

        <div className="mt-5 grid gap-3">
          <div>
            <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "新密码" : "New password"}</div>
            <input
              type="password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
            />
          </div>
          <div>
            <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "确认新密码" : "Confirm password"}</div>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
            />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6">
          <button
            type="button"
            disabled={loading || !pw1.trim() || !pw2.trim()}
            onClick={submit}
            className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
          >
            {locale === "zh" ? "保存并进入系统" : "Save and continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

