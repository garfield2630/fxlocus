import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

type Props = {
  params: { locale: Locale };
};

export default async function TradeSystemReviewPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "system" });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
          {t("app.pages.review.title")}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200/75 md:text-lg">
          {t("app.pages.review.lead")}
        </p>
      </header>

      <div className="fx-card p-8">
        <p className="text-sm leading-6 text-slate-200/75">{t("app.pages.review.empty")}</p>
      </div>
    </div>
  );
}

