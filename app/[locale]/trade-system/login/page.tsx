import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MockLoginForm } from "@/components/trade-system/MockLoginForm";
import { Link } from "@/i18n/navigation";
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

export default async function TradeSystemLoginPage({ params, searchParams }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "system" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="space-y-10">
      <header className="pt-6">
        <span className="fx-eyebrow">{tCommon(locale === "en" ? "brandEn" : "brandCn")}</span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          {t("mockAuth.title")}
        </h1>
        <p className="fx-lead">{t("mockAuth.lead")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/trade-system" locale={locale} className="fx-btn fx-btn-secondary">
            {tCommon("cta.back")}
          </Link>
        </div>
      </header>

      <MockLoginForm next={searchParams?.next} />
    </div>
  );
}
