import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { defaultLocale } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { getDataProvider } from "@/lib/data";
import type { Pillar } from "@/lib/domain/types";
import { renderMarkdown, getTocFromMarkdown } from "@/lib/markdown";

type Props = {
  params: { locale: Locale; slug: string };
};

function labelKey(pillar: Pillar) {
  if (pillar === "mind") return "mind";
  if (pillar === "market") return "market";
  return "price";
}

function extractBullets(markdown: string, heading: string) {
  const lines = markdown.split(/\r?\n/);
  const wanted = `## ${heading}`.trim();

  let inSection = false;
  const bullets: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("## ")) {
      if (line.trim() === wanted) {
        inSection = true;
        continue;
      }
      if (inSection) break;
    }

    if (!inSection) continue;
    const match = /^-\s+(.*)\s*$/.exec(line);
    if (match) bullets.push(match[1]);
  }

  return bullets;
}

export async function generateStaticParams() {
  const provider = getDataProvider();
  const insights = await provider.listInsights(defaultLocale);
  return insights.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const provider = getDataProvider();
  const post = await provider.getInsight(params.locale, params.slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function InsightDetailPage({ params }: Props) {
  const locale = params.locale;
  const provider = getDataProvider();
  const post = await provider.getInsight(locale, params.slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "insights" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const markdown = post.contentMd;
  const html = await renderMarkdown(markdown);
  const toc = getTocFromMarkdown(markdown);

  const checklistHeading = locale === "en" ? "Action checklist" : "可执行清单";
  const falsificationHeading = locale === "en" ? "Falsification & pitfalls" : "证伪标准与误区";
  const checklist = extractBullets(markdown, checklistHeading);
  const falsification = extractBullets(markdown, falsificationHeading);

  const all = await provider.listInsights(locale);
  const related = all
    .filter((p) => p.slug !== post.slug)
    .filter((p) => p.pillar === post.pillar)
    .slice(0, 3)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt
    }));

  return (
    <div className="space-y-12">
      <header className="pt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200/70">
          <span className="fx-pill">{tCommon(`labels.${labelKey(post.pillar)}` as any)}</span>
          <span>
            {t("detail.readingTime")}: {post.readingMinutes ?? 0}
            {tCommon("ui.minutesShort")}
          </span>
          <span>·</span>
          <span>{post.publishedAt ?? ""}</span>
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          {post.title}
        </h1>
        <p className="fx-lead">{post.excerpt}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/insights" locale={locale} className="fx-btn fx-btn-secondary">
            {tCommon("cta.back")}
          </Link>
          <Link href="/framework" locale={locale} className="fx-btn fx-btn-secondary">
            {tCommon("cta.enterFramework")}
          </Link>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <article className="fx-card p-7">
          <div
            className="prose prose-invert max-w-none prose-headings:scroll-mt-28 prose-a:text-sky-300 prose-strong:text-slate-50"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="fx-card p-6">
            <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
              {tCommon("ui.toc")}
            </div>
            <nav className="mt-4 space-y-2 text-sm text-slate-200/70">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={[
                    "block hover:text-slate-50",
                    item.depth === 3 ? "pl-4" : ""
                  ].join(" ")}
                >
                  {item.value}
                </a>
              ))}
            </nav>
          </div>

          {checklist.length ? (
            <div className="fx-card p-6">
              <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
                {t("detail.checklist")}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-200/75">
                {checklist.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {falsification.length ? (
            <div className="fx-card p-6">
              <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
                {t("detail.falsification")}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-200/75">
                {falsification.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      <section className="fx-section">
        <h2 className="fx-h2">{t("detail.related")}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {related.map((p) => (
            <Link key={p.slug} href={`/insights/${p.slug}`} locale={locale} className="fx-card p-6">
              <h3 className="text-base font-semibold text-slate-50">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200/70">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
