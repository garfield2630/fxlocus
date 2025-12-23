"use client";

import React from "react";

import { useDebounce } from "@/lib/hooks/useDebounce";
import { computeHeat } from "@/lib/news/heat";

import type { Filters } from "./FiltersPanel";
import { NewsCard } from "./NewsCard";

export function NewsFeed({ locale, filters }: { locale: "zh" | "en"; filters: Filters }) {
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const q = useDebounce(filters.q, 350);
  const symbol = useDebounce(filters.symbol, 350);

  const controllerRef = React.useRef<AbortController | null>(null);

  const buildQuery = React.useCallback(
    (p: number) => {
      const params = new URLSearchParams();
      params.set("locale", locale);
      params.set("page", String(p));
      params.set("pageSize", "20");
      params.set("category", filters.category);
      params.set("importance", filters.importance);
      params.set("range", filters.range);
      if (symbol.trim()) params.set("symbol", symbol.trim().toUpperCase());
      if (q.trim()) params.set("q", q.trim());
      return params.toString();
    },
    [locale, filters.category, filters.importance, filters.range, q, symbol]
  );

  const load = React.useCallback(
    async (p: number, reset = false) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const query = buildQuery(p);
        const res = await fetch(`/api/news/list?${query}`, {
          cache: "no-store",
          signal: controller.signal
        });
        const json = await res.json();

        if (!json?.ok) {
          setError(json?.error || "load_failed");
          setItems((prev) => (reset ? [] : prev));
          setHasMore(false);
          return;
        }

        const next = Array.isArray(json.items) ? json.items : [];
        const withHeat = next.map((item: any) => ({
          ...item,
          heat: typeof item.heat === "number"
            ? item.heat
            : computeHeat({
                id: item.id,
                publishedAt: item.publishedAt,
                views: item.views,
                clicks: item.clicks
              })
        }));
        setItems((prev) => (reset ? withHeat : [...prev, ...withHeat]));
        setHasMore(next.length >= 20);
        setPage(p);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setError("network_error");
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [buildQuery]
  );

  const queryKey = React.useMemo(() => buildQuery(1), [buildQuery]);
  React.useEffect(() => {
    setHasMore(true);
    setPage(1);
    setExpandedId(null);
    load(1, true);
  }, [queryKey, load]);

  const sentinel = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loading && !error) {
          load(page + 1, false);
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, error, load, page]);

  const onClickReadMore = async (articleId: string) => {
    await fetch("/api/news/metrics/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ articleId })
    });
  };

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-white/80">
          {locale === "zh" ? "加载失败，请稍后重试。" : "Failed to load. Please retry."}
          <button
            type="button"
            className="ml-3 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5"
            onClick={() => load(1, true)}
          >
            {locale === "zh" ? "重试" : "Retry"}
          </button>
        </div>
      ) : null}

      {items.map((item) => (
        <NewsCard
          key={item.id}
          locale={locale}
          item={item}
          expanded={expandedId === item.id}
          onToggle={() => setExpandedId((prev) => (prev === item.id ? null : item.id))}
          onClickReadMore={onClickReadMore}
        />
      ))}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/60">
          {locale === "zh" ? "加载中..." : "Loading..."}
        </div>
      ) : null}

      {!items.length && !loading && !error ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          {locale === "zh"
            ? "暂无新闻。请稍后刷新，或先清空“关联品种”筛选。"
            : "No items. Try refresh or clear the symbol filter."}
          <div className="mt-3">
            <a className="text-white/80 underline" href="/api/news/health" target="_blank" rel="noreferrer">
              {locale === "zh" ? "打开健康检查" : "Open health check"}
            </a>
          </div>
        </div>
      ) : null}

      <div ref={sentinel} />
    </div>
  );
}
