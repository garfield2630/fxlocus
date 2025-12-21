import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { getDataProvider } from "@/lib/data";
import type { DownloadAsset } from "@/lib/domain/types";

type Props = {
  params: { locale: Locale };
};

function groupByCategory(items: DownloadAsset[]) {
  const grouped: Record<DownloadAsset["category"], DownloadAsset[]> = {
    templates: [],
    system: [],
    tools: []
  };

  for (const item of items) grouped[item.category].push(item);
  return grouped;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "seo" });
  return {
    title: t("downloadsTitle"),
    description: t("downloadsDesc")
  };
}

export default async function DownloadsPage({ params }: Props) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "downloads" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const provider = getDataProvider();
  const downloads = await provider.listDownloads(locale);
  const grouped = groupByCategory(downloads);

  const sections = [
    { key: "templates" as const },
    { key: "system" as const },
    { key: "tools" as const }
  ];

  return (
    <div className="space-y-14 md:space-y-20">
      <header className="pt-6">
        <span className="fx-eyebrow">{tCommon(locale === "en" ? "brandEn" : "brandCn")}</span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
          {t("title")}
        </h1>
        <p className="fx-lead">{t("lead")}</p>
      </header>

      {sections.map((section) => (
        <section key={section.key} className="fx-section">
          <h2 className="fx-h2">{t(`categories.${section.key}`)}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {grouped[section.key].map((asset) => (
              <a
                key={asset.slug}
                href={asset.fileUrl}
                className="fx-card block p-7"
                download
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="fx-pill">{t(`formats.${asset.format}`)}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-50">{asset.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-200/70">{asset.description}</p>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

