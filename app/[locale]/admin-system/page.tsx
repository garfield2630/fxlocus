import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tSeo = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: tSeo("systemTitle"),
    description: tSeo("systemDesc")
  };
}

export default async function AdminSystemPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "adminSystem" });

  return (
    <div className="space-y-14 md:space-y-20">
      <header className="pt-6">
        <span className="fx-eyebrow">ADMIN</span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          {t("title")}
        </h1>
        <p className="fx-lead">{t("lead")}</p>
      </header>

      <section className="fx-card p-7">
        <h2 className="text-xl font-semibold text-slate-50">{t("sections.overviewTitle")}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-200/75">{t("sections.overviewBody")}</p>
      </section>

      <section className="fx-card p-7">
        <h2 className="text-xl font-semibold text-slate-50">{t("sections.accessTitle")}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-200/75">{t("sections.accessBody")}</p>
      </section>
    </div>
  );
}

