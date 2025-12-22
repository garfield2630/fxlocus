"use client";

import { useTranslations } from "next-intl";

export function PaperTradeSidebar() {
  const t = useTranslations("markets");

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div>
        <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
          {t("workspace.paper.title")}
        </div>
        <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-3 text-sm text-slate-200/70">
          <div className="flex items-center justify-between text-xs text-slate-200/60">
            <span>{t("workspace.paper.balance")}</span>
            <span>$10,000</span>
          </div>
          <div className="mt-3 grid gap-2">
            <input
              type="text"
              placeholder={t("workspace.paper.qty")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-200/40 focus-visible:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20"
              >
                {t("workspace.paper.side.buy")}
              </button>
              <button
                type="button"
                className="rounded-xl border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-500/20"
              >
                {t("workspace.paper.side.sell")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200/60">
        {t("workspace.paper.risk")}
      </div>
    </div>
  );
}
