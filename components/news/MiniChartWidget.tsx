"use client";

import React from "react";

export function MiniChartWidget({ symbol, locale }: { symbol: string; locale: "zh" | "en" }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbol,
      width: "100%",
      height: 220,
      locale: locale === "zh" ? "zh_CN" : "en",
      dateRange: "1M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true
    });

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    container.appendChild(widget);
    container.appendChild(script);

    ref.current.appendChild(container);
  }, [symbol, locale]);

  return <div ref={ref} />;
}
