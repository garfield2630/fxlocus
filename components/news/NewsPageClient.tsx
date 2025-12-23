"use client";

import React from "react";

import { FiltersPanel, type Filters } from "./FiltersPanel";
import { NewsFeed } from "./NewsFeed";
import { RightRail } from "./RightRail";

export function NewsPageClient({ locale }: { locale: "zh" | "en" }) {
  const [filters, setFilters] = React.useState<Filters>({
    category: "all",
    importance: "all",
    range: "today",
    symbol: "",
    q: ""
  });
  const [headerH, setHeaderH] = React.useState(64);

  React.useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const header = document.querySelector("header");
    const main = document.querySelector("main");
    const footer = document.querySelector("footer");
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      mainOverflow: main instanceof HTMLElement ? main.style.overflow : "",
      mainMaxWidth: main instanceof HTMLElement ? main.style.maxWidth : "",
      mainWidth: main instanceof HTMLElement ? main.style.width : "",
      mainMarginLeft: main instanceof HTMLElement ? main.style.marginLeft : "",
      mainMarginRight: main instanceof HTMLElement ? main.style.marginRight : "",
      mainPaddingTop: main instanceof HTMLElement ? main.style.paddingTop : "",
      mainPaddingBottom: main instanceof HTMLElement ? main.style.paddingBottom : "",
      mainPaddingLeft: main instanceof HTMLElement ? main.style.paddingLeft : "",
      mainPaddingRight: main instanceof HTMLElement ? main.style.paddingRight : "",
      mainHeight: main instanceof HTMLElement ? main.style.height : "",
      footerDisplay: footer instanceof HTMLElement ? footer.style.display : ""
    };

    const updateLayout = () => {
      const h = header instanceof HTMLElement ? header.getBoundingClientRect().height : 64;
      setHeaderH(h || 64);
      if (main instanceof HTMLElement) {
        main.style.height = `calc(100vh - ${h || 64}px)`;
      }
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (main instanceof HTMLElement) {
      main.style.overflow = "hidden";
      main.style.maxWidth = "none";
      main.style.width = "100%";
      main.style.marginLeft = "0px";
      main.style.marginRight = "0px";
      main.style.paddingTop = "0px";
      main.style.paddingBottom = "0px";
      main.style.paddingLeft = "0px";
      main.style.paddingRight = "0px";
    }
    if (footer instanceof HTMLElement) {
      footer.style.display = "none";
    }

    updateLayout();
    const ro = header instanceof HTMLElement ? new ResizeObserver(updateLayout) : null;
    if (header instanceof HTMLElement && ro) {
      ro.observe(header);
    }
    window.addEventListener("resize", updateLayout);

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      if (main instanceof HTMLElement) {
        main.style.overflow = prev.mainOverflow;
        main.style.maxWidth = prev.mainMaxWidth;
        main.style.width = prev.mainWidth;
        main.style.marginLeft = prev.mainMarginLeft;
        main.style.marginRight = prev.mainMarginRight;
        main.style.paddingTop = prev.mainPaddingTop;
        main.style.paddingBottom = prev.mainPaddingBottom;
        main.style.paddingLeft = prev.mainPaddingLeft;
        main.style.paddingRight = prev.mainPaddingRight;
        main.style.height = prev.mainHeight;
      }
      if (footer instanceof HTMLElement) {
        footer.style.display = prev.footerDisplay;
      }
      if (ro) ro.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  return (
    <div className="relative w-full overflow-x-hidden">
      <div
        className="w-full min-h-0 px-4 md:px-6"
        style={{ height: `calc(100vh - ${headerH}px)` }}
      >
        <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
          <aside className="hidden min-h-0 lg:block">
            <div className="h-full min-h-0 overflow-y-auto">
              <FiltersPanel locale={locale} value={filters} onChange={setFilters} />
            </div>
          </aside>

            <section className="min-h-0 min-w-0">
              <div className="h-full min-h-0 overflow-y-auto pr-1">
                <NewsFeed locale={locale} filters={filters} />
              </div>
            </section>

          <aside className="hidden min-h-0 lg:block">
            <div className="h-full min-h-0 overflow-y-auto">
              <RightRail locale={locale} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
