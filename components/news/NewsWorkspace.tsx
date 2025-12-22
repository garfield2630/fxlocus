"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  category: string;
  summary?: string;
};

type RangeKey = "today" | "week" | "month" | "custom";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function NewsWorkspace() {
  const t = useTranslations("news");
  const [category, setCategory] = useState("fx");
  const [range, setRange] = useState<RangeKey>("week");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [items, setItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const categoryOptions = useMemo(
    () => [
      { value: "fx", label: t("filters.categories.fx") },
      { value: "stocks", label: t("filters.categories.stocks") },
      { value: "commodities", label: t("filters.categories.commodities") },
      { value: "crypto", label: t("filters.categories.crypto") },
      { value: "macro", label: t("filters.categories.macro") }
    ],
    [t]
  );

  const rangeOptions = useMemo(
    () => [
      { value: "today", label: t("filters.range.today") },
      { value: "week", label: t("filters.range.week") },
      { value: "month", label: t("filters.range.month") },
      { value: "custom", label: t("filters.range.custom") }
    ],
    [t]
  );

  useEffect(() => {
    if (range === "custom") return;
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    if (range === "today") {
      start.setHours(0, 0, 0, 0);
    }
    if (range === "week") {
      start.setDate(start.getDate() - 7);
    }
    if (range === "month") {
      start.setDate(start.getDate() - 30);
    }

    setFrom(toDateInputValue(start));
    setTo(toDateInputValue(end));
  }, [range]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setStatus("loading");
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (from) params.set("from", from);
        if (to) params.set("to", to);

        const res = await fetch(`/api/news/feed?${params.toString()}`, {
          signal: controller.signal
        });
        if (!res.ok) throw new Error("feed_unavailable");
        const data = (await res.json()) as { items?: NewsItem[] };
        setItems(Array.isArray(data.items) ? data.items : []);
        setStatus("idle");
      } catch (error) {
        if ((error as any)?.name === "AbortError") return;
        setStatus("error");
      }
    }

    load();
    return () => controller.abort();
  }, [category, from, to]);

  const trending = items.slice(0, 6);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr_280px]">
      <aside className="space-y-4">
        <div className="fx-card p-6">
          <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
            {t("filters.title")}
          </div>
          <div className="mt-4 space-y-4 text-sm text-slate-200/70">
            <div>
              <label className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
                {t("filters.category")}
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-50"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
                {t("filters.time")}
              </label>
              <select
                value={range}
                onChange={(event) => setRange(event.target.value as RangeKey)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-50"
              >
                {rangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {range === "custom" ? (
                <div className="mt-3 grid gap-2 text-xs">
                  <label className="space-y-2">
                    <span className="text-slate-200/60">{t("filters.customFrom")}</span>
                    <input
                      type="date"
                      value={from}
                      onChange={(event) => setFrom(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-50"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-slate-200/60">{t("filters.customTo")}</span>
                    <input
                      type="date"
                      value={to}
                      onChange={(event) => setTo(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-50"
                    />
                  </label>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </aside>

      <section className="fx-card p-6">
        <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
          {t("feed.title")}
        </div>
        <div className="mt-4 space-y-3">
          {status === "loading" ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200/70">
              {t("feed.loading")}
            </div>
          ) : null}
          {status === "error" ? (
            <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
              {t("feed.error")}
            </div>
          ) : null}
          {status !== "loading" && items.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200/70">
              {t("feed.empty")}
            </div>
          ) : null}
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200/75"
            >
              <div className="flex items-center justify-between gap-4 text-xs text-slate-200/60">
                <span>{item.source}</span>
                <span>{formatTimestamp(item.publishedAt)}</span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-50">{item.title}</h3>
              {item.summary ? (
                <p className="mt-2 text-sm text-slate-200/70">{item.summary}</p>
              ) : null}
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-slate-200/60">
                  {item.category}
                </span>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-sky-300 hover:text-sky-200"
                >
                  {t("feed.readMore")}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="fx-card p-6">
          <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
            {t("trending.title")}
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-200/70">
            {trending.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200/60">
                {t("trending.empty")}
              </div>
            ) : (
              trending.map((item) => (
                <a
                  key={`trending-${item.id}`}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100/85 hover:bg-white/10"
                >
                  <div className="text-[11px] text-slate-200/60">{item.source}</div>
                  <div className="mt-1 line-clamp-2">{item.title}</div>
                </a>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
