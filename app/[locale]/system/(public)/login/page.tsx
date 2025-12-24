"use client";

import React from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LoginResponse =
  | { ok: true; user: { id: string; full_name: string; role: "admin" | "student" } }
  | { ok: false; error: string };

export default function SystemLoginPage({ params }: { params: { locale: "zh" | "en" } }) {
  const locale = params.locale === "en" ? "en" : "zh";
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/system/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });
      const json = (await res.json().catch(() => null)) as LoginResponse | null;
      if (!res.ok || !json?.ok) {
        setError(locale === "zh" ? "登录失败" : "Sign in failed.");
        return;
      }

      const next =
        json.user.role === "admin"
          ? `/${locale}/system/admin`
          : `/${locale}/system/dashboard`;
      window.location.href = next;
    } catch (e: any) {
      setError(e?.message || (locale === "zh" ? "网络错误" : "Network error."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[420px]">
      <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
          placeholder={locale === "zh" ? "账号" : "Account"}
          autoComplete="username"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
          placeholder={locale === "zh" ? "密码" : "Password"}
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          disabled={loading || !identifier.trim() || !password.trim()}
          className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
        >
          {locale === "zh" ? "登录" : "Sign in"}
        </button>
        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </form>
    </div>
  );
}

