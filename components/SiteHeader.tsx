"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

function normalizePathname(pathname: string) {
  const withoutLocale = pathname.replace(/^\/(zh|en)(?=\/|$)/, "");
  const withLeadingSlash = withoutLocale.startsWith("/") ? withoutLocale : `/${withoutLocale}`;
  const normalized = withLeadingSlash === "//" ? "/" : withLeadingSlash;
  if (normalized === "") return "/";
  if (normalized === "/") return "/";
  return normalized.replace(/\/+$/, "");
}

function isNavActive(pathname: string, href: string) {
  const current = normalizePathname(pathname);
  const target = normalizePathname(href);
  if (target === "/") return current === "/";
  return current === target || current.startsWith(`${target}/`);
}

function LocaleSwitcher() {
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const cleanPathname = normalizePathname(pathname);

  const items = useMemo(
    () => [
      { locale: "zh" as const, label: tCommon("ui.locale.zh") },
      { locale: "en" as const, label: tCommon("ui.locale.en") }
    ],
    [tCommon]
  );

  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
      {items.map((item) => {
        const active = item.locale === locale;
        return (
          <Link
            key={item.locale}
            href={cleanPathname}
            locale={item.locale}
            className={[
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              active ? "bg-white/10 text-slate-50" : "text-slate-200/75 hover:text-slate-50"
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function SiteHeader() {
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { key: "home", href: "/" },
      { key: "framework", href: "/framework" },
      { key: "programs", href: "/programs" },
      { key: "insights", href: "/insights" },
      { key: "videos", href: "/videos" },
      { key: "courses", href: "/courses" },
      { key: "markets", href: "/markets" },
      { key: "news", href: "/news" },
      { key: "tools", href: "/tools" },
      { key: "system", href: "/system" },
      { key: "donate", href: "/donate" },
      { key: "about", href: "/about" },
      { key: "contact", href: "/contact" }
    ],
    []
  );

  const brand = locale === "zh" ? tCommon("brandCn") : tCommon("brandEn");
  const tagline = [
    tCommon("labels.mind"),
    tCommon("labels.market"),
    tCommon("labels.price")
  ].join(" · ");

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-3 whitespace-nowrap">
          <Image
            src="/brand/logo-mark.svg"
            width={36}
            height={36}
            priority
            alt={brand}
            className="h-9 w-9"
          />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-sm font-semibold tracking-[0.14em] text-slate-50 whitespace-nowrap">
              {brand}
            </span>
            <span className="hidden text-[11px] tracking-[0.18em] text-slate-200/60 xl:block whitespace-nowrap">
              {tagline}
            </span>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 text-sm xl:flex">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={[
                  "rounded-full px-3 py-2 whitespace-nowrap transition-colors",
                  active ? "bg-white/10 text-slate-50" : "text-slate-200/70 hover:bg-white/5 hover:text-slate-50"
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                {tNav(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-50 xl:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? tCommon("ui.close") : tCommon("ui.menu")}
          >
            {mobileOpen ? tCommon("ui.close") : tCommon("ui.menu")}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-slate-950/70 backdrop-blur xl:hidden">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4">
            <div className="flex justify-between">
              <span className="text-xs font-semibold tracking-[0.16em] text-slate-200/60">
                {tCommon("ui.nav")}
              </span>
              <LocaleSwitcher />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={[
                      "rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition-colors",
                      active ? "border-sky-400/30 bg-white/10 text-slate-50" : "text-slate-100/90 hover:bg-white/10"
                    ].join(" ")}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                  >
                    {tNav(item.key)}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
