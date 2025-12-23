import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NewsPageClient } from "@/components/news/NewsPageClient";
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
  const locale = params.locale === "en" ? "en" : "zh";
  return <NewsPageClient locale={locale} />;
}
