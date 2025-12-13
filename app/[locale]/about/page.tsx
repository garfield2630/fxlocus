import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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

  return (
    <div className="space-y-14 md:space-y-20">
      <header className="pt-6">
        <span className="fx-eyebrow">{tCommon(locale === "en" ? "brandEn" : "brandCn")}</span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          {t("title")}
        </h1>
        <p className="fx-lead">{t("lead")}</p>
      </header>

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
            <Link href="/framework" className="fx-btn fx-btn-primary">
              {t("cta.toFramework")}
            </Link>
            <Link href="/contact" className="fx-btn fx-btn-secondary">
              {t("cta.bookCall")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

