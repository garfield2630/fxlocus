"use client";

import React from "react";

import { MiniChartWidget } from "@/components/news/MiniChartWidget";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

function toTvSymbol(symbol: string) {
  if (symbol.includes(":")) return symbol;
  if (symbol.endsWith("USDT")) return `BINANCE:${symbol}`;
  if (symbol.startsWith("XAU") || symbol.startsWith("XAG")) return `OANDA:${symbol}`;
  return `FX:${symbol}`;
}

export default function NewsDetail({
  params
}: {
  params: { locale: "zh" | "en"; slug: string };
}) {
  const locale = params?.locale === "en" ? "en" : "zh";
  const slug = params.slug;

  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [bookmarking, setBookmarking] = React.useState(false);
  const [bookmarked, setBookmarked] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/news/detail?locale=${locale}&slug=${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`detail ${res.status}`);
        const json = await res.json();
        if (!alive) return;
        setData(json?.article || null);
      } catch {
        if (!alive) return;
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, locale]);

  React.useEffect(() => {
    let client;
    try {
      client = getSupabaseBrowserClient();
    } catch {
      return;
    }
    client.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setUserId(data.user.id);
    });
  }, []);

  React.useEffect(() => {
    if (!userId || !data?.id) return;
    let client;
    try {
      client = getSupabaseBrowserClient();
    } catch {
      return;
    }
    client
      .from("news_bookmarks")
      .select("article_id")
      .eq("user_id", userId)
      .eq("article_id", data.id)
      .maybeSingle()
      .then(({ data: row }) => setBookmarked(Boolean(row)));
  }, [userId, data?.id]);

  React.useEffect(() => {
    if (!data?.id) return;
    const start = Date.now();

    const send = () => {
      const dwellSeconds = Math.round((Date.now() - start) / 1000);
      const payload = JSON.stringify({ articleId: data.id, dwellSeconds });
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/news/metrics/view", blob);
      } else {
        fetch("/api/news/metrics/view", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload
        });
      }
    };

    const onUnload = () => send();
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      send();
    };
  }, [data?.id]);

  const share = async () => {
    const url = window.location.href;
    if ((navigator as any).share) {
      await (navigator as any).share({ title: data?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert(locale === "zh" ? "链接已复制" : "Link copied");
    }
  };

  const toggleBookmark = async () => {
    if (!userId || !data?.id) return;
    setBookmarking(true);
    await fetch("/api/news/bookmark", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId,
        articleId: data.id,
        action: bookmarked ? "remove" : "add"
      })
    });
    setBookmarked((prev) => !prev);
    setBookmarking(false);
  };

  if (loading) {
    return <div className="p-8 text-white/70">{locale === "zh" ? "加载中…" : "Loading…"}</div>;
  }
  if (!data) {
    return <div className="p-8 text-white/70">{locale === "zh" ? "未找到内容" : "Not found"}</div>;
  }

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-4 pb-12 md:px-8">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => history.back()}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-white/80"
            >
              {locale === "zh" ? "返回" : "Back"}
            </button>
            <button
              onClick={share}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-white/80"
            >
              {locale === "zh" ? "分享" : "Share"}
            </button>
            <button
              onClick={toggleBookmark}
              disabled={!userId || bookmarking}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-white/80 disabled:opacity-50"
              title={userId ? "" : locale === "zh" ? "登录后可收藏" : "Login required"}
            >
              {bookmarked ? (locale === "zh" ? "已收藏" : "Bookmarked") : locale === "zh" ? "收藏" : "Bookmark"}
            </button>
            <a
              href={data.url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-white/85 hover:bg-black/55"
            >
              {locale === "zh" ? "打开原文" : "Open original"}
            </a>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 text-xs text-white/55">
              {data.logo ? <img src={data.logo} className="h-5 w-5 rounded" alt="" /> : null}
              <span>{data.source}</span>
              <span>·</span>
              <span>{data.author || (locale === "zh" ? "佚名" : "Unknown")}</span>
              <span>·</span>
              <span>{data.publishedAt ? new Date(data.publishedAt).toLocaleString() : ""}</span>
              <span className="ml-auto">
                {locale === "zh" ? "阅读量" : "Views"}：{data.views || 0}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold leading-snug text-white md:text-3xl">
              {data.title}
            </h1>
            <div className="mt-2 text-sm text-white/60">
              {locale === "zh" ? `Original: ${data.titleAlt || ""}` : `中文: ${data.titleAlt || ""}`}
            </div>

            {data.coverImage ? (
              <img
                src={data.coverImage}
                alt=""
                className="mt-4 w-full rounded-2xl border border-white/10"
              />
            ) : null}

            <div className="mt-4 text-white/75">{data.summary}</div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/85 font-semibold">
                {locale === "zh" ? "关键要点" : "Key Points"}
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
                {(data.keyPoints || []).map((point: string, idx: number) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/85 font-semibold">{locale === "zh" ? "内容" : "Content"}</div>
              <div className="mt-2 whitespace-pre-wrap text-white/75">
                {data.content
                  ? data.content
                  : locale === "zh"
                    ? "该来源为付费/限制内容，本站仅聚合元信息与训练视角摘要。请点击“打开原文”。"
                    : "Paid/restricted source: metadata & training summary only. Please open the original link."}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-4">
              <div className="text-white/85 font-semibold">
                {locale === "zh" ? "FxLocus Lens｜训练视角" : "FxLocus Lens | Training View"}
              </div>
              <div className="mt-2 whitespace-pre-wrap text-white/75">
                {data.lens ||
                  (locale === "zh"
                    ? "（自动生成/待编辑）从“市场认知 → 证据链 → 执行一致性”角度观察：这条新闻改变了什么预期？证伪点在哪里？不确定性如何管理？\n\n免责声明：仅用于训练与研究，不构成投资建议。"
                    : "(Auto/Editable) Observe via cognition → evidence chain → execution consistency.\n\nDisclaimer: training use only, not financial advice.")}
              </div>
            </div>

            {(data.symbols || []).length ? (
              <div className="mt-6 space-y-3">
                <div className="text-white/85 font-semibold">
                  {locale === "zh" ? "关联品种行情" : "Related Markets"}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(data.symbols || []).slice(0, 4).map((symbol: string) => (
                    <div key={symbol} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="mb-2 text-sm text-white/75">{symbol}</div>
                      <MiniChartWidget symbol={toTvSymbol(symbol)} locale={locale} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/85 font-semibold">
              {locale === "zh" ? "同主题近期新闻" : "More on this topic"}
            </div>
            <div className="mt-2 text-sm text-white/70">
              {locale === "zh"
                ? "（占位）后续用 symbols/category 做相似推荐。"
                : "(Placeholder) Use symbols/category to recommend related articles."}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/85 font-semibold">{locale === "zh" ? "交易工具链接" : "Tools"}</div>
            <div className="mt-3 space-y-2 text-sm">
              <a className="block text-white/75 hover:text-white" href={`/${locale}/markets`}>
                {locale === "zh" ? "打开行情终端" : "Open Markets Terminal"}
              </a>
              <a className="block text-white/75 hover:text-white" href={`/${locale}/tools`}>
                {locale === "zh" ? "工具" : "Tools"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
