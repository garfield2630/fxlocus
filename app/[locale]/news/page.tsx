import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/marketing/PageHero";
import type { Locale } from "@/i18n/routing";

type Props = {
  params: { locale: Locale };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("newsTitle"),
    description: t("newsDesc")
  };
}

export default async function NewsPage({ params }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "news" });
  const highlights = t.raw("hero.highlights") as string[];

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        highlights={highlights}
        ctas={[
          { href: "/news", label: t("hero.cta.primary"), variant: "primary", locale },
          { href: "/markets", label: t("hero.cta.secondary"), variant: "secondary", locale }
        ]}
        riskNote={t("hero.risk")}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr_320px]">
        <aside className="space-y-4">
          <div className="fx-card p-6">
            <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
              {t("layout.left.title")}
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-200/70">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {t("layout.left.category")}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {t("layout.left.importance")}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {t("layout.left.time")}
              </div>
            </div>
          </div>
        </aside>

        <section className="fx-card p-6">
          <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
            {t("layout.middle.title")}
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200/70"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="h-3 w-40 rounded-full bg-white/10" />
                  <div className="h-3 w-24 rounded-full bg-white/10" />
                </div>
                <div className="mt-3 h-3 w-11/12 rounded-full bg-white/10" />
                <div className="mt-2 h-3 w-8/12 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="fx-card p-6">
            <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
              {t("layout.right.title")}
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-200/70">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {t("layout.right.hot")}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {t("layout.right.calendar")}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {t("layout.right.recommend")}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
