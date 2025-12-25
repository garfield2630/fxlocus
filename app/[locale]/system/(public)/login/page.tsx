"use client";

import React from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

type LoginResponse =
  | { ok: true; user: { id: string; full_name: string; role: "admin" | "student" } }
  | { ok: false; error: string };

export default function SystemLoginPage({ params }: { params: { locale: "zh" | "en" } }) {
  const locale = params.locale === "en" ? "en" : "zh";
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
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
    <div className="h-screen w-screen overflow-hidden">
      <div className="relative h-full w-full flex items-center justify-center px-4">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -top-24 left-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        </div>

        <form
          onSubmit={submit}
          className="relative w-full max-w-[420px] rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="text-white/90 text-lg font-semibold">
            {locale === "zh" ? "系统登录" : "System Login"}
          </div>
          <div className="mt-1 text-white/50 text-sm">
            {locale === "zh" ? "请输入账号与密码" : "Enter your credentials"}
          </div>

          <div className="mt-6 space-y-3">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-10 py-3 text-white/85 text-sm focus:outline-none focus:border-white/30"
                placeholder={locale === "zh" ? "邮箱或手机号" : "Email or phone"}
                autoComplete="username"
                required
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-10 py-3 text-white/85 text-sm focus:outline-none focus:border-white/30"
                placeholder={locale === "zh" ? "请输入密码" : "Password"}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                aria-label={showPassword ? "hide password" : "show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !identifier.trim() || !password.trim()}
            className="mt-6 w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
          >
            {loading ? (locale === "zh" ? "登录中…" : "Signing in…") : locale === "zh" ? "登录" : "Sign in"}
          </button>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}

