"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage({ params }: { params: { locale: "zh" | "en" } }) {
  const locale = params.locale === "en" ? "en" : "zh";
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setDevCode(null);
    setLoading(true);
    try {
      const res = await fetch("/api/system/auth/request-reset-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: email })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(locale === "zh" ? "发送失败，请检查邮箱。" : "Failed to send.");
        return;
      }
      if (typeof json.dev_code === "string") setDevCode(json.dev_code);
      router.push(`/${locale}/system/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch {
      setError(locale === "zh" ? "网络错误，请稍后重试。" : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[520px] rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="text-white font-semibold text-xl">
        {locale === "zh" ? "找回密码" : "Forgot password"}
      </div>
      <div className="mt-2 text-white/60 text-sm leading-6">
        {locale === "zh"
          ? "输入邮箱，我们会发送验证码用于重置密码。"
          : "Enter your email to receive a reset code."}
      </div>

      <div className="mt-5">
        <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "邮箱" : "Email"}</div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
          placeholder="name@email.com"
        />
      </div>

      {devCode ? (
        <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {locale === "zh" ? "开发模式验证码：" : "Dev code:"} <b className="tracking-widest">{devCode}</b>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          disabled={loading || !email.trim()}
          onClick={submit}
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
        >
          {locale === "zh" ? "发送验证码" : "Send code"}
        </button>
        <a className="text-sm text-white/60 hover:text-white" href={`/${locale}/system/login`}>
          {locale === "zh" ? "返回登录" : "Back to login"}
        </a>
      </div>
    </div>
  );
}

