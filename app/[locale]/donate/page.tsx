import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { DonateClient } from "@/components/donate/DonateClient";

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("donateTitle"),
    description: t("donateDesc")
  };
}

export default function DonatePage() {
  return <DonateClient />;
}

