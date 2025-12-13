import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { InsightsExplorer } from "@/components/insights/InsightsExplorer";
import { Link } from "@/i18n/navigation";
import { posts } from "@/lib/mock/posts";
import type { Locale } from "@/lib/mock/types";

type Props = {
  params: { locale: Locale };
};

function pick(locale: Locale, value: { zh: string; en: string }) {
  return locale === "en" ? value.en : value.zh;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("insightsTitle"),
    description: t("insightsDesc")
  };
}

export default async function InsightsPage({ params }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "insights" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const previews = posts.map((post) => ({
    slug: post.slug,
    pillar: post.pillar,
    title: pick(locale, post.title),
    excerpt: pick(locale, post.excerpt),
    readingTime: post.readingTime,
    publishedAt: post.publishedAt,
    tags: post.tags
  }));

  return (
    <div className="space-y-10">
      <header className="pt-6">
        <span className="fx-eyebrow">{tCommon(locale === "en" ? "brandEn" : "brandCn")}</span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          {t("title")}
        </h1>
        <p className="fx-lead">{t("lead")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/framework" className="fx-btn fx-btn-secondary">
            {tCommon("cta.enterFramework")}
          </Link>
          <Link href="/programs" className="fx-btn fx-btn-secondary">
            {tCommon("cta.getStarted")}
          </Link>
        </div>
      </header>

      <InsightsExplorer posts={previews} />
    </div>
  );
}
