import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { renderMarkdown, getTocFromMarkdown } from "@/lib/markdown";
import { posts } from "@/lib/mock/posts";
import type { Locale } from "@/lib/mock/types";

type Props = {
  params: { locale: Locale; slug: string };
};

function pick(locale: Locale, value: { zh: string; en: string }) {
  return locale === "en" ? value.en : value.zh;
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

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return {};

  const title = pick(params.locale, post.title);
  const description = pick(params.locale, post.excerpt);

  return { title, description };
}

export default async function InsightDetailPage({ params }: Props) {
  const locale = params.locale;
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "insights" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const markdown = pick(locale, post.contentMd);
  const html = await renderMarkdown(markdown);
  const toc = getTocFromMarkdown(markdown);

  const checklistHeading = locale === "en" ? "Action checklist" : "可执行清单";
  const falsificationHeading = locale === "en" ? "Falsification & pitfalls" : "证伪标准与误区";
  const checklist = extractBullets(markdown, checklistHeading);
  const falsification = extractBullets(markdown, falsificationHeading);

  const related = posts
    .filter((p) => p.slug !== post.slug)
    .filter((p) => p.pillar === post.pillar)
    .slice(0, 3)
    .map((p) => ({
      slug: p.slug,
      title: pick(locale, p.title),
      excerpt: pick(locale, p.excerpt)
    }));

  return (
    <div className="space-y-12">
      <header className="pt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200/70">
          <span className="fx-pill">{tCommon(`labels.${post.pillar}` as any)}</span>
          <span>
            {t("detail.readingTime")}: {post.readingTime}
            {tCommon("ui.minutesShort")}
          </span>
          <span>·</span>
          <span>{post.publishedAt}</span>
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          {pick(locale, post.title)}
        </h1>
        <p className="fx-lead">{pick(locale, post.excerpt)}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/insights" className="fx-btn fx-btn-secondary">
            {tCommon("cta.back")}
          </Link>
          <Link href="/framework" className="fx-btn fx-btn-secondary">
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
            <Link key={p.slug} href={`/insights/${p.slug}`} className="fx-card p-6">
              <h3 className="text-base font-semibold text-slate-50">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200/70">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
