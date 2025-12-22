"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type InfoTab = "depth" | "stats" | "ai" | "news";

export function MarketCenterPanel() {
  const t = useTranslations("markets");
  const newsPlaceholders = t.raw("workspace.news.placeholder") as string[];
  const [activeTab, setActiveTab] = useState<InfoTab>("depth");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-[7] min-h-0 p-4">
        <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 text-sm text-slate-200/70">
          {t("workspace.chart.doubleClick")}
        </div>
      </div>

      <div className="flex-[3] min-h-0 border-t border-white/10">
        <div className="flex flex-wrap gap-2 px-3 py-2 text-xs font-semibold text-slate-200/70">
          {(["depth", "stats", "ai", "news"] as InfoTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "rounded-full px-3 py-1 transition",
                activeTab === tab
                  ? "bg-white/10 text-slate-50"
                  : "text-slate-200/70 hover:text-slate-50"
              ].join(" ")}
            >
              {t(`workspace.tabs.${tab}`)}
            </button>
          ))}
        </div>
        <div className="h-[calc(100%-40px)] overflow-y-auto p-3 text-sm text-slate-200/70">
          {activeTab === "depth" ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              {t("workspace.depth.title")}
            </div>
          ) : null}
          {activeTab === "stats" ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              {t("workspace.stats.placeholder")}
            </div>
          ) : null}
          {activeTab === "ai" ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              {t("workspace.ai.title")}
            </div>
          ) : null}
          {activeTab === "news" ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              {Array.isArray(newsPlaceholders) && newsPlaceholders.length > 0
                ? newsPlaceholders[0]
                : t("workspace.news.title")}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
