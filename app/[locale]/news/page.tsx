import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/marketing/PageHero";
import { NewsWorkspace } from "@/components/news/NewsWorkspace";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("newsTitle"),
    description: t("newsDesc")
  };
}

export default async function NewsPage({ params }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "news" });
  const highlights = t.raw("hero.highlights") as string[];

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        highlights={highlights}
        ctas={[
          { href: "/news", label: t("hero.cta.primary"), variant: "primary", locale },
          { href: "/markets", label: t("hero.cta.secondary"), variant: "secondary", locale }
        ]}
        riskNote={t("hero.risk")}
      />
      <NewsWorkspace />
    </div>
  );
}
