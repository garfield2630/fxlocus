"use client";

import { ReactNode, useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { stripLocale } from "@/lib/i18n/withLocale";
import { useLocalizedRouter } from "@/components/i18n/useLocalizedRouter";

type Props = {
  role: "admin" | "member";
  children: ReactNode;
};

function isActive(cleanPath: string, href: string) {
  if (href === "/trade-system/app/dashboard") {
    return cleanPath === "/trade-system/app" || cleanPath === "/trade-system/app/dashboard";
  }
  return cleanPath === href || cleanPath.startsWith(`${href}/`);
}

export function SystemShell({ role, children }: Props) {
  const t = useTranslations("system");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const cleanPath = stripLocale(pathname);
  const router = useLocalizedRouter();

  const [logoutBusy, setLogoutBusy] = useState(false);

  const navItems = useMemo(
    () => [
      { key: "dashboard" as const, href: "/trade-system/app/dashboard" },
      { key: "journal" as const, href: "/trade-system/app/journal" },
      { key: "review" as const, href: "/trade-system/app/review" },
      { key: "analytics" as const, href: "/trade-system/app/analytics" }
    ],
    []
  );

  const localeItems = useMemo(
    () => [
      { locale: "zh" as const, label: tCommon("ui.locale.zh") },
      { locale: "en" as const, label: tCommon("ui.locale.en") }
    ],
    [tCommon]
  );

  const onLogout = useCallback(async () => {
    setLogoutBusy(true);
    try {
      await fetch("/api/mock-auth/logout", { method: "POST" });
    } finally {
      router.replace("/trade-system/login");
    }
  }, [router]);

  return (
    <div className="fx-surface overflow-hidden">
      <div className="grid min-h-[calc(100vh-14rem)] md:grid-cols-[260px_1fr]">
        <aside className="border-b border-white/10 bg-slate-950/35 p-5 md:border-b-0 md:border-r">
          <div className="text-xs font-semibold tracking-[0.18em] text-slate-200/60">
            {t("app.title")}
          </div>
          <div className="mt-2 text-sm font-semibold tracking-[0.14em] text-slate-50">
            {tCommon(locale === "en" ? "brandEn" : "brandCn")}
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const active = isActive(cleanPath, item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={[
                    "block rounded-2xl px-3 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-white/10 text-slate-50"
                      : "text-slate-200/70 hover:bg-white/5 hover:text-slate-50"
                  ].join(" ")}
                >
                  {t(`app.nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/25 px-6 py-4">
            <div className="flex items-center gap-3 text-sm text-slate-200/75">
              <span className="text-xs font-semibold tracking-[0.16em] text-slate-200/60">
                {t("app.topbar.role")}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-50">
                {t(`app.roles.${role}`)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
                {localeItems.map((item) => {
                  const active = item.locale === locale;
                  return (
                    <Link
                      key={item.locale}
                      href={cleanPath}
                      locale={item.locale}
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                        active ? "bg-white/10 text-slate-50" : "text-slate-200/70 hover:text-slate-50"
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onLogout}
                disabled={logoutBusy}
                className="fx-btn fx-btn-secondary h-9 px-4 py-2 text-xs"
              >
                {logoutBusy ? tCommon("ui.submitting") : t("app.topbar.logout")}
              </button>
            </div>
          </div>

          <div className="min-w-0 flex-1 px-6 py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

