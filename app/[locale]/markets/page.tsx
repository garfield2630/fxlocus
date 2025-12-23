import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MarketsTerminal } from "@/components/markets/MarketsTerminal";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("marketsTitle"),
    description: t("marketsDesc")
  };
}

export default async function MarketsPage({ params }: Props) {
  const locale = params.locale === "en" ? "en" : "zh";
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-12 -mb-20 w-screen">
      <MarketsTerminal locale={locale} />
    </div>
  );
}
