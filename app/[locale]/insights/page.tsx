import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/marketing/PageHero";
import { InsightsExplorer } from "@/components/insights/InsightsExplorer";
import { Link } from "@/i18n/navigation";
import { getDataProvider } from "@/lib/data";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: { locale: Locale };
};

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
  const highlights = t.raw("hero.highlights") as string[];

  const provider = getDataProvider();
  const insights = await provider.listInsights(locale);

  const previews = insights.map((post) => ({
    slug: post.slug,
    pillar: post.pillar,
    title: post.title,
    excerpt: post.excerpt,
    readingTime: post.readingMinutes ?? 0,
    publishedAt: post.publishedAt ?? "",
    tags: post.tags
  }));

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow={tCommon(locale === "en" ? "brandEn" : "brandCn")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        highlights={highlights}
        ctas={[
          { href: "/framework", label: t("hero.cta.primary"), variant: "secondary", locale },
          { href: "/programs", label: t("hero.cta.secondary"), variant: "secondary", locale }
        ]}
        riskNote={t("hero.risk")}
      />

      <InsightsExplorer posts={previews} />
    </div>
  );
}
