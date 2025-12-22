import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/marketing/PageHero";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/mock/types";

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("aboutTitle"),
    description: t("aboutDesc")
  };
}

export default async function AboutPage({ params }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "about" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const highlights = t.raw("hero.highlights") as string[];

  return (
    <div className="space-y-14 md:space-y-20">
      <PageHero
        eyebrow={tCommon(locale === "en" ? "brandEn" : "brandCn")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        highlights={highlights}
        ctas={[
          { href: "/framework", label: t("hero.cta.primary"), variant: "primary", locale },
          { href: "/contact", label: t("hero.cta.secondary"), variant: "secondary", locale }
        ]}
        riskNote={t("hero.risk")}
      />

      <section className="fx-section">
        <span className="fx-eyebrow">{t("sections.stanceTitle")}</span>
        <h2 className="fx-h2">{t("sections.stanceTitle")}</h2>
        <p className="fx-lead">{t("sections.stanceBody")}</p>
      </section>

      <section className="fx-section">
        <span className="fx-eyebrow">{t("sections.methodTitle")}</span>
        <h2 className="fx-h2">{t("sections.methodTitle")}</h2>
        <p className="fx-lead">{t("sections.methodBody")}</p>
      </section>

      <section className="fx-section">
        <div className="fx-card p-10 md:p-12">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200/75 md:text-lg">
            {t("lead")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/framework" locale={locale} className="fx-btn fx-btn-primary">
              {t("cta.toFramework")}
            </Link>
            <Link href="/contact" locale={locale} className="fx-btn fx-btn-secondary">
              {t("cta.bookCall")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
