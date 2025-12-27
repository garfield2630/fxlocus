import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchRssItems } from "@/lib/news/rss";
import { extractSymbolsHeuristic } from "@/lib/news/symbols";
import { safeSlug } from "@/lib/news/normalize";

export const runtime = "nodejs";

const CACHE_TTL_MS = 30_000;
const TRANSLATE_TTL_MS = 24 * 60 * 60 * 1000;

const g = globalThis as {
  __fx_news_list_cache?: Map<string, { exp: number; payload: unknown }>;
  __fx_news_translate_cache?: Map<string, { exp: number; value: { title: string; summary: string } }>;
};
if (!g.__fx_news_list_cache) g.__fx_news_list_cache = new Map();
const cache = g.__fx_news_list_cache;
if (!g.__fx_news_translate_cache) g.__fx_news_translate_cache = new Map();
const translateCache = g.__fx_news_translate_cache;

function cacheGet(key: string) {
  const hit = cache?.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    cache?.delete(key);
    return null;
  }
  return hit.payload;
}

function cacheSet(key: string, payload: unknown) {
  cache?.set(key, { exp: Date.now() + CACHE_TTL_MS, payload });
}

function hasDb() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function translateCacheKey(title: string, summary: string) {
  return `${title}||${summary}`;
}

function hasSufficientCjk(text: string) {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (cjk === 0) return false;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  const total = cjk + latin;
  if (total === 0) return false;
  return cjk / total >= 0.2;
}

async function translateViaMyMemory(text: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=en|zh`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const translated = json?.responseData?.translatedText;
    if (typeof translated !== "string") return null;
    return decodeEntities(translated);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function decodeEntities(text: string) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function sanitizeTranslation(text: string) {
  const stripped = (text || "").replace(/&lt;+\s*sep\s*&gt;+/gi, "");
  const decoded = decodeEntities(stripped);
  return decoded.replace(/<+\s*sep\s*>+/gi, "").replace(/[<>]+/g, "").trim();
}

function normalizeText(value?: string | null) {
  if (!value) return "";
  return sanitizeTranslation(String(value));
}

function sanitizeHtmlContent(html?: string | null) {
  if (!html) return "";
  return sanitizeHtml(String(html), {
    allowedTags: [
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "blockquote",
      "h1",
      "h2",
      "h3",
      "h4",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "img",
      "a",
      "span",
      "div"
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "srcset"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"]
    },
    allowedSchemes: ["http", "https", "data"],
    allowProtocolRelative: true,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || "";
        const safeHref = href.startsWith("javascript:") ? "" : href;
        return {
          tagName,
          attribs: {
            ...attribs,
            href: safeHref,
            target: "_blank",
            rel: "noreferrer"
          }
        };
      }
    }
  }).trim();
}

async function translateViaMyMemoryBatch(items: Array<{ title: string; summary: string }>) {
  const results = await Promise.all(
    items.map(async (item) => {
      const titleRaw = (await translateViaMyMemory(item.title)) || item.title;
      const summaryRaw = item.summary
        ? (await translateViaMyMemory(item.summary)) || item.summary
        : item.summary;
      const title = sanitizeTranslation(titleRaw) || item.title;
      const summary = sanitizeTranslation(summaryRaw) || item.summary;
      return { title, summary };
    })
  );
  return results;
}

async function translateBatchToZh(items: Array<{ title: string; summary: string }>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return translateViaMyMemoryBatch(items);
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const prompt = [
    "Translate each news title and summary into concise Chinese.",
    "Rules:",
    "- Preserve factual meaning; do not exaggerate.",
    "- Keep proper nouns, numbers, and currency codes.",
    "- Return a JSON array of objects with keys: title, summary.",
    "- The output array must match the input order and length."
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: "Return JSON only." },
        { role: "user", content: JSON.stringify({ prompt, items }) }
      ]
    })
  });

  if (!res.ok) return translateViaMyMemoryBatch(items);
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) return translateViaMyMemoryBatch(items);

  try {
    const arr = JSON.parse(content);
    if (!Array.isArray(arr)) return translateViaMyMemoryBatch(items);
    return arr.map((item: any) => ({
      title: sanitizeTranslation(String(item?.title || "").trim()),
      summary: sanitizeTranslation(String(item?.summary || "").trim())
    }));
  } catch {
    return translateViaMyMemoryBatch(items);
  }
}

async function applyZhTranslation<
  T extends {
    titleEn: string;
    summaryEn: string;
    titleZh?: string | null;
    summaryZh?: string | null;
  }
>(items: T[]) {

  const now = Date.now();
  const pending: Array<{
    idx: number;
    title: string;
    summary: string;
    needsTitle: boolean;
    needsSummary: boolean;
  }> = [];
  const cached = new Map<number, { title: string; summary: string }>();
  const needsMap = new Map<number, { title: boolean; summary: boolean }>();

  items.forEach((item, idx) => {
    const titleZh = normalizeText(item.titleZh);
    const summaryZh = normalizeText(item.summaryZh);
    const needsTitle = !titleZh || !hasSufficientCjk(titleZh);
    const needsSummary = !summaryZh || !hasSufficientCjk(summaryZh);
    const hasZh = !needsTitle && !needsSummary;
    const sourceTitle = item.titleEn || "";
    const sourceSummary = item.summaryEn || "";
    needsMap.set(idx, { title: needsTitle, summary: needsSummary });
    if (hasZh) return;
    if (!sourceTitle && !sourceSummary) return;
    if (hasSufficientCjk(`${sourceTitle} ${sourceSummary}`)) return;
    const key = translateCacheKey(sourceTitle, sourceSummary || "");
    const hit = translateCache.get(key);
    if (hit && hit.exp > now) {
      cached.set(idx, {
        title: sanitizeTranslation(hit.value.title || sourceTitle),
        summary: sanitizeTranslation(hit.value.summary || sourceSummary)
      });
    } else {
      pending.push({
        idx,
        title: sourceTitle,
        summary: sourceSummary || "",
        needsTitle,
        needsSummary
      });
    }
  });

  const translated = new Map<number, { title: string; summary: string }>();
  cached.forEach((value, idx) => translated.set(idx, value));

  const batchSize = 8;
  for (let i = 0; i < pending.length; i += batchSize) {
    const slice = pending.slice(i, i + batchSize);
    const resp = await translateBatchToZh(
      slice.map((item) => ({ title: item.title, summary: item.summary }))
    );
    if (!resp || resp.length !== slice.length) continue;

    for (let j = 0; j < slice.length; j += 1) {
      const translatedItem = resp[j];
      if (!translatedItem?.title && !translatedItem?.summary) continue;
      const { idx } = slice[j];
      translated.set(idx, {
        title: sanitizeTranslation(translatedItem.title || slice[j].title),
        summary: sanitizeTranslation(translatedItem.summary || slice[j].summary)
      });
      const key = translateCacheKey(slice[j].title, slice[j].summary);
      translateCache.set(key, {
        exp: Date.now() + TRANSLATE_TTL_MS,
        value: {
          title: sanitizeTranslation(translatedItem.title || slice[j].title),
          summary: sanitizeTranslation(translatedItem.summary || slice[j].summary)
        }
      });
    }
  }

  return items.map((item, idx) => {
    const needs = needsMap.get(idx);
    const t = translated.get(idx);
    if (!t && !needs) return item;
    const titleZh = normalizeText(item.titleZh);
    const summaryZh = normalizeText(item.summaryZh);
    return {
      ...item,
      titleZh: needs?.title ? t?.title || titleZh || item.titleEn : titleZh || item.titleEn,
      summaryZh: needs?.summary ? t?.summary || summaryZh || item.summaryEn : summaryZh || item.summaryEn
    };
  });
}

async function rssFallback({
  locale,
  category,
  importance,
  range,
  symbol,
  q,
  page,
  pageSize
}: {
  locale: "zh" | "en";
  category: string;
  importance: string;
  range: string;
  symbol: string;
  q: string;
  page: number;
  pageSize: number;
}) {
  const now = new Date();
  const start = new Date(now);
  if (range === "today") start.setDate(now.getDate() - 1);
  if (range === "week") start.setDate(now.getDate() - 7);
  if (range === "month") start.setMonth(now.getMonth() - 1);

  if (importance !== "all" && importance !== "medium") {
    return { ok: true, items: [], total: 0, fallback: "rss" };
  }

  const items = await fetchRssItems({
    category: category === "all" ? null : category,
    limit: 200
  });

  const upperSymbol = symbol.trim().toUpperCase();
  const keyword = q.trim().toLowerCase();

  const filteredByRange = items.filter((item) => {
    const publishedDate = item.publishedAt ? new Date(item.publishedAt) : null;
    if (publishedDate && publishedDate < start) return false;
    if (publishedDate && publishedDate > now) return false;
    return true;
  });

  let filtered = filteredByRange.filter((item) => {
    const title = item.title || "";
    const summary = item.summary || "";
    const text = `${title} ${summary}`.toLowerCase();
    if (keyword && !text.includes(keyword)) return false;
    if (upperSymbol) {
      const hintSymbols = extractSymbolsHeuristic(`${title} ${summary}`).map((s) =>
        s.toUpperCase()
      );
      if (
        !title.toUpperCase().includes(upperSymbol) &&
        !summary.toUpperCase().includes(upperSymbol) &&
        !hintSymbols.includes(upperSymbol)
      ) {
        return false;
      }
    }
    return true;
  });

  if (!filtered.length && !upperSymbol && !keyword) {
    filtered = items;
  }

  const total = filtered.length;
  const startIdx = (page - 1) * pageSize;
  let pageItems = filtered.slice(startIdx, startIdx + pageSize).map((item) => {
    const title = normalizeText(item.title);
    const summary = normalizeText(item.summary || "");
    const symbols = extractSymbolsHeuristic(`${title} ${summary}`);
    const contentHtml = sanitizeHtmlContent(item.contentHtml || "");
    return {
      id: item.id,
      slug: `${safeSlug(`${item.source}-${item.title}`)}-${item.id.slice(0, 8)}`,
      url: item.link,
      source: item.source,
      logo: "",
      titleEn: title,
      summaryEn: summary,
      contentHtml,
      titleZh: null,
      summaryZh: null,
      author: "",
      publishedAt: item.publishedAt,
      category: item.category,
      importance: "medium",
      sentiment: "neutral",
      symbols,
      views: 0,
      clicks: 0
    };
  });

  if (locale === "zh") {
    pageItems = await applyZhTranslation(pageItems);
  }

  return {
    ok: true,
    items: pageItems.map((item) => ({
      id: item.id,
      slug: item.slug,
      url: item.url,
      source: item.source,
      logo: item.logo,
      title: item.titleZh || item.titleEn,
      summary: item.summaryZh || item.summaryEn,
      content: item.summaryZh || item.summaryEn,
      contentHtml: item.contentHtml || "",
      langTag: item.titleZh ? "ZH" : "EN",
      author: item.author,
      publishedAt: item.publishedAt,
      category: item.category,
      importance: item.importance,
      sentiment: item.sentiment,
      symbols: item.symbols,
      views: item.views,
      clicks: item.clicks
    })),
    total,
    fallback: "rss"
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let locale: "zh" | "en" = "zh";
  let category = "all";
  let importance = "all";
  let range = "today";
  let symbol = "";
  let q = "";
  let page = 1;
  let pageSize = 20;

  try {
    locale = (searchParams.get("locale") === "en" ? "en" : "zh") as "zh" | "en";
    category = searchParams.get("category") || "all";
    importance = searchParams.get("importance") || "all";
    range = searchParams.get("range") || "today";
    symbol = (searchParams.get("symbol") || "").trim().toUpperCase();
    q = (searchParams.get("q") || "").trim();
    page = Math.max(1, Number(searchParams.get("page") || 1));
    pageSize = Math.min(30, Math.max(10, Number(searchParams.get("pageSize") || 20)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const cacheKey = [
      "news:list",
      locale,
      category,
      importance,
      range,
      symbol,
      q,
      page,
      pageSize
    ].join("|");

    const cached = cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached, { status: 200 });

    if (!hasDb()) {
      const payload = await rssFallback({
        locale,
        category,
        importance,
        range,
        symbol,
        q,
        page,
        pageSize
      });
      cacheSet(cacheKey, payload);
      return NextResponse.json(payload, { status: 200 });
    }

    const sb = supabaseAdmin();

    const now = new Date();
    const start = new Date(now);
    if (range === "today") start.setDate(now.getDate() - 1);
    if (range === "week") start.setDate(now.getDate() - 7);
    if (range === "month") start.setMonth(now.getMonth() - 1);

    let query = sb
      .from("news_articles")
      .select(
        "id,slug,url,source_id,title_en,title_zh,summary_en,summary_zh,content_en,content_zh,cover_image_url,author,published_at,category,importance,sentiment,symbols,status,news_sources(name,logo_url),news_metrics(views,clicks)",
        { count: "exact" }
      )
      .eq("status", "published")
      .gte("published_at", start.toISOString())
      .order("published_at", { ascending: false })
      .range(from, to);

    if (category !== "all") query = query.eq("category", category);
    if (importance !== "all") query = query.eq("importance", importance);
    if (symbol.length >= 3) query = query.contains("symbols", [symbol]);

    if (q.length >= 2) {
      query = query.or(
        `title_en.ilike.%${q}%,title_zh.ilike.%${q}%,summary_en.ilike.%${q}%,summary_zh.ilike.%${q}%`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      const payload = await rssFallback({
        locale,
        category,
        importance,
        range,
        symbol,
        q,
        page,
        pageSize
      });
      cacheSet(cacheKey, payload);
      return NextResponse.json(payload, { status: 200 });
    }

    let items = (data || []).map((item: any) => {
      const metrics = Array.isArray(item.news_metrics) ? item.news_metrics[0] : item.news_metrics;
      const source = Array.isArray(item.news_sources) ? item.news_sources[0] : item.news_sources;
      return {
        id: item.id,
        slug: item.slug,
        url: item.url,
        source: source?.name || "",
        logo: source?.logo_url || "",
        titleEn: normalizeText(item.title_en || ""),
        summaryEn: normalizeText(item.summary_en || ""),
        contentEn: normalizeText(item.content_en || ""),
        titleZh: item.title_zh ? normalizeText(item.title_zh) : null,
        summaryZh: item.summary_zh ? normalizeText(item.summary_zh) : null,
        contentZh: item.content_zh ? normalizeText(item.content_zh) : null,
        coverImage: item.cover_image_url || "",
        author: item.author,
        publishedAt: item.published_at,
        category: item.category,
        importance: item.importance,
        sentiment: item.sentiment,
        symbols: item.symbols || [],
        views: metrics?.views || 0,
        clicks: metrics?.clicks || 0
      };
    });

    const rawHtmlMap = new Map<string, string>();
    const urls = items.map((item) => item.url).filter(Boolean);
    if (urls.length) {
      const { data: rawRows } = await sb
        .from("news_raw")
        .select("url,raw_html")
        .in("url", urls);
      (rawRows || []).forEach((row: any) => {
        if (row?.url && row?.raw_html) {
          rawHtmlMap.set(row.url, sanitizeHtmlContent(row.raw_html));
        }
      });
    }

    if (!items.length && page === 1 && !symbol && !q) {
      const payload = await rssFallback({
        locale,
        category,
        importance,
        range,
        symbol,
        q,
        page,
        pageSize
      });
      cacheSet(cacheKey, payload);
      return NextResponse.json(payload, { status: 200 });
    }

    if (locale === "zh") {
      items = await applyZhTranslation(items);
    }

    const payload = {
      ok: true,
      items: items.map((item) => ({
        id: item.id,
        slug: item.slug,
        url: item.url,
        source: item.source,
        logo: item.logo,
        title: locale === "zh" ? item.titleZh || item.titleEn : item.titleEn || item.titleZh,
        summary: locale === "zh" ? item.summaryZh || item.summaryEn : item.summaryEn || item.summaryZh,
        content:
          locale === "zh"
            ? item.contentZh || item.summaryZh || item.summaryEn || item.contentEn
            : item.contentEn || item.summaryEn || item.summaryZh || item.contentZh,
        contentHtml:
          rawHtmlMap.get(item.url) ||
          (item.contentEn && /<[^>]+>/.test(item.contentEn)
            ? sanitizeHtmlContent(item.contentEn)
            : ""),
        coverImage: item.coverImage,
        langTag:
          locale === "zh"
            ? item.titleZh
              ? "ZH"
              : "EN"
            : item.titleEn
              ? "EN"
              : "ZH",
        author: item.author,
        publishedAt: item.publishedAt,
        category: item.category,
        importance: item.importance,
        sentiment: item.sentiment,
        symbols: item.symbols,
        views: item.views,
        clicks: item.clicks
      })),
      total: count || 0
    };
    cacheSet(cacheKey, payload);
    return NextResponse.json(payload, { status: 200 });
  } catch (error: any) {
    const payload = await rssFallback({
      locale,
      category,
      importance,
      range,
      symbol,
      q,
      page,
      pageSize
    });
    cacheSet("news:list:fallback", payload);
    return NextResponse.json(payload, { status: 200 });
  }
}

