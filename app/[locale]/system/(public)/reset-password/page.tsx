"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage({ params }: { params: { locale: "zh" | "en" } }) {
  const locale = params.locale === "en" ? "en" : "zh";
  const router = useRouter();
  const sp = useSearchParams();
  const initialEmail = sp.get("email") || "";

  const [email, setEmail] = React.useState(initialEmail);
  const [code, setCode] = React.useState("");
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
      const res = await fetch("/api/system/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: email, code, newPassword: pw1 })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(locale === "zh" ? "重置失败，请检查验证码。" : "Reset failed.");
        return;
      }
      router.replace(`/${locale}/system/login`);
    } catch {
      setError(locale === "zh" ? "网络错误，请稍后重试。" : "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[520px] rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="text-white font-semibold text-xl">{locale === "zh" ? "重置密码" : "Reset password"}</div>
      <div className="mt-2 text-white/60 text-sm leading-6">
        {locale === "zh"
          ? "输入邮箱、验证码与新密码完成重置。"
          : "Enter email, code and new password."}
      </div>

      <div className="mt-5 grid gap-3">
        <div>
          <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "邮箱" : "Email"}</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
          />
        </div>

        <div>
          <div className="text-xs text-white/55 mb-2">{locale === "zh" ? "验证码" : "Code"}</div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white/85 text-sm"
            placeholder={locale === "zh" ? "6 位数字" : "6-digit"}
          />
        </div>

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

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          disabled={loading || !email.trim() || !code.trim() || !pw1.trim() || !pw2.trim()}
          onClick={submit}
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
        >
          {locale === "zh" ? "提交" : "Submit"}
        </button>
        <a className="text-sm text-white/60 hover:text-white" href={`/${locale}/system/login`}>
          {locale === "zh" ? "返回登录" : "Back to login"}
        </a>
      </div>
    </div>
  );
}

