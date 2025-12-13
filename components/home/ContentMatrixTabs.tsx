"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { Pillar } from "@/lib/mock/types";

type ArticlePreview = {
  slug: string;
  pillar: Pillar;
  title: string;
  excerpt: string;
  readingTime: number;
  publishedAt: string;
};

type VideoPreview = {
  id: string;
  pillar: Pillar;
  title: string;
  excerpt: string;
  durationMinutes: number;
  publishedAt: string;
};

type CoursePreview = {
  id: string;
  title: string;
  lead: string;
  tier: "course" | "camp" | "audit";
};

type Props = {
  articles: ArticlePreview[];
  videos: VideoPreview[];
  courses: CoursePreview[];
};

type TabKey = "articles" | "videos" | "courses";

function pillLabelKey(pillar: Pillar) {
  if (pillar === "mind") return "mind";
  if (pillar === "market") return "market";
  return "price";
}

export function ContentMatrixTabs({ articles, videos, courses }: Props) {
  const t = useTranslations("home.matrix");
  const tLabels = useTranslations("common.labels");
  const tCommon = useTranslations("common");

  const [tab, setTab] = useState<TabKey>("articles");

  const tabs = useMemo(
    () =>
      [
        { key: "articles" as const, label: t("tabs.articles") },
        { key: "videos" as const, label: t("tabs.videos") },
        { key: "courses" as const, label: t("tabs.courses") }
      ] satisfies Array<{ key: TabKey; label: string }>,
    [t]
  );

  return (
    <div className="mt-8">
      <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
        {tabs.map((item) => {
          const active = item.key === tab;
          return (
            <button
              key={item.key}
              type="button"
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                active ? "bg-white/10 text-slate-50" : "text-slate-200/70 hover:text-slate-50"
              ].join(" ")}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "articles" ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {articles.map((post) => (
              <Link
                key={post.slug}
                href={`/insights/${post.slug}`}
                className="fx-card block p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="fx-pill">{tLabels(pillLabelKey(post.pillar))}</span>
                  <span className="text-xs text-slate-200/60">
                    {post.publishedAt} · {post.readingTime}
                    {tCommon("ui.minutesShort")}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-50">{post.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-200/70">{post.excerpt}</p>
              </Link>
            ))}
          </div>
          <div>
            <Link href="/insights" className="fx-btn fx-btn-secondary">
              {t("ctaAllArticles")}
            </Link>
          </div>
        </div>
      ) : null}

      {tab === "videos" ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {videos.map((video) => (
              <div key={video.id} className="fx-card p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="fx-pill">{tLabels(pillLabelKey(video.pillar))}</span>
                  <span className="text-xs text-slate-200/60">
                    {video.durationMinutes}
                    {tCommon("ui.minutesShort")} · {video.publishedAt}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-50">{video.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-200/70">{video.excerpt}</p>
              </div>
            ))}
          </div>
          <div>
            <Link href="/insights" className="fx-btn fx-btn-secondary">
              {t("ctaAllVideos")}
            </Link>
          </div>
        </div>
      ) : null}

      {tab === "courses" ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {courses.map((course) => (
              <div key={course.id} className="fx-card p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="fx-pill">{tCommon(`tiers.${course.tier}` as any)}</span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-50">{course.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-200/70">{course.lead}</p>
              </div>
            ))}
          </div>
          <div>
            <Link href="/programs" className="fx-btn fx-btn-secondary">
              {t("ctaAllCourses")}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
