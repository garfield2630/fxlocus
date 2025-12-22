import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TradeSystemLogin } from "@/components/trade-system/TradeSystemLogin";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: { locale: Locale };
  searchParams?: { next?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("systemTitle"),
    description: t("systemDesc")
  };
}

export default async function TradeSystemLoginPage({ searchParams }: Props) {
  return <TradeSystemLogin next={searchParams?.next} />;
}
