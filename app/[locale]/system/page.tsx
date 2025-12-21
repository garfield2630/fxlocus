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
    title: t("systemTitle"),
    description: t("systemDesc")
  };
}

export default async function SystemPage({ params }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "system" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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
        <span className="fx-eyebrow">{t("title")}</span>
        <h2 className="fx-h2">{t("title")}</h2>
        <p className="fx-lead">{t("lead")}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {(["log", "review", "score", "notes"] as const).map((key) => (
            <div key={key} className="fx-card p-7">
              <h3 className="text-xl font-semibold text-slate-50">{t(`features.${key}`)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-200/70">{t(`featureDesc.${key}`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fx-section">
        <div className="fx-card p-10 md:p-12">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
            {t("auth.title")}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200/75 md:text-lg">
            {t("auth.lead")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" locale={locale} className="fx-btn fx-btn-primary">
              {t("auth.signIn")}
            </Link>
            <Link href="/contact" locale={locale} className="fx-btn fx-btn-secondary">
              {t("auth.signUp")}
            </Link>
          </div>

          {!hasSupabase ? (
            <p className="mt-6 text-sm leading-6 text-slate-200/70">{t("auth.hint")}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
