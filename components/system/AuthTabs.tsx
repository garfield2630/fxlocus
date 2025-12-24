"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  locale: "zh" | "en";
};

type LoginResponse =
  | { ok: true; user: { role: "admin" | "student"; must_change_password: boolean } }
  | { ok: false; error: string };

function safeNext(next: string | null) {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  return next;
}

export function AuthTabs({ locale }: Props) {
  const [tab, setTab] = React.useState<"password" | "code">("password");
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = safeNext(searchParams.get("next"));

  const labels = {
    password: locale === "zh" ? "账号密码登录" : "Password",
    code: locale === "zh" ? "验证码登录" : "Code",
    identifier: locale === "zh" ? "邮箱/手机号" : "Email / phone",
    passwordField: locale === "zh" ? "密码" : "Password",
    sendCode: locale === "zh" ? "发送验证码" : "Send code",
    verifyCode: locale === "zh" ? "登录" : "Sign in",
    codeField: locale === "zh" ? "验证码" : "Code",
    forgot: locale === "zh" ? "忘记密码？" : "Forgot password?",
    signingIn: locale === "zh" ? "登录中…" : "Signing in…"
  } as const;

  const resolveDestination = (resp: LoginResponse) => {
    if (!resp.ok) return `/${locale}/system/login`;
    if (resp.user.must_change_password) return `/${locale}/system/first-login`;
    if (nextParam) return nextParam;
    return resp.user.role === "admin" ? `/${locale}/system/admin` : `/${locale}/system/dashboard`;
  };

  const submitPassword = async () => {
    setError(null);
    setDevCode(null);
    setLoading(true);
    try {
      const res = await fetch("/api/system/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });
      const json = (await res.json().catch(() => null)) as LoginResponse | null;
      if (!res.ok || !json || !json.ok) {
        setError(locale === "zh" ? "登录失败，请检查账号或密码。" : "Sign in failed.");
        return;
      }
      router.replace(resolveDestination(json));
    } catch {
      setError(locale === "zh" ? "网络错误，请稍后重试。" : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const requestCode = async () => {
    setError(null);
    setDevCode(null);
    setLoading(true);
    try {
      const res = await fetch("/api/system/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier })
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok || !json?.ok) {
        setError(locale === "zh" ? "发送失败，请稍后重试。" : "Failed to send code.");
        return;
      }
      setSent(true);
      if (typeof json.dev_code === "string") setDevCode(json.dev_code);
    } catch {
      setError(locale === "zh" ? "网络错误，请稍后重试。" : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/system/auth/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, code })
      });
      const json = (await res.json().catch(() => null)) as LoginResponse | null;
      if (!res.ok || !json || !json.ok) {
        setError(locale === "zh" ? "验证码错误或已过期。" : "Invalid or expired code.");
        return;
      }
      router.replace(resolveDestination(json));
    } catch {
      setError(locale === "zh" ? "网络错误，请稍后重试。" : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const buttonBase =
    "px-3 py-1.5 rounded-xl border text-sm transition disabled:opacity-50";
  const tabBase = "px-3 py-1.5 rounded-xl border text-sm transition";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("password")}
          className={[
            tabBase,
            tab === "password"
              ? "bg-white/10 border-white/20 text-white"
              : "bg-white/0 border-white/10 text-white/70 hover:bg-white/5"
          ].join(" ")}
        >
          {labels.password}
        </button>
        <button
          type="button"
          onClick={() => setTab("code")}
          className={[
            tabBase,
            tab === "code"
              ? "bg-white/10 border-white/20 text-white"
              : "bg-white/0 border-white/10 text-white/70 hover:bg-white/5"
          ].join(" ")}
        >
          {labels.code}
        </button>
        <div className="ml-auto text-xs text-white/50">{labels.signingIn}</div>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="text-xs text-white/55 mb-2">{labels.identifier}</div>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "例如：name@email.com" : "e.g. name@email.com"}
          />
        </div>

        {tab === "password" ? (
          <div>
            <div className="text-xs text-white/55 mb-2">{labels.passwordField}</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
              placeholder="••••••••"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-white/55 mb-2">{labels.codeField}</div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
                placeholder={locale === "zh" ? "6 位数字" : "6-digit"}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                className={`${buttonBase} bg-white/5 border-white/10 text-white/85 hover:bg-white/10`}
                disabled={loading || !identifier.trim()}
                onClick={requestCode}
              >
                {labels.sendCode}
              </button>
              <div className="text-xs text-white/45">{sent ? (locale === "zh" ? "已发送" : "Sent") : null}</div>
            </div>
          </div>
        )}

        {devCode ? (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {locale === "zh" ? "开发模式验证码：" : "Dev code:"} <b className="tracking-widest">{devCode}</b>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-3 pt-2">
          {tab === "password" ? (
            <button
              type="button"
              disabled={loading || !identifier.trim() || !password.trim()}
              onClick={submitPassword}
              className={`${buttonBase} bg-white/10 border-white/20 text-white hover:bg-white/15`}
            >
              {locale === "zh" ? "登录" : "Sign in"}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || !identifier.trim() || !code.trim()}
              onClick={submitCode}
              className={`${buttonBase} bg-white/10 border-white/20 text-white hover:bg-white/15`}
            >
              {labels.verifyCode}
            </button>
          )}

          <a
            className="ml-auto text-xs text-white/60 hover:text-white"
            href={`/${locale}/system/forgot-password`}
          >
            {labels.forgot}
          </a>
        </div>
      </div>

      <div className="mt-6 text-xs text-white/50 leading-6">
        {locale === "zh"
          ? "提示：首次登录需要修改密码。系统仅用于训练与学习，不构成投资建议。"
          : "Tip: first login requires password change. Training use only."}
      </div>
    </div>
  );
}

