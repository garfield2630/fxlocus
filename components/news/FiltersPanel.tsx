"use client";

import React from "react";

export type Filters = {
  category: "all" | "fx" | "stocks" | "commodities" | "crypto" | "macro";
  importance: "all" | "high" | "medium" | "low";
  range: "today" | "week" | "month";
  symbol: string;
  q: string;
};

export function FiltersPanel({
  locale,
  value,
  onChange
}: {
  locale: "zh" | "en";
  value: Filters;
  onChange: (value: Filters) => void;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });

  const categories = [
    ["all", locale === "zh" ? "全部" : "All"],
    ["fx", locale === "zh" ? "外汇" : "FX"],
    ["stocks", locale === "zh" ? "股票" : "Stocks"],
    ["commodities", locale === "zh" ? "商品" : "Commodities"],
    ["crypto", locale === "zh" ? "加密货币" : "Crypto"],
    ["macro", locale === "zh" ? "经济数据" : "Macro"]
  ] as const;

  const importance = [
    ["all", locale === "zh" ? "全部" : "All"],
    ["high", locale === "zh" ? "高" : "High"],
    ["medium", locale === "zh" ? "中" : "Medium"],
    ["low", locale === "zh" ? "低" : "Low"]
  ] as const;

  const ranges = [
    ["today", locale === "zh" ? "今日" : "Today"],
    ["week", locale === "zh" ? "本周" : "This week"],
    ["month", locale === "zh" ? "本月" : "This month"]
  ] as const;

  const btn = (active: boolean) =>
    active
      ? "bg-white/10 border-white/20 text-white"
      : "bg-white/0 border-white/10 text-white/70 hover:bg-white/5 hover:text-white";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-white/85 font-semibold">{locale === "zh" ? "筛选" : "Filters"}</div>

      <div className="mt-3">
        <div className="mb-2 text-xs text-white/50">{locale === "zh" ? "搜索" : "Search"}</div>
        <input
          value={value.q}
          onChange={(event) => set({ q: event.target.value })}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85"
          placeholder={locale === "zh" ? "关键词 / 标题" : "Keyword / title"}
        />
      </div>

      <div className="mt-3">
        <div className="mb-2 text-xs text-white/50">{locale === "zh" ? "关联品种" : "Symbol"}</div>
        <input
          value={value.symbol}
          onChange={(event) => set({ symbol: event.target.value.toUpperCase() })}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85"
          placeholder={locale === "zh" ? "例如：EURUSD / XAUUSD" : "e.g. EURUSD / XAUUSD"}
        />
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs text-white/50">{locale === "zh" ? "分类" : "Category"}</div>
        <div className="flex flex-wrap gap-2">
          {categories.map(([key, label]) => (
            <button
              key={key}
              onClick={() => set({ category: key })}
              className={`rounded-xl border px-3 py-1.5 text-sm ${btn(value.category === key)}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs text-white/50">
          {locale === "zh" ? "重要性" : "Importance"}
        </div>
        <div className="flex flex-wrap gap-2">
          {importance.map(([key, label]) => (
            <button
              key={key}
              onClick={() => set({ importance: key })}
              className={`rounded-xl border px-3 py-1.5 text-sm ${btn(value.importance === key)}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs text-white/50">{locale === "zh" ? "时间范围" : "Range"}</div>
        <div className="flex flex-wrap gap-2">
          {ranges.map(([key, label]) => (
            <button
              key={key}
              onClick={() => set({ range: key })}
              className={`rounded-xl border px-3 py-1.5 text-sm ${btn(value.range === key)}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 text-xs leading-6 text-white/45">
        {locale === "zh"
          ? "提示：列表实时更新。付费媒体默认仅标题/链接，避免侵权。"
          : "Realtime updates. Paid sources are metadata-only by default."}
      </div>
    </div>
  );
}
