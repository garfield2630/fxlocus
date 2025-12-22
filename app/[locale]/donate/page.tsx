import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DonateClient } from "@/components/donate/DonateClient";
import { PageHero } from "@/components/marketing/PageHero";
import type { Locale } from "@/i18n/routing";

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

export default async function DonatePage({ params }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "donate" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const highlights = t.raw("hero.highlights") as string[];

  return (
    <div className="space-y-12 md:space-y-16">
      <PageHero
        eyebrow={tCommon(locale === "en" ? "brandEn" : "brandCn")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        highlights={highlights}
        ctas={[
          { href: "#apply", label: t("hero.cta.primary"), variant: "primary", locale },
          { href: "/programs", label: t("hero.cta.secondary"), variant: "secondary", locale }
        ]}
        riskNote={t("hero.risk")}
      />
      <div id="apply" className="scroll-mt-24">
        <DonateClient />
      </div>
    </div>
  );
}

