"use client";

import { useTranslations } from "next-intl";

const categories = [
  "fx_direct",
  "fx_cross",
  "metals",
  "crypto",
  "indices",
  "commodities"
] as const;

export function InstrumentSidebar() {
  const t = useTranslations("markets");

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div>
        <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
          {t("workspace.search.label")}
        </div>
        <input
          type="text"
          placeholder={t("workspace.search.placeholder")}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-200/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/30"
        />
      </div>

      <div>
        <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
          {t("workspace.categories.title")}
        </div>
        <div className="mt-2 grid gap-2">
          {categories.map((key) => (
            <button
              key={key}
              type="button"
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-semibold text-slate-100/85 hover:bg-white/10"
            >
              {t(`workspace.categories.${key}`)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
          {t("workspace.watchlist.title")}
        </div>
        <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200/60">
          {t("workspace.watchlist.hint")}
        </div>
      </div>

      <div className="flex-1">
        <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
          {t("workspace.list.title")}
        </div>
        <div className="mt-2 space-y-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={`instrument-${index}`}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-200/70"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-200/50">
                <span>--</span>
                <span>--</span>
              </div>
              <div className="mt-2 h-2 w-24 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
