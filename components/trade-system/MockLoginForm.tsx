"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { useLocalizedRouter } from "@/components/i18n/useLocalizedRouter";

type Props = {
  next?: string;
  variant?: "card" | "plain";
  showDemo?: boolean;
  onRegister?: () => void;
  className?: string;
};

export function MockLoginForm({
  next,
  variant = "card",
  showDemo = true,
  onRegister,
  className
}: Props) {
  const t = useTranslations("system");
  const router = useLocalizedRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  const destination = useMemo(() => next || "/trade-system/app/dashboard", [next]);

  const submitLogin = async (nextUsername: string, nextPassword: string) => {
    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/mock-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: nextUsername, password: nextPassword })
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as any;
        if (data?.error === "invalid_credentials") {
          throw new Error(t("mockAuth.errorInvalid"));
        }
        throw new Error(t("mockAuth.errorGeneric"));
      }

      router.replace(destination);
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || t("mockAuth.errorGeneric"));
    } finally {
      setStatus((prev) => (prev === "submitting" ? "idle" : prev));
    }
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await submitLogin(username, password);
  }

  const fillMember = () => {
    setUsername("member");
    setPassword("fxlocus-member");
    setError("");
  };

  const fillAdmin = () => {
    setUsername("admin");
    setPassword("fxlocus-admin");
    setError("");
  };

  const wrapperClassName = [
    variant === "card" ? "fx-card p-8" : "space-y-6",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form onSubmit={onSubmit} className={wrapperClassName}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
            {t("mockAuth.username")}
          </span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-200/40"
            autoComplete="username"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
            {t("mockAuth.password")}
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-200/40"
            autoComplete="current-password"
            required
          />
        </label>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="fx-btn fx-btn-primary" disabled={status === "submitting"}>
          {status === "submitting" ? t("mockAuth.submitting") : t("mockAuth.submit")}
        </button>
        {onRegister ? (
          <button
            type="button"
            className="fx-btn fx-btn-secondary"
            onClick={onRegister}
            disabled={status === "submitting"}
          >
            {t("auth.signUp")}
          </button>
        ) : null}

        {status === "error" ? (
          <p className="text-sm font-semibold text-rose-300">{error}</p>
        ) : null}
      </div>

      {showDemo ? (
        <div className="mt-8 space-y-2 text-sm text-slate-200/70">
          <div className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
            {t("mockAuth.demo.title")}
          </div>
          <p className="text-xs text-slate-200/60">{t("mockAuth.demo.note")}</p>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="fx-glass p-4">
              <div className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
                {t("mockAuth.demo.adminLabel")}
              </div>
              <div className="mt-2 text-sm text-slate-100/85">{t("mockAuth.demo.admin")}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-50 hover:bg-white/10"
                  onClick={fillAdmin}
                  disabled={status === "submitting"}
                >
                  {t("mockAuth.demo.actions.fillAdmin")}
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-cyan-400/20 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
                  onClick={() => submitLogin("admin", "fxlocus-admin")}
                  disabled={status === "submitting"}
                >
                  {t("mockAuth.demo.actions.loginAdmin")}
                </button>
              </div>
            </div>
            <div className="fx-glass p-4">
              <div className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
                {t("mockAuth.demo.memberLabel")}
              </div>
              <div className="mt-2 text-sm text-slate-100/85">{t("mockAuth.demo.member")}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-50 hover:bg-white/10"
                  onClick={fillMember}
                  disabled={status === "submitting"}
                >
                  {t("mockAuth.demo.actions.fillMember")}
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-cyan-400/20 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
                  onClick={() => submitLogin("member", "fxlocus-member")}
                  disabled={status === "submitting"}
                >
                  {t("mockAuth.demo.actions.loginMember")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
