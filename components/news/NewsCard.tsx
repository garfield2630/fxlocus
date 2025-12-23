"use client";

import Link from "next/link";

type Sentiment = "bullish" | "bearish" | "neutral";

function dot(sentiment: Sentiment) {
  if (sentiment === "bullish") return "bg-emerald-400";
  if (sentiment === "bearish") return "bg-rose-400";
  return "bg-slate-300";
}

export function NewsCard({
  locale,
  item,
  onClickReadMore
}: {
  locale: "zh" | "en";
  item: any;
  onClickReadMore: (articleId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
      <div className="flex items-center gap-2 text-xs text-white/55">
        {item.logo ? <img src={item.logo} alt="" className="h-5 w-5 rounded" /> : null}
        <span>{item.source || "Source"}</span>
        <span>·</span>
        <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : ""}</span>
        <span className="ml-auto flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${dot(item.sentiment)}`} />
          <span className="text-white/45">{item.importance?.toUpperCase?.() || ""}</span>
        </span>
      </div>

      <Link href={`/${locale}/news/${item.slug}`} className="mt-2 block">
        <div className="line-clamp-2 text-lg font-semibold leading-snug text-white">
          {item.title}
        </div>
        <div className="mt-2 line-clamp-3 text-sm leading-6 text-white/70">{item.summary}</div>
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

      <div className="mt-3 flex items-center gap-3">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => onClickReadMore(item.id)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white/85 hover:bg-black/55"
        >
          {locale === "zh" ? "阅读全文" : "Read original"}
        </a>

        <div className="text-xs text-white/45">
          {locale === "zh" ? `热度：${item.views || 0}` : `Views: ${item.views || 0}`}
        </div>
      </div>
    </div>
  );
}
