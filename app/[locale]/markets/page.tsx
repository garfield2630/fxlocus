import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MarketCenterPanel } from "@/components/markets/MarketCenterPanel";
import { InstrumentSidebar } from "@/components/markets/InstrumentSidebar";
import { PaperTradeSidebar } from "@/components/markets/PaperTradeSidebar";
import { ThreePanelTerminal } from "@/components/terminal/ThreePanelTerminal";
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

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-12 -mb-20 w-screen">
      <ThreePanelTerminal
        left={<InstrumentSidebar />}
        center={<MarketCenterPanel />}
        right={<PaperTradeSidebar />}
        labels={{
          title: t("terminal.title"),
          tagline: t("terminal.tagline"),
          left: {
            expand: t("terminal.left.expand"),
            collapse: t("terminal.left.collapse"),
            handle: t("terminal.left.handle"),
            edge: t("terminal.left.edge")
          },
          right: {
            expand: t("terminal.right.expand"),
            collapse: t("terminal.right.collapse"),
            handle: t("terminal.right.handle"),
            edge: t("terminal.right.edge")
          }
        }}
      />
    </div>
  );
}
