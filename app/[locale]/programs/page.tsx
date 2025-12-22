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
    title: t("programsTitle"),
    description: t("programsDesc")
  };
}

export default async function ProgramsPage({ params }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "programs" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const tiers = ["course", "camp", "audit"] as const;
  const flowSteps = t.raw("flow.steps") as string[];
  const highlights = t.raw("hero.highlights") as string[];

  return (
    <div className="space-y-14 md:space-y-20">
      <PageHero
        eyebrow={tCommon(locale === "en" ? "brandEn" : "brandCn")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        highlights={highlights}
        ctas={[
          { href: "/contact", label: t("hero.cta.primary"), variant: "primary", locale },
          { href: "/framework", label: t("hero.cta.secondary"), variant: "secondary", locale }
        ]}
        riskNote={t("hero.risk")}
      />

      <section className="fx-section">
        <span className="fx-eyebrow">{tCommon("cta.getStarted")}</span>
        <h2 className="fx-h2">{t("title")}</h2>
        <p className="fx-lead">{t("lead")}</p>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => {
            const deliver = t.raw(`tiers.${tier}.deliver`) as string[];
            return (
              <div key={tier} className="fx-card flex flex-col p-7">
                <div className="fx-pill">{tCommon(`tiers.${tier}` as any)}</div>
                <h3 className="mt-5 text-xl font-semibold text-slate-50">
                  {t(`tiers.${tier}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-200/70">
                  {t(`tiers.${tier}.lead`)}
                </p>

                {tier === "course" ? (
                  <div className="mt-5 space-y-2 text-sm text-slate-200/75">
                    <div className="fx-glass p-4">{t(`tiers.${tier}.for`)}</div>
                    <div className="fx-glass p-4">{t(`tiers.${tier}.notFor`)}</div>
                  </div>
                ) : null}

                <div className="mt-6">
                  <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/60">
                    {tCommon("ui.deliverables")}
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200/75">
                    {deliver.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link href="/contact" locale={locale} className="fx-btn fx-btn-secondary">
                    {t(`tiers.${tier}.cta`)}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="fx-section">
        <span className="fx-eyebrow">{t("flow.title")}</span>
        <h2 className="fx-h2">{t("flow.title")}</h2>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {flowSteps.map((step, index) => (
            <div key={step} className="fx-card p-6">
              <div className="fx-pill">
                {tCommon("ui.step")} {index + 1}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-200/75">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fx-section">
        <span className="fx-eyebrow">{t("faqTitle")}</span>
        <h2 className="fx-h2">{t("faqTitle")}</h2>
        <p className="fx-lead">{t("faqLead")}</p>

        <div className="mt-10 space-y-3">
          {(["q1", "q2", "q3", "q4", "q5"] as const).map((key) => (
            <details key={key} className="fx-card p-6" open={key === "q1"}>
              <summary className="cursor-pointer text-sm font-semibold text-slate-50">
                {t(`faq.items.${key}.q`)}
              </summary>
              <div className="mt-4 text-sm leading-6 text-slate-200/75">
                <p>{t(`faq.items.${key}.a`)}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/contact" locale={locale} className="fx-btn fx-btn-primary">
            {tCommon("cta.bookCall")}
          </Link>
        </div>
      </section>
    </div>
  );
}
