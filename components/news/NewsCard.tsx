"use client";

import Link from "next/link";

type Sentiment = "bullish" | "bearish" | "neutral";

function dot(sentiment: Sentiment) {
  if (sentiment === "bullish") return "bg-emerald-400";
  if (sentiment === "bearish") return "bg-rose-400";
  return "bg-slate-300";
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

export function NewsCard({
  locale,
  item,
  expanded,
  onToggle,
  onClickReadMore
}: {
  locale: "zh" | "en";
  item: any;
  expanded: boolean;
  onToggle: () => void;
  onClickReadMore: (articleId: string) => void;
}) {
  const title = cleanText(String(item.title || ""));
  const summary = cleanText(String(item.summary || ""));
  const content = cleanText(String(item.content || item.summary || ""));
  const contentHtml = typeof item.contentHtml === "string" ? item.contentHtml : "";
  const coverImage = item.coverImage || item.cover_image_url || "";
  const heat = (item.heat ?? item.views) || 0;
  const externalUrl = typeof item.url === "string" ? item.url : "";
  const detailLabel = expanded
    ? locale === "zh"
      ? "收起详情"
      : "Collapse details"
    : locale === "zh"
      ? "展开详情"
      : "Details";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
      <div className="flex items-center gap-2 text-xs text-white/55">
        {item.logo ? <img src={item.logo} alt="" className="h-5 w-5 rounded" /> : null}
        <span>{item.source || (locale === "zh" ? "来源" : "Source")}</span>
        <span>·</span>
        <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : ""}</span>
        <span className="ml-auto flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${dot(item.sentiment)}`} />
          <span className="text-white/45">{item.importance?.toUpperCase?.() || ""}</span>
        </span>
      </div>

      <Link href={`/${locale}/news/${item.slug}`} className="mt-2 block">
        <div className="line-clamp-2 text-lg font-semibold leading-snug text-white">{title}</div>
        <div className="mt-2 line-clamp-3 text-sm leading-6 text-white/70">{summary}</div>
      </Link>

      <div className="mt-3 flex flex-wrap gap-2">
        {(item.symbols || []).slice(0, 6).map((symbol: string) => (
          <span
            key={symbol}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70"
          >
            {symbol}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => onClickReadMore(item.id)}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white/85 hover:bg-black/55"
          >
            {locale === "zh" ? "阅读全文" : "Read original"}
          </a>
        ) : (
          <Link
            href={`/${locale}/news/${item.slug}`}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white/85 hover:bg-black/55"
          >
            {locale === "zh" ? "阅读全文" : "Read original"}
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
        >
          {detailLabel}
        </button>

        <div className="text-xs text-white/45">
          {locale === "zh" ? `热度：${heat}` : `Heat: ${heat}`}
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
          {coverImage ? (
            <img
              src={coverImage}
              alt=""
              className="mb-3 w-full rounded-xl border border-white/10 object-cover"
              loading="lazy"
            />
          ) : null}
          {contentHtml ? (
            <div
              className="space-y-3 leading-6 text-white/80 [&_a]:text-sky-300 [&_a:hover]:text-sky-200 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-white/10 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-white/10 [&_th]:bg-white/5 [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-white/10 [&_td]:px-2 [&_td]:py-1 [&_p]:my-2"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          ) : (
            <div className="whitespace-pre-wrap leading-6">{content || summary}</div>
          )}
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => onClickReadMore(item.id)}
              className="mt-3 inline-flex items-center text-xs text-white/70 hover:text-white"
            >
              {locale === "zh" ? "打开原文" : "Open original"}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
