"use client";

import React from "react";

export function EconCalendarWidget({ locale }: { locale: "zh" | "en" }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      width: "100%",
      height: 460,
      locale: locale === "zh" ? "zh_CN" : "en",
      importanceFilter: "-1,0,1",
      currencyFilter: "USD,EUR,GBP,JPY,CNY,AUD,CAD,CHF,NZD"
    });

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    container.appendChild(widget);
    container.appendChild(script);

    ref.current.appendChild(container);
  }, [locale]);

  return <div ref={ref} className="max-w-full overflow-hidden" />;
}
