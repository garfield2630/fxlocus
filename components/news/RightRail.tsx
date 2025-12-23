"use client";

import React from "react";

import { computeHeat } from "@/lib/news/heat";

import { EconCalendarWidget } from "./EconCalendarWidget";

function FlameIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3c2.5 3.2 2.8 5.7 1.1 8.2-.9 1.3-1.5 2.2-1.5 3.8 0 2 1.6 3.7 3.7 3.7 3.1 0 5.2-2.7 4.7-6.4-.3-2.3-1.6-4.4-3.2-6.4" />
      <path d="M8.3 7.2c-.7 1.5-2 2.6-2.6 4.3-.8 2.3-.2 5.3 1.7 7 1.2 1.1 2.9 1.8 4.6 1.8" />
    </svg>
  );
}

function cleanText(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/<+\s*sep\s*>+/gi, "")
    .replace(/[<>]+/g, "")
    .trim();
}

export function RightRail({ locale }: { locale: "zh" | "en" }) {
  const [hot, setHot] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const onClickHot = React.useCallback((articleId: string) => {
    void fetch("/api/news/metrics/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ articleId })
    });
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/news/list?locale=${locale}&range=week&page=1&pageSize=30&category=all&importance=all`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!json?.ok) {
          if (alive) setError(json?.error || "load_failed");
          return;
        }
        const items = Array.isArray(json.items) ? json.items : [];
        const withHeat = items.map((item: any) => ({
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
        withHeat.sort((a: any, b: any) => (b.heat || 0) - (a.heat || 0));
        if (alive) setHot(withHeat.slice(0, 8));
      } catch (err: any) {
        if (alive) setError(err?.message || "network_error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [locale]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-white/85 font-semibold">
          <FlameIcon className="h-4 w-4 text-amber-400" />
          <span>{locale === "zh" ? "热门新闻" : "Hot News"}</span>
        </div>
        <div className="mt-3 space-y-2">
          {error ? (
            <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-xs text-white/70">
              {locale === "zh" ? "热门加载失败" : "Failed to load trending"}
            </div>
          ) : hot.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
              {locale === "zh" ? "暂无热门数据" : "No trending items yet."}
            </div>
          ) : (
            hot.map((item: any) => {
              const targetUrl = item.url || `/${locale}/news/${item.slug}`;
              return (
              <a
                key={item.id}
                href={targetUrl}
                target={item.url ? "_blank" : undefined}
                rel={item.url ? "noreferrer" : undefined}
                onClick={() => onClickHot(item.id)}
                className="block rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
              >
                <div className="flex items-start gap-2">
                  <FlameIcon className="mt-0.5 h-3.5 w-3.5 text-amber-400" />
                  <div className="line-clamp-2 text-sm font-semibold text-white/85">
                    {cleanText(String(item.title || ""))}
                  </div>
                </div>
                <div className="mt-1 text-xs text-white/50">
                  {locale === "zh" ? "热度" : "Heat"}：{item.heat ?? item.views ?? 0}
                </div>
              </a>
            );
            })
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/85 font-semibold">
          {locale === "zh" ? "实时经济日历" : "Economic Calendar"}
        </div>
        <div className="mt-3 overflow-hidden">
          <EconCalendarWidget locale={locale} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/85 font-semibold">
          {locale === "zh" ? "关联课程推荐" : "Recommended Courses"}
        </div>
        <div className="mt-2 text-sm leading-6 text-white/70">
          {locale === "zh"
            ? "（占位）按新闻的分类与品种推荐课程与文章。接入课程库后自动替换为真实推荐。"
            : "(Placeholder) Recommend courses/articles by category and symbols once course DB is connected."}
        </div>
      </div>
    </div>
  );
}
