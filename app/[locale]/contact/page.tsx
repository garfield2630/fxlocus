import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContactForm } from "@/components/contact/ContactForm";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/mock/types";

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("contactTitle"),
    description: t("contactDesc")
  };
}

export default async function ContactPage({ params }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "contact" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tRisk = await getTranslations({ locale, namespace: "risk" });

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

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {(["call", "biz", "apply"] as const).map((key) => (
            <div key={key} className="fx-card p-7">
              <div className="fx-pill">{t(`entry.${key}.title`)}</div>
              <p className="mt-4 text-sm leading-6 text-slate-200/75">{t(`entry.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fx-section">
        <span className="fx-eyebrow">{tCommon("cta.submit")}</span>
        <h2 className="fx-h2">{t("title")}</h2>
        <p className="fx-lead">{t("lead")}</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
          <ContactForm />

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="fx-card p-6">
              <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
                {t("expect.title")}
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-200/75">
                {(["i1", "i2", "i3"] as const).map((k) => (
                  <li key={k} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span>{t(`expect.items.${k}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="fx-card p-6">
              <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
                {tCommon("cta.enterFramework")}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-200/75">{t("expect.ctaLead")}</p>
              <div className="mt-5">
                <Link href="/framework" className="fx-btn fx-btn-secondary">
                  {tCommon("cta.enterFramework")}
                </Link>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-200/60">{tRisk("footer")}</p>
          </aside>
        </div>
      </section>
    </div>
  );
}

