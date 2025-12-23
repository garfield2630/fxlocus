import { NextRequest, NextResponse } from "next/server";

import { fetchRssItems } from "@/lib/news/rss";
import { extractSymbolsHeuristic } from "@/lib/news/symbols";
import { safeSlug } from "@/lib/news/normalize";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const TRANSLATE_TTL_MS = 24 * 60 * 60 * 1000;

const g = globalThis as {
  __fx_news_translate_cache?: Map<string, { exp: number; value: { title: string; summary: string } }>;
};
if (!g.__fx_news_translate_cache) g.__fx_news_translate_cache = new Map();
const translateCache = g.__fx_news_translate_cache;

function hasDb() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function hasOpenAI() {
  return Boolean(process.env.OPENAI_API_KEY);
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

async function translateSingleToZh(title: string, summary: string) {
  const baseTitle = normalizeText(title);
  const baseSummary = normalizeText(summary);
  if (!baseTitle && !baseSummary) return null;
  if (hasSufficientCjk(`${baseTitle} ${baseSummary}`)) return { title: baseTitle, summary: baseSummary };

  const key = translateCacheKey(baseTitle, baseSummary);
  const hit = translateCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;

  const translateFallback = async () => {
    const translatedTitle = await translateViaMyMemory(baseTitle);
    const translatedSummary = baseSummary ? await translateViaMyMemory(baseSummary) : null;
    const value = {
      title: sanitizeTranslation(translatedTitle || baseTitle),
      summary: sanitizeTranslation(translatedSummary || baseSummary)
    };
    translateCache.set(key, { exp: Date.now() + TRANSLATE_TTL_MS, value });
    return value;
  };

  if (!hasOpenAI()) {
    return translateFallback();
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const prompt = [
    "Translate the news title and summary into concise Chinese.",
    "Rules:",
    "- Preserve factual meaning; do not exaggerate.",
    "- Keep proper nouns, numbers, and currency codes.",
    "- Return a JSON object with keys: title, summary."
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: "Return JSON only." },
        { role: "user", content: JSON.stringify({ prompt, title, summary }) }
      ]
    })
  });

  if (!res.ok) return translateFallback();
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) return translateFallback();

  try {
    const parsed = JSON.parse(content);
    const value = {
      title: sanitizeTranslation(String(parsed?.title || baseTitle).trim()),
      summary: sanitizeTranslation(String(parsed?.summary || baseSummary).trim())
    };
    translateCache.set(key, { exp: Date.now() + TRANSLATE_TTL_MS, value });
    return value;
  } catch {
    return translateFallback();
  }
}

function buildRssSlug(item: { source: string; title: string; id: string }) {
  return `${safeSlug(`${item.source}-${item.title}`)}-${item.id.slice(0, 8)}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const locale = (searchParams.get("locale") === "en" ? "en" : "zh") as "zh" | "en";
  if (!slug) return NextResponse.json({ ok: false }, { status: 400 });

  if (hasDb()) {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("news_articles")
      .select("*,news_sources(name,logo_url),news_metrics(views,clicks,avg_dwell_seconds)")
      .eq("slug", slug)
      .maybeSingle();

    if (data && !error) {
      if (
        data.status !== "published" ||
        (data.scheduled_at && new Date(data.scheduled_at) > new Date())
      ) {
        return NextResponse.json({ ok: false }, { status: 404 });
      }

      const metrics = Array.isArray(data.news_metrics) ? data.news_metrics[0] : data.news_metrics;
      const source = Array.isArray(data.news_sources) ? data.news_sources[0] : data.news_sources;
      const titleEn = normalizeText(data.title_en || "");
      const summaryEn = normalizeText(data.summary_en || "");
      const titleZh = data.title_zh ? normalizeText(data.title_zh) : "";
      const summaryZh = data.summary_zh ? normalizeText(data.summary_zh) : "";

      const needsTitle = !titleZh || !hasSufficientCjk(titleZh);
      const needsSummary = !summaryZh || !hasSufficientCjk(summaryZh);

      let title = locale === "zh" ? (needsTitle ? titleEn : titleZh) : titleEn || titleZh;
      let summary = locale === "zh" ? (needsSummary ? summaryEn : summaryZh) : summaryEn || summaryZh;

      if (locale === "zh" && (needsTitle || needsSummary)) {
        const translated = await translateSingleToZh(titleEn, summaryEn);
        if (translated) {
          if (needsTitle) title = translated.title || title;
          if (needsSummary) summary = translated.summary || summary;
        }
      }

      const titleAlt = locale === "zh" ? titleEn || titleZh : titleZh || titleEn;
      const keyPoints = locale === "zh" ? data.key_points_zh || [] : data.key_points_en || [];
      const lens = locale === "zh" ? data.fxlocus_lens_zh || "" : data.fxlocus_lens_en || "";
      let content =
        locale === "zh"
          ? normalizeText(data.content_zh || "") || normalizeText(data.content_en || "")
          : normalizeText(data.content_en || "") || normalizeText(data.content_zh || "");
      if (!content) {
        content = summary || "";
      }

      return NextResponse.json(
        {
          ok: true,
          article: {
            id: data.id,
            slug: data.slug,
            url: data.url,
            source: source?.name,
            logo: source?.logo_url,
            author: data.author,
            publishedAt: data.published_at,
            category: data.category,
            importance: data.importance,
            sentiment: data.sentiment,
            symbols: data.symbols || [],
            title,
            titleAlt,
            summary,
            coverImage: data.cover_image_url,
            keyPoints,
            lens,
            content,
            views: metrics?.views || 0,
            clicks: metrics?.clicks || 0
          }
        },
        { status: 200 }
      );
    }
  }

  const rssItems = await fetchRssItems({ limit: 200 });
  const match = rssItems.find((item) => buildRssSlug(item) === slug);
  if (!match) return NextResponse.json({ ok: false }, { status: 404 });

  let title = normalizeText(match.title);
  let summary = normalizeText(match.summary || "");

  if (locale === "zh") {
    const translated = await translateSingleToZh(title, summary);
    if (translated) {
      title = translated.title || title;
      summary = translated.summary || summary;
    }
  }

  return NextResponse.json(
    {
      ok: true,
      article: {
        id: match.id,
        slug,
        url: match.link,
        source: match.source,
        logo: "",
        author: "",
        publishedAt: match.publishedAt,
        category: match.category,
        importance: "medium",
        sentiment: "neutral",
        symbols: extractSymbolsHeuristic(`${title} ${summary}`),
        title,
        titleAlt: locale === "zh" ? normalizeText(match.title) : title,
        summary,
        coverImage: null,
        keyPoints: [],
        lens: "RSS-sourced summary for training use only, not investment advice.",
        content: summary,
        views: 0,
        clicks: 0
      }
    },
    { status: 200 }
  );
}
