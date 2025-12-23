"use client";

import React from "react";

import { Locale } from "../context/MarketContext";
import { TradingViewWidget } from "./TradingViewWidget";

export function TradingViewAdvancedChart({
  tvSymbol,
  locale,
  rebuildKey
}: {
  tvSymbol: string;
  locale: Locale;
  rebuildKey: string;
}) {
  return (
    <TradingViewWidget
      scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
      depsKey={`${tvSymbol}:${locale}:${rebuildKey}`}
      className="h-full w-full"
      options={{
        autosize: true,
        symbol: tvSymbol,
        interval: "60",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: locale === "zh" ? "zh_CN" : "en",
        allow_symbol_change: true,
        save_image: true,
        hide_top_toolbar: false,
        hide_side_toolbar: false,
        enable_publishing: false,
        studies: ["MASimple@tv-basicstudies", "RSI@tv-basicstudies"]
      }}
    />
  );
}
