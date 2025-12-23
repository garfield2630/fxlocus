"use client";

import React from "react";

import { useMarket } from "../context/MarketContext";
import { AiTab } from "./tabs/AiTab";
import { DepthTab } from "./tabs/DepthTab";
import { NewsTab } from "./tabs/NewsTab";
import { StatsTab } from "./tabs/StatsTab";

const tabs = [
  { key: "depth", zh: "深度", en: "Depth" },
  { key: "stats", zh: "统计", en: "Stats" },
  { key: "ai", zh: "AI视角", en: "AI Lens" },
  { key: "news", zh: "新闻", en: "News" }
] as const;

export function MarketInfoDock() {
  const { locale } = useMarket();
  const [tab, setTab] = React.useState<(typeof tabs)[number]["key"]>("depth");

  const label = (item: (typeof tabs)[number]) => (locale === "zh" ? item.zh : item.en);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-[44px] items-center gap-2 border-b border-white/10 bg-white/5 px-3">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={[
              "rounded-xl border px-3 py-1.5 text-sm transition",
              tab === item.key
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/10 bg-white/0 text-white/70 hover:bg-white/5 hover:text-white"
            ].join(" ")}
          >
            {label(item)}
          </button>
        ))}

        <div className="ml-auto text-xs text-white/45">
          {locale === "zh" ? "训练用途｜不构成投资建议" : "Training use only"}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {tab === "depth" ? <DepthTab /> : null}
        {tab === "stats" ? <StatsTab /> : null}
        {tab === "ai" ? <AiTab /> : null}
        {tab === "news" ? <NewsTab /> : null}
      </div>
    </div>
  );
}
