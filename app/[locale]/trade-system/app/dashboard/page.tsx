import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

type Props = {
  params: { locale: Locale };
};

export default async function TradeSystemDashboardPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "system" });

  const cards = ["status", "streak", "risk", "next"] as const;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
          {t("app.pages.dashboard.title")}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200/75 md:text-lg">
          {t("app.pages.dashboard.lead")}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((key) => (
          <div key={key} className="fx-card p-7">
            <div className="text-xs font-semibold tracking-[0.16em] text-slate-200/60">
              {t(`app.pages.dashboard.cards.${key}.k`)}
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-50">
              {t(`app.pages.dashboard.cards.${key}.v`)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

