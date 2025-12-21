import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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

  return (
    <div className="space-y-14 md:space-y-20">
      <header className="pt-6">
        <span className="fx-eyebrow">{tCommon(locale === "en" ? "brandEn" : "brandCn")}</span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          {t("title")}
        </h1>
        <p className="fx-lead">{t("lead")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/framework" locale={locale} className="fx-btn fx-btn-secondary">
            {tCommon("cta.enterFramework")}
          </Link>
          <Link href="/contact" locale={locale} className="fx-btn fx-btn-secondary">
            {tCommon("cta.bookCall")}
          </Link>
        </div>
      </header>

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
