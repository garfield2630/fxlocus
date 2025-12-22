import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/marketing/PageHero";
import { ToolsCalculators } from "@/components/tools/ToolsCalculators";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/mock/types";

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("toolsTitle"),
    description: t("toolsDesc")
  };
}

export default async function ToolsPage({ params }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "tools" });
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
          { href: "/framework", label: t("hero.cta.primary"), variant: "secondary", locale },
          { href: "/contact", label: t("hero.cta.secondary"), variant: "secondary", locale }
        ]}
        riskNote={t("hero.risk")}
      />

      <section className="fx-section">
        <span className="fx-eyebrow">{t("title")}</span>
        <h2 className="fx-h2">{t("title")}</h2>
        <p className="fx-lead">{t("lead")}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {(
            [
              { key: "position", href: "#position" },
              { key: "rr", href: "#rr" },
              { key: "pip", href: "#pip" }
            ] as const
          ).map((tool) => (
            <a key={tool.key} href={tool.href} className="fx-card p-7">
              <h3 className="mt-5 text-xl font-semibold text-slate-50">
                {t(`${tool.key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-200/70">
                {t(`${tool.key}.note`)}
              </p>
            </a>
          ))}
        </div>
      </section>

      <ToolsCalculators />
    </div>
  );
}
