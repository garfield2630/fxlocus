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
    title: t("marketsTitle"),
    description: t("marketsDesc")
  };
}

export default async function MarketsPage({ params }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "markets" });
  const highlights = t.raw("hero.highlights") as string[];

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        highlights={highlights}
        ctas={[
          { href: "/markets", label: t("hero.cta.primary"), variant: "primary", locale },
          { href: "/news", label: t("hero.cta.secondary"), variant: "secondary", locale }
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
                {t("layout.left.search")}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {t("layout.left.categories")}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {t("layout.left.watchlist")}
              </div>
            </div>
          </div>
        </aside>

        <section className="fx-card p-6">
          <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
            {t("layout.middle.title")}
          </div>
          <div className="mt-4 flex aspect-[16/10] w-full items-center justify-center rounded-3xl border border-white/10 bg-slate-950/40 text-sm text-slate-200/60">
            {t("layout.middle.chart")}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="fx-card p-6">
            <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/70">
              {t("layout.right.title")}
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-200/70">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {t("layout.right.paper")}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {t("layout.right.risk")}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
