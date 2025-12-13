import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { frameworkModules } from "@/lib/mock/framework";
import type { FrameworkModule, Locale, Pillar } from "@/lib/mock/types";

type Props = {
  params: { locale: Locale };
};

function pick(locale: Locale, value: { zh: string; en: string }) {
  return locale === "en" ? value.en : value.zh;
}

function labelKey(pillar: Pillar) {
  if (pillar === "mind") return "mind";
  if (pillar === "market") return "market";
  return "price";
}

function groupByPillar(modules: FrameworkModule[]) {
  const grouped: Record<Pillar, FrameworkModule[]> = { mind: [], market: [], price: [] };
  for (const frameworkModule of modules) grouped[frameworkModule.pillar].push(frameworkModule);
  return grouped;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("frameworkTitle"),
    description: t("frameworkDesc")
  };
}

export default async function FrameworkPage({ params }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "framework" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const grouped = groupByPillar(frameworkModules);

  return (
    <div className="space-y-14 md:space-y-20">
      <header className="pt-6">
        <span className="fx-eyebrow">{tCommon(locale === "en" ? "brandEn" : "brandCn")}</span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          {t("title")}
        </h1>
        <p className="fx-lead">{t("lead")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/programs" variant="primary">
            {t("cta.toPrograms")}
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            {t("cta.bookCall")}
          </ButtonLink>
        </div>
      </header>

      {(
        [
          { pillar: "mind" as const, titleKey: "sections.mindTitle" as const },
          { pillar: "market" as const, titleKey: "sections.marketTitle" as const },
          { pillar: "price" as const, titleKey: "sections.priceTitle" as const }
        ] as const
      ).map((section) => (
        <Section
          key={section.pillar}
          id={section.pillar}
          eyebrow={tCommon(`labels.${labelKey(section.pillar)}` as any)}
          title={t(section.titleKey)}
        >
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {grouped[section.pillar].map((frameworkModule) => {
              const deliverables = (locale === "en" ? frameworkModule.deliverables.en : frameworkModule.deliverables.zh).slice(0, 3);
              const trainingAction = (locale === "en" ? frameworkModule.trainingActions.en : frameworkModule.trainingActions.zh)[0] ?? "";
              return (
                <Card key={frameworkModule.id} className="p-7">
                  <h3 className="text-xl font-semibold text-slate-50">
                    {pick(locale, frameworkModule.title)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-200/70">
                    {pick(locale, frameworkModule.oneLiner)}
                  </p>

                  <div className="mt-6 space-y-4 text-sm text-slate-200/75">
                    <div>
                      <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/60">
                        {tCommon("ui.deliverables")}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {deliverables.map((item) => (
                          <Badge key={item}>{item}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/60">
                        {tCommon("ui.trainingAction")}
                      </div>
                      <p className="mt-2 leading-6">{trainingAction}</p>
                    </div>

                    <Card variant="glass" className="p-4">
                      <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/60">
                        {tCommon("ui.evaluation")}
                      </div>
                      <p className="mt-2 leading-6">{pick(locale, frameworkModule.evaluation)}</p>
                    </Card>
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      ))}

      <Section
        eyebrow={t("sections.loopTitle")}
        title={t("sections.loopTitle")}
        lead={t("loop.lead")}
      >
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(["s1", "s2", "s3", "s4", "s5"] as const).map((key) => (
            <Card key={key} className="p-5 text-sm text-slate-200/80">
              <Badge>{t(`loop.steps.${key}.k`)}</Badge>
              <p className="mt-3 leading-6">{t(`loop.steps.${key}.v`)}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        eyebrow={t("sections.auditTitle")}
        title={t("sections.auditTitle")}
        lead={t("audit.lead")}
      >
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {(["a1", "a2", "a3", "a4"] as const).map((key) => (
            <Card key={key} className="p-7">
              <Badge>{t(`audit.items.${key}.k`)}</Badge>
              <h3 className="mt-4 text-lg font-semibold text-slate-50">
                {t(`audit.items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-200/70">
                {t(`audit.items.${key}.desc`)}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/programs" variant="primary">
            {t("cta.toPrograms")}
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            {t("cta.bookCall")}
          </ButtonLink>
        </div>
      </Section>
    </div>
  );
}
