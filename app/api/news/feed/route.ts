import { createHash } from "crypto";
import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const runtime = "nodejs";

type FeedItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  category: string;
  summary?: string;
};

type Source = {
  source: string;
  url: string;
  category: string;
};

const sources: Source[] = [
  {
    source: "FXStreet",
    url: "https://www.fxstreet.com/rss/news",
    category: "fx"
  },
  {
    source: "DailyFX",
    url: "https://www.dailyfx.com/feeds/market-news",
    category: "fx"
  },
  {
    source: "Nasdaq",
    url: "https://www.nasdaq.com/feed/rssoutbound?category=Stock-Market-News",
    category: "stocks"
  },
  {
    source: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml",
    category: "crypto"
  },
  {
    source: "EIA",
    url: "https://www.eia.gov/rss/overview.xml",
    category: "commodities"
  },
  {
    source: "Federal Reserve",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    category: "macro"
  }
];

const parser = new Parser();

function buildId(input: string) {
  return createHash("sha1").update(input).digest("hex");
}

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const fromDate = parseDate(fromParam ?? undefined);
  const toDate = parseDate(toParam ?? undefined);

  const activeSources = category
    ? sources.filter((source) => source.category === category)
    : sources;

  const results = await Promise.allSettled(
    activeSources.map(async (source) => {
      const feed = await parser.parseURL(source.url);
      return { source, items: feed.items ?? [] };
    })
  );

  const seen = new Set<string>();
  const items: FeedItem[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { source, items: feedItems } = result.value;

    for (const item of feedItems) {
      const title = item.title?.trim() ?? "";
      const link = item.link?.trim() ?? "";
      const publishedAt =
        (item.isoDate || item.pubDate || item.published || item.updated) ?? "";

      if (!title || !link) continue;

      const publishedDate = parseDate(publishedAt);
      if (fromDate && publishedDate && publishedDate < fromDate) continue;
      if (toDate && publishedDate && publishedDate > toDate) continue;

      const id = buildId(`${source.source}|${link}|${publishedAt}`);
      if (seen.has(id)) continue;
      seen.add(id);

      items.push({
        id,
        title,
        link,
        source: source.source,
        publishedAt: publishedDate ? publishedDate.toISOString() : publishedAt,
        category: source.category,
        summary: item.contentSnippet?.trim() || item.summary?.trim() || undefined
      });
    }
  }

  items.sort((a, b) => {
    const aTime = Date.parse(a.publishedAt || "");
    const bTime = Date.parse(b.publishedAt || "");
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });

  return NextResponse.json({ items });
}
