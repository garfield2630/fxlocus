"use client";

import React from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { SliderCaptcha } from "@/components/system/SliderCaptcha";
import { isAdminRole } from "@/lib/system/roles";

type LoginResponse =
  | { ok: true; user: { id: string; full_name: string | null; role: "student" | "leader" | "super_admin" } }
  | { ok: false; error: string };

export default function SystemLoginPage({ params }: { params: { locale: "zh" | "en" } }) {
  const locale = params.locale === "en" ? "en" : "zh";
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loginRole, setLoginRole] = React.useState<"" | "student" | "leader" | "super_admin">("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [captchaOk, setCaptchaOk] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canStartCaptcha = Boolean(loginRole && identifier.trim() && password.trim());
  const captchaResetSignal = `${loginRole}|${identifier.trim()}|${password.trim()}`;

  React.useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlHeight = html.style.height;
    const prevBodyHeight = body.style.height;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.height = "100%";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.height = prevHtmlHeight;
      body.style.height = prevBodyHeight;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginRole) {
      setError(locale === "zh" ? "请选择账号类型" : "Select account type.");
      return;
    }
    if (!captchaOk) {
      setError(locale === "zh" ? "请先完成图形拖动验证" : "Complete the drag verification first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/system/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, password, role: loginRole })
      });
      const json = (await res.json().catch(() => null)) as LoginResponse | null;
      if (!res.ok || !json?.ok) {
        const code = String((json as any)?.error || "");
        if (code === "ROLE_MISMATCH") {
          setError(locale === "zh" ? "账号类型不匹配" : "Account type mismatch.");
        } else if (code === "INVALID_EMAIL") {
          setError(locale === "zh" ? "邮箱格式不正确" : "Invalid email format.");
        } else if (code === "INVALID_CREDENTIALS") {
          setError(locale === "zh" ? "邮箱或密码错误" : "Invalid credentials.");
        } else {
          setError(locale === "zh" ? "登录失败，请稍后重试" : "Sign in failed.");
        }
        return;
      }

      const next = isAdminRole(json.user.role)
        ? `/${locale}/system/admin`
        : `/${locale}/system/dashboard`;
      window.location.href = next;
    } catch (e: any) {
      setError(e?.message || (locale === "zh" ? "网络异常，请稍后重试" : "Network error."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="relative h-full w-full">
        <div className="absolute inset-0 opacity-85">
          <div className="login-stars absolute inset-0" />
          <div className="login-particles absolute left-1/2 top-1/2" />
          <div className="login-particles login-particles-b absolute left-1/2 top-1/2" />
          <div className="login-glow login-glow-a absolute left-1/2 top-1/2 h-[560px] w-[560px] rounded-full bg-sky-500/20 blur-[130px]" />
          <div className="login-glow login-glow-b absolute left-1/2 top-1/2 h-[380px] w-[380px] rounded-full bg-indigo-500/18 blur-[100px]" />
          <div className="login-ring absolute left-1/2 top-1/2 h-[700px] w-[700px] rounded-full border border-white/10" />
          <div className="login-ripple login-ripple-a absolute left-1/2 top-1/2 h-[520px] w-[520px] rounded-full" />
          <div className="login-ripple login-ripple-b absolute left-1/2 top-1/2 h-[720px] w-[720px] rounded-full" />
          <div className="login-ripple login-ripple-c absolute left-1/2 top-1/2 h-[880px] w-[880px] rounded-full" />
          <div className="login-sweep absolute left-1/2 top-1/2 h-[760px] w-[760px] rounded-full" />
          <div className="login-orbit absolute left-1/2 top-1/2 h-[640px] w-[640px] rounded-full" />
          <div className="login-orbit login-orbit-slow absolute left-1/2 top-1/2 h-[820px] w-[820px] rounded-full" />
        </div>

        <div className="relative h-full w-full flex items-center justify-center px-4">
          <form
            onSubmit={submit}
            autoComplete="off"
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
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value as any)}
                  className="w-full rounded-2xl bg-[#050a14] border border-white/10 px-4 py-3 text-white/85 text-sm focus:outline-none focus:border-white/30"
                  required
                >
                  <option value="" disabled>
                    {locale === "zh" ? "请选择账号类型（学员 / 团队长 / 超管）" : "Select account type"}
                  </option>
                  <option value="student">{locale === "zh" ? "学员" : "Student"}</option>
                  <option value="leader">{locale === "zh" ? "团队长" : "Leader"}</option>
                  <option value="super_admin">{locale === "zh" ? "超管" : "Super Admin"}</option>
                </select>
                <div className="mt-2 text-xs text-white/45">
                  {locale === "zh"
                    ? "账号类型必须与实际权限一致，否则会提示“账号类型不匹配”。"
                    : "Account type must match your profile role."}
                </div>
              </div>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  name="system-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-10 py-3 text-white/85 text-sm focus:outline-none focus:border-white/30"
                  placeholder={locale === "zh" ? "邮箱" : "Email"}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  name="system-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-10 py-3 text-white/85 text-sm focus:outline-none focus:border-white/30"
                  placeholder={locale === "zh" ? "请输入密码" : "Password"}
                  autoComplete="new-password"
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
              <SliderCaptcha
                locale={locale}
                disabled={!canStartCaptcha || loading}
                resetSignal={captchaResetSignal}
                onChange={setCaptchaOk}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !loginRole || !identifier.trim() || !password.trim() || !captchaOk}
              className="mt-6 w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
            >
              {loading ? (locale === "zh" ? "登录中..." : "Signing in...") : locale === "zh" ? "登录" : "Sign in"}
            </button>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </form>
        </div>
      </div>
      <style jsx>{`
        .login-stars {
          background-image: radial-gradient(circle at 20% 30%, rgba(125, 211, 252, 0.7), transparent 58%),
            radial-gradient(circle at 80% 40%, rgba(99, 102, 241, 0.6), transparent 58%),
            radial-gradient(circle at 60% 80%, rgba(56, 189, 248, 0.55), transparent 60%),
            radial-gradient(circle at 10% 80%, rgba(59, 130, 246, 0.5), transparent 58%),
            radial-gradient(circle at 90% 15%, rgba(59, 130, 246, 0.45), transparent 58%),
            radial-gradient(circle at 35% 55%, rgba(56, 189, 248, 0.45), transparent 60%),
            radial-gradient(circle at 70% 20%, rgba(99, 102, 241, 0.5), transparent 60%),
            radial-gradient(circle at 15% 20%, rgba(125, 211, 252, 0.45), transparent 60%);
          background-size: 1100px 1100px, 1200px 1200px, 1300px 1300px, 1500px 1500px, 1700px 1700px,
            1400px 1400px, 1200px 1200px, 1000px 1000px;
          background-position: 0 0, 200px 120px, -240px 200px, 160px -200px, -120px -80px, 180px 260px,
            -320px -120px, 260px -160px;
          opacity: 0.75;
          animation: loginStars 220s linear infinite, loginTwinkle 2.4s ease-in-out infinite;
          animation-delay: -80s, -1.2s;
        }
        .login-particles {
          width: 2px;
          height: 2px;
          border-radius: 9999px;
          background: rgba(148, 163, 184, 0.9);
          box-shadow:
            -420px -260px rgba(125, 211, 252, 0.85),
            -340px -40px rgba(99, 102, 241, 0.9),
            -200px -200px rgba(56, 189, 248, 0.8),
            -60px 160px rgba(59, 130, 246, 0.75),
            40px -140px rgba(125, 211, 252, 0.85),
            140px 20px rgba(99, 102, 241, 0.85),
            220px -220px rgba(56, 189, 248, 0.8),
            260px 160px rgba(59, 130, 246, 0.75),
            340px -60px rgba(125, 211, 252, 0.9),
            420px 140px rgba(99, 102, 241, 0.9),
            -520px 140px rgba(56, 189, 248, 0.75),
            -360px 300px rgba(59, 130, 246, 0.7),
            -80px 280px rgba(125, 211, 252, 0.7),
            60px 240px rgba(99, 102, 241, 0.7),
            180px 300px rgba(56, 189, 248, 0.7),
            420px -220px rgba(59, 130, 246, 0.8),
            540px 20px rgba(125, 211, 252, 0.75),
            -560px -60px rgba(99, 102, 241, 0.75),
            520px -120px rgba(56, 189, 248, 0.7),
            -260px 80px rgba(125, 211, 252, 0.7),
            -620px -220px rgba(56, 189, 248, 0.8),
            -460px 220px rgba(125, 211, 252, 0.75),
            -120px -320px rgba(99, 102, 241, 0.75),
            120px -320px rgba(56, 189, 248, 0.75),
            320px -320px rgba(125, 211, 252, 0.7),
            480px 260px rgba(99, 102, 241, 0.75),
            620px 200px rgba(56, 189, 248, 0.8),
            640px -40px rgba(125, 211, 252, 0.8);
          transform: translate(-50%, -50%);
          animation: loginDrift 48s ease-in-out infinite alternate, loginTwinkle 1.7s ease-in-out infinite;
          animation-delay: -12s, -0.6s;
          opacity: 0.95;
        }
        .login-particles-b {
          width: 3px;
          height: 3px;
          border-radius: 9999px;
          background: rgba(56, 189, 248, 0.9);
          box-shadow:
            -700px -180px rgba(125, 211, 252, 0.75),
            -520px -320px rgba(99, 102, 241, 0.8),
            -320px -120px rgba(56, 189, 248, 0.7),
            -180px 260px rgba(59, 130, 246, 0.75),
            -20px -360px rgba(125, 211, 252, 0.75),
            160px -260px rgba(99, 102, 241, 0.75),
            320px -120px rgba(56, 189, 248, 0.7),
            420px 240px rgba(59, 130, 246, 0.75),
            620px -260px rgba(125, 211, 252, 0.8),
            720px 120px rgba(99, 102, 241, 0.8),
            -620px 200px rgba(56, 189, 248, 0.7),
            -420px 360px rgba(59, 130, 246, 0.7),
            -140px 420px rgba(125, 211, 252, 0.7),
            120px 420px rgba(99, 102, 241, 0.7),
            360px 360px rgba(56, 189, 248, 0.75),
            520px 320px rgba(59, 130, 246, 0.8);
          transform: translate(-50%, -50%);
          opacity: 0.75;
          animation: loginDrift 72s ease-in-out infinite alternate-reverse, loginTwinkle 1.3s ease-in-out infinite;
          animation-delay: -28s, -0.3s;
        }
        .login-glow {
          transform: translate(-50%, -50%);
          animation: loginFloat 22s ease-in-out infinite;
        }
        .login-glow-b {
          animation-duration: 30s;
          animation-direction: reverse;
        }
        .login-ring {
          transform: translate(-50%, -50%) rotate(0deg);
          border: 1px solid rgba(125, 211, 252, 0.2);
          box-shadow: 0 0 120px rgba(59, 130, 246, 0.35);
          opacity: 0.7;
          animation: loginSpin 80s linear infinite;
        }
        .login-ripple {
          transform: translate(-50%, -50%) scale(0.6);
          border: 1px solid rgba(125, 211, 252, 0.25);
          box-shadow: 0 0 50px rgba(59, 130, 246, 0.25);
          opacity: 0;
          mix-blend-mode: screen;
          animation: loginRipple 6.4s ease-out infinite;
        }
        .login-ripple-b {
          animation-delay: -2s;
          animation-duration: 4.8s;
          border-color: rgba(99, 102, 241, 0.22);
        }
        .login-ripple-c {
          animation-delay: -3.4s;
          animation-duration: 7.2s;
          border-color: rgba(56, 189, 248, 0.24);
        }
        .login-sweep {
          transform: translate(-50%, -50%);
          background: conic-gradient(
            from 0deg,
            rgba(59, 130, 246, 0) 0deg,
            rgba(59, 130, 246, 0.6) 60deg,
            rgba(59, 130, 246, 0) 120deg,
            rgba(99, 102, 241, 0.4) 200deg,
            rgba(59, 130, 246, 0) 320deg
          );
          -webkit-mask: radial-gradient(circle, transparent 60%, #000 61%, #000 66%, transparent 67%);
          mask: radial-gradient(circle, transparent 60%, #000 61%, #000 66%, transparent 67%);
          animation: loginSpin 24s linear infinite;
          opacity: 0.95;
        }
        .login-orbit {
          transform: translate(-50%, -50%) rotate(0deg);
          border: 1px dashed rgba(255, 255, 255, 0.08);
          animation: loginSpin 22s linear infinite;
        }
        .login-orbit::before,
        .login-orbit::after {
          content: "";
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: rgba(125, 211, 252, 0.95);
          box-shadow: 0 0 22px rgba(125, 211, 252, 0.95);
        }
        .login-orbit::before {
          left: 50%;
          top: -4px;
          transform: translateX(-50%);
        }
        .login-orbit::after {
          right: -4px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(99, 102, 241, 0.95);
          box-shadow: 0 0 22px rgba(99, 102, 241, 0.9);
        }
        .login-orbit-slow {
          animation-duration: 36s;
          border-color: rgba(255, 255, 255, 0.05);
        }
        .login-orbit-slow::before,
        .login-orbit-slow::after {
          width: 6px;
          height: 6px;
          background: rgba(56, 189, 248, 0.9);
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.85);
        }
        @keyframes loginStars {
          0% {
            background-position: 0 0, 200px 120px, -240px 200px, 160px -200px, -120px -80px, 180px 260px,
              -320px -120px, 260px -160px;
          }
          100% {
            background-position: -2200px 800px, -1500px -800px, 800px -800px, -800px 1100px, 1200px 800px,
              -1100px 1300px, 1100px -900px, -900px 700px;
          }
        }
        @keyframes loginTwinkle {
          0%,
          100% {
            opacity: 0.95;
          }
          50% {
            opacity: 0.45;
          }
        }
        @keyframes loginDrift {
          0% {
            transform: translate(-50%, -50%) translate3d(-30px, 10px, 0);
          }
          50% {
            transform: translate(-50%, -50%) translate3d(40px, -50px, 0);
          }
          100% {
            transform: translate(-50%, -50%) translate3d(-20px, 40px, 0);
          }
        }
        @keyframes loginRipple {
          0% {
            transform: translate(-50%, -50%) scale(0.45);
            opacity: 0.35;
          }
          70% {
            opacity: 0.2;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.45);
            opacity: 0;
          }
        }
        @keyframes loginFloat {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -52%) scale(1.08);
          }
        }
        @keyframes loginSpin {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
