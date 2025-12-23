"use client";

import React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

import type { Filters } from "./FiltersPanel";
import { NewsCard } from "./NewsCard";

export function NewsFeed({ locale, filters }: { locale: "zh" | "en"; filters: Filters }) {
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (p: number, reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("locale", locale);
        params.set("page", String(p));
        params.set("pageSize", "20");
        params.set("category", filters.category);
        params.set("importance", filters.importance);
        params.set("range", filters.range);
        if (filters.symbol.trim()) params.set("symbol", filters.symbol.trim());
        if (filters.q.trim()) params.set("q", filters.q.trim());

        const res = await fetch(`/api/news/list?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`list ${res.status}`);
        const json = await res.json();
        const next = Array.isArray(json.items) ? json.items : [];
        setItems((prev) => (reset ? next : [...prev, ...next]));
        setHasMore(next.length >= 20);
        setPage(p);
      } catch (err: any) {
        setError(err?.message || "load error");
      } finally {
        setLoading(false);
      }
    },
    [locale, filters]
  );

  React.useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    load(1, true);
  }, [load]);

  React.useEffect(() => {
    let client;
    try {
      client = getSupabaseBrowserClient();
    } catch {
      return;
    }

    const channel = client
      .channel("news-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "news_articles" },
        (payload) => {
          const row = payload.new as any;
          if (!row || row.status !== "published") return;
          if (row.scheduled_at && new Date(row.scheduled_at) > new Date()) return;
          if (filters.category !== "all" && row.category !== filters.category) return;
          if (filters.importance !== "all" && row.importance !== filters.importance) return;
          if (filters.symbol && !Array.isArray(row.symbols)) return;
          if (filters.symbol && !row.symbols.includes(filters.symbol)) return;
          load(1, true);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [filters, load]);

  const sentinel = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loading) {
          load(page + 1);
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, load, page]);

  const onClickReadMore = async (articleId: string) => {
    await fetch("/api/news/metrics/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ articleId })
    });
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <NewsCard key={item.id} locale={locale} item={item} onClickReadMore={onClickReadMore} />
      ))}

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {locale === "zh" ? "加载失败，请稍后重试。" : "Failed to load. Please retry."}
        </div>
      ) : null}

      {loading ? (
        <div className="p-3 text-sm text-white/50">{locale === "zh" ? "加载中…" : "Loading…"}</div>
      ) : null}

      {!items.length && !loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/65">
          {locale === "zh" ? "暂无新闻。请稍后刷新或放宽筛选条件。" : "No items. Try refresh or loosen filters."}
        </div>
      ) : null}

      <div ref={sentinel} />
    </div>
  );
}
