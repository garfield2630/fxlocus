import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentMatrixTabs } from "@/components/home/ContentMatrixTabs";
import { Hero } from "@/components/home/Hero";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { Link } from "@/i18n/navigation";
import { courses } from "@/lib/mock/courses";
import { homeArtifacts, homeMarketsCoverage, homeTrainingPath, pickLocale } from "@/lib/mock/home";
import { posts } from "@/lib/mock/posts";
import { testimonials } from "@/lib/mock/testimonials";
import type { Locale } from "@/lib/mock/types";
import { videos } from "@/lib/mock/videos";

type Props = {
  params: { locale: Locale };
};

function pick(locale: Locale, value: { zh: string; en: string }) {
  return locale === "en" ? value.en : value.zh;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("homeTitle"),
    description: t("homeDesc")
  };
}

export default async function HomePage({ params }: Props) {
  const locale = params.locale;

  const tHome = await getTranslations({ locale, namespace: "home" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tRisk = await getTranslations({ locale, namespace: "risk" });

  const articlePreviews = posts.slice(0, 4).map((post) => ({
    slug: post.slug,
    pillar: post.pillar,
    title: pick(locale, post.title),
    excerpt: pick(locale, post.excerpt),
    readingTime: post.readingTime,
    publishedAt: post.publishedAt
  }));

  const videoPreviews = videos.slice(0, 3).map((video) => ({
    id: video.id,
    pillar: video.pillar,
    title: pick(locale, video.title),
    excerpt: pick(locale, video.excerpt),
    durationMinutes: video.durationMinutes,
    publishedAt: video.publishedAt
  }));

  const coursePreviews = courses.slice(0, 3).map((course) => ({
    id: course.id,
    tier: course.tier,
    title: pick(locale, course.title),
    lead: pick(locale, course.lead)
  }));

  const pathSteps = ["s1", "s2", "s3", "s4", "s5"] as const;
  const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"] as const;

  return (
    <div className="space-y-16 md:space-y-24">
      <Hero />

      <Section
        id="home-content"
        className="scroll-mt-24"
        eyebrow={tHome("realPath.eyebrow")}
        title={tHome("realPath.title")}
        lead={tHome("realPath.lead")}
      >
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {homeTrainingPath.map((step, index) => {
            const deliverables = pickLocale(locale, step.deliverables);
            return (
              <Card key={step.key} className="p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge>
                    {tCommon("ui.step")} {index + 1}
                  </Badge>
                  <span className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
                    {step.key.toUpperCase()}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-semibold text-slate-50">
                  {pickLocale(locale, step.title)}
                </h3>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="space-y-4 md:col-span-2">
                    <div>
                      <div className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
                        {tCommon("ui.trainingAction")}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-100/85">
                        {pickLocale(locale, step.trainingAction)}
                      </p>
                    </div>

                    <div>
                      <div className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
                        {tCommon("ui.deliverables")}
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-slate-200/75">
                        {deliverables.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Card variant="glass" className="p-5">
                    <div className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
                      {tCommon("ui.evaluation")}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-100/85">
                      {pickLocale(locale, step.evaluation)}
                    </p>
                  </Card>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section
        eyebrow={tHome("artifacts.eyebrow")}
        title={tHome("artifacts.title")}
        lead={tHome("artifacts.lead")}
      >
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {homeArtifacts.map((artifact) => {
            const snippets = pickLocale(locale, artifact.snippets);
            return (
              <Card key={artifact.key} className="p-6">
                <h3 className="text-base font-semibold text-slate-50">
                  {pickLocale(locale, artifact.title)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-200/70">
                  {pickLocale(locale, artifact.purpose)}
                </p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="space-y-2 font-mono text-xs text-slate-200/75">
                    {snippets.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section
        eyebrow={tHome("markets.eyebrow")}
        title={tHome("markets.title")}
        lead={tHome("markets.lead")}
      >
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {homeMarketsCoverage.map((market) => {
            const pitfalls = pickLocale(locale, market.pitfalls);
            const focus = pickLocale(locale, market.focus);
            return (
              <Card key={market.key} className="p-7">
                <div className="flex items-center justify-between gap-3">
                  <Badge>{pickLocale(locale, market.title)}</Badge>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
                      {tHome("markets.labels.pitfalls")}
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200/75">
                      {pitfalls.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
                      {tHome("markets.labels.focus")}
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200/75">
                      {focus.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Card variant="glass" className="mt-6 p-5">
                  <div className="text-xs font-semibold tracking-[0.14em] text-slate-200/60">
                    {tHome("markets.labels.scenario")}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-100/85">
                    {pickLocale(locale, market.scenario)}
                  </p>
                </Card>
              </Card>
            );
          })}
        </div>
      </Section>

      <section className="fx-section">
        <span className="fx-eyebrow">{tHome("pillars.eyebrow")}</span>
        <h2 className="fx-h2">{tHome("pillars.title")}</h2>
        <p className="fx-lead">{tHome("pillars.lead")}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {(
            [
              { key: "mind" as const, labelKey: "labels.mind" as const },
              { key: "market" as const, labelKey: "labels.market" as const },
              { key: "price" as const, labelKey: "labels.price" as const }
            ] as const
          ).map((pillar) => (
            <Card key={pillar.key} className="flex flex-col p-7">
              <Badge>{tCommon(pillar.labelKey)}</Badge>
              <h3 className="mt-5 text-xl font-semibold text-slate-50">
                {tHome(`pillars.${pillar.key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-200/70">
                {tHome(`pillars.${pillar.key}.def`)}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-slate-200/75">
                {(["p1", "p2", "p3"] as const).map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span>{tHome(`pillars.${pillar.key}.${p}`)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link href={`/framework#${pillar.key}`} className="text-sm font-semibold text-sky-400">
                  {tHome("pillars.cta")}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="fx-section">
        <span className="fx-eyebrow">{tHome("path.eyebrow")}</span>
        <h2 className="fx-h2">{tHome("path.title")}</h2>
        <p className="fx-lead">{tHome("path.lead")}</p>

        <div className="mt-10 grid gap-4">
          {pathSteps.map((stepKey, index) => {
            const deliver = tHome.raw(`path.steps.${stepKey}.deliver`) as string[];
            return (
              <Card key={stepKey} className="p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="md:max-w-3xl">
                    <Badge>
                      {tCommon("ui.step")} {index + 1}
                    </Badge>
                    <h3 className="mt-4 text-xl font-semibold text-slate-50">
                      {tHome(`path.steps.${stepKey}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-200/70">
                      {tHome(`path.steps.${stepKey}.do`)}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {deliver.map((item) => (
                        <Badge key={item}>{item}</Badge>
                      ))}
                    </div>
                  </div>

                  <Card variant="glass" className="p-5 md:w-72">
                    <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
                      {tCommon("ui.metric")}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-100/85">
                      {tHome(`path.steps.${stepKey}.metric`)}
                    </p>
                  </Card>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8">
          <ButtonLink href="/programs" variant="secondary">
            {tHome("path.cta")}
          </ButtonLink>
        </div>
      </section>

      <section className="fx-section">
        <span className="fx-eyebrow">{tHome("matrix.eyebrow")}</span>
        <h2 className="fx-h2">{tHome("matrix.title")}</h2>
        <p className="fx-lead">{tHome("matrix.lead")}</p>
        <ContentMatrixTabs articles={articlePreviews} videos={videoPreviews} courses={coursePreviews} />
      </section>

      <section className="fx-section">
        <span className="fx-eyebrow">{tHome("tools.eyebrow")}</span>
        <h2 className="fx-h2">{tHome("tools.title")}</h2>
        <p className="fx-lead">{tHome("tools.lead")}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {(["position", "rr", "pip"] as const).map((key) => (
            <Card key={key} className="p-7">
              <h3 className="mt-5 text-xl font-semibold text-slate-50">
                {tHome(`tools.cards.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-200/70">
                {tHome(`tools.cards.${key}.desc`)}
              </p>
              <div className="mt-6 text-3xl font-semibold tracking-tight text-slate-50">
                {key === "position" ? "1.25" : key === "rr" ? "2.0R" : "+$120"}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <ButtonLink href="/tools" variant="secondary">
            {tHome("tools.cta")}
          </ButtonLink>
        </div>
      </section>

      <section className="fx-section">
        <span className="fx-eyebrow">{tHome("proof.eyebrow")}</span>
        <h2 className="fx-h2">{tHome("proof.title")}</h2>
        <p className="fx-lead">{tHome("proof.lead")}</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {testimonials.map((item) => (
            <Card key={item.id} className="p-7">
              <div className="text-xs font-semibold tracking-[0.14em] text-slate-200/70">
                {pick(locale, item.role)} · {item.market}
              </div>
              <p className="mt-4 text-lg font-semibold leading-7 text-slate-50">
                “{pick(locale, item.quote)}”
              </p>
              <div className="mt-5 grid gap-3 text-sm text-slate-200/75 md:grid-cols-2">
                <Card variant="glass" className="p-4">
                  <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/60">
                    {tCommon("ui.before")}
                  </div>
                  <p className="mt-2 leading-6">{pick(locale, item.before)}</p>
                </Card>
                <Card variant="glass" className="p-4">
                  <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/60">
                    {tCommon("ui.after")}
                  </div>
                  <p className="mt-2 leading-6">{pick(locale, item.after)}</p>
                </Card>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <ButtonLink href="/insights" variant="secondary">
            {tHome("proof.cta")}
          </ButtonLink>
        </div>
      </section>

      <section className="fx-section">
        <span className="fx-eyebrow">{tHome("faq.eyebrow")}</span>
        <h2 className="fx-h2">{tHome("faq.title")}</h2>
        <p className="fx-lead">{tHome("faq.lead")}</p>

        <div className="mt-10 space-y-3">
          {faqKeys.map((key) => (
            <Card as="details" key={key} className="p-6" open={key === "q1"}>
              <summary className="cursor-pointer text-sm font-semibold text-slate-50">
                {tHome(`faq.items.${key}.q`)}
              </summary>
              <div className="mt-4 space-y-4 text-sm leading-6 text-slate-200/75">
                <p>{tHome(`faq.items.${key}.a`)}</p>
                <Link href="/framework" className="inline-flex text-sm font-semibold text-sky-400">
                  {tCommon("cta.enterFramework")}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="fx-section">
        <Card className="p-10 md:p-12">
          <span className="fx-eyebrow">{tHome("hero.eyebrow")}</span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
            {tHome("finalCta.title")}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200/75 md:text-lg">
            {tHome("finalCta.lead")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/framework" variant="primary">
              {tHome("finalCta.primary")}
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              {tHome("finalCta.secondary")}
            </ButtonLink>
          </div>
          <p className="mt-8 text-xs leading-5 text-slate-200/60">{tRisk("footer")}</p>
        </Card>
      </section>
    </div>
  );
}
