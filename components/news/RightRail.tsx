"use client";

import React from "react";

import { EconCalendarWidget } from "./EconCalendarWidget";

export function RightRail({ locale }: { locale: "zh" | "en" }) {
  const [hot, setHot] = React.useState<any[]>([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(
        `/api/news/list?locale=${locale}&range=week&page=1&pageSize=30&category=all&importance=all`,
        { cache: "no-store" }
      );
      const json = await res.json();
      const items = Array.isArray(json.items) ? json.items : [];
      items.sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
      if (alive) setHot(items.slice(0, 8));
    })();
    return () => {
      alive = false;
    };
  }, [locale]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/85 font-semibold">{locale === "zh" ? "热门新闻" : "Hot News"}</div>
        <div className="mt-3 space-y-2">
          {hot.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
              {locale === "zh" ? "暂无热门数据" : "No trending items yet."}
            </div>
          ) : (
            hot.map((item: any) => (
              <a
                key={item.id}
                href={`/${locale}/news/${item.slug}`}
                className="block rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
              >
                <div className="line-clamp-2 text-sm font-semibold text-white/85">{item.title}</div>
                <div className="mt-1 text-xs text-white/50">
                  {locale === "zh" ? "热度" : "Views"}：{item.views || 0}
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/85 font-semibold">
          {locale === "zh" ? "实时经济日历" : "Economic Calendar"}
        </div>
        <div className="mt-3">
          <EconCalendarWidget locale={locale} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/85 font-semibold">
          {locale === "zh" ? "关联课程推荐" : "Recommended Courses"}
        </div>
        <div className="mt-2 text-sm leading-6 text-white/70">
          {locale === "zh"
            ? "（占位）按新闻的 category/symbols 推荐你的课程与文章。后续接入课程库后自动变为真实推荐。"
            : "(Placeholder) Recommend your courses/articles by category/symbols. Will become real once course DB is connected."}
        </div>
      </div>
    </div>
  );
}
