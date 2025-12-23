"use client";

import React from "react";

type Props = {
  scriptSrc: string;
  options: Record<string, any>;
  className?: string;
  style?: React.CSSProperties;
  depsKey: string;
  height?: number | string;
};

export function TradingViewWidget({
  scriptSrc,
  options,
  className = "",
  style,
  depsKey,
  height = "100%"
}: Props) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = "";

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.height = typeof height === "number" ? `${height}px` : String(height);
    container.style.width = "100%";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = "100%";
    widget.style.width = "100%";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = scriptSrc;
    script.innerHTML = JSON.stringify(options);

    container.appendChild(widget);
    container.appendChild(script);

    ref.current.appendChild(container);

    return () => {
      if (ref.current) ref.current.innerHTML = "";
    };
  }, [scriptSrc, depsKey]);

  return <div ref={ref} className={className} style={{ ...style, width: "100%" }} />;
}
