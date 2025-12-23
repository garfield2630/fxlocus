"use client";

import React from "react";

import { Instrument, useMarket } from "./context/MarketContext";

const categories: { key: Instrument["category"]; zh: string; en: string }[] = [
  { key: "all", zh: "全部", en: "All" },
  { key: "fx_direct", zh: "直盘", en: "Majors (USD)" },
  { key: "fx_cross", zh: "交叉盘", en: "Crosses" },
  { key: "metals", zh: "贵金属", en: "Metals" },
  { key: "crypto", zh: "数字货币", en: "Crypto" },
  { key: "indices", zh: "指数", en: "Indices" },
  { key: "commodities", zh: "大宗商品", en: "Commodities" }
];

function label(locale: "zh" | "en", zh: string, en: string) {
  return locale === "zh" ? zh : en;
}

type Props = {
  onCollapse?: () => void;
  collapseLabel?: string;
  collapseHint?: string;
};

export function InstrumentSidebar({ onCollapse, collapseLabel, collapseHint }: Props) {
  const { locale, instrument, setInstrument } = useMarket();
  const collapseText = collapseLabel ?? (locale === "zh" ? "收起" : "Collapse");
  const collapseTitle =
    collapseHint ?? (locale === "zh" ? "收起品种栏" : "Collapse instruments");

  const [category, setCategory] = React.useState<Instrument["category"]>("all");
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<Instrument[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const [searchItems, setSearchItems] = React.useState<Instrument[]>([]);
  const [searching, setSearching] = React.useState(false);

  const loadPage = React.useCallback(
    async (nextPage: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/markets/universe?category=${category}&page=${nextPage}&pageSize=80`,
          { cache: "no-store" }
        );
        const json = await res.json();
        const nextItems = (json.items || []) as Instrument[];
        setItems((prev) => (nextPage === 1 ? nextItems : [...prev, ...nextItems]));
        const total = Number(json.total || 0);
        const pageSize = Number(json.pageSize || 80);
        setHasMore(nextPage * pageSize < total);
        setPage(nextPage);
      } finally {
        setLoading(false);
      }
    },
    [category]
  );

  React.useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    loadPage(1);
  }, [category, loadPage]);

  const listRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (!hasMore || loading) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
        loadPage(page + 1);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasMore, loading, loadPage, page]);

  React.useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    const run = async () => {
      const q = query.trim();
      if (q.length < 2) {
        setSearchItems([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(
          `/api/markets/tv-search?q=${encodeURIComponent(q)}&lang=${locale}`,
          {
            signal: ctrl.signal,
            cache: "no-store"
          }
        );
        const json = await res.json();
        if (!alive) return;
        setSearchItems((json.items || []) as Instrument[]);
      } catch {
        // ignore
      } finally {
        if (alive) setSearching(false);
      }
    };

    const timer = window.setTimeout(run, 250);
    return () => {
      alive = false;
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [query, locale]);

  const showing = query.trim().length >= 2 ? searchItems : items;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-white/85 font-semibold">
            {locale === "zh" ? "品种" : "Instruments"}
          </div>
          {onCollapse ? (
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/75 hover:bg-white/10"
              onClick={onCollapse}
              title={collapseTitle}
            >
              {collapseText}
            </button>
          ) : null}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            locale === "zh" ? "搜索：代码/名称（可全量）" : "Search symbol/name (global)"
          }
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={[
                "rounded-xl border px-3 py-1.5 text-sm transition",
                category === cat.key
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/0 text-white/70 hover:bg-white/5"
              ].join(" ")}
            >
              {label(locale, cat.zh, cat.en)}
            </button>
          ))}
        </div>

        <div className="mt-2 text-xs text-white/45">
          {query.trim().length >= 2
            ? searching
              ? locale === "zh"
                ? "搜索中..."
                : "Searching..."
              : locale === "zh"
                ? "搜索结果来自 TradingView（全标的）"
                : "Results from TradingView (global)"
            : locale === "zh"
              ? "分类列表支持无限滚动加载"
              : "Category list supports infinite loading"}
        </div>
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto p-2">
        {showing.map((item) => (
          <button
            key={item.id}
            onClick={() => setInstrument(item)}
            className={[
              "mb-2 w-full rounded-xl border px-3 py-2 text-left transition",
              instrument.tvSymbol === item.tvSymbol
                ? "border-white/20 bg-white/10"
                : "border-white/10 bg-white/0 hover:bg-white/5"
            ].join(" ")}
          >
            <div className="text-sm font-semibold text-white/90">{item.symbolCode}</div>
            <div className="mt-0.5 text-xs text-white/55">
              {locale === "zh" ? item.nameZh || item.nameEn || "" : item.nameEn || item.nameZh || ""}
            </div>
            <div className="mt-1 text-[11px] text-white/35">{item.tvSymbol}</div>
          </button>
        ))}

        {!showing.length ? (
          <div className="p-3 text-sm text-white/60">
            {locale === "zh" ? "暂无数据（尝试搜索或切换分类）" : "No items. Try search or change category."}
          </div>
        ) : null}

        {query.trim().length < 2 && loading ? (
          <div className="p-3 text-sm text-white/45">
            {locale === "zh" ? "加载中..." : "Loading..."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
