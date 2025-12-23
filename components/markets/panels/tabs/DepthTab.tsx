"use client";

import React from "react";

import { useMarket } from "../../context/MarketContext";
import { TradingViewSymbolInfo } from "../../widgets/TradingViewSymbolInfo";

export function DepthTab() {
  const { locale, instrument } = useMarket();

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/85 font-semibold">
          {locale === "zh" ? "盘口与报价（同源）" : "Quote (Same Source)"}
        </div>
        <div className="mt-2 text-xs text-white/50">
          {locale === "zh"
            ? "说明：为保证与图表一致，本区数据来自 TradingView 同一标的（同 feed）。"
            : "Data is sourced from the same TradingView symbol/feed as the chart."}
        </div>
        <div className="mt-3">
          <TradingViewSymbolInfo tvSymbol={instrument.tvSymbol} locale={locale} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/85 font-semibold">
          {locale === "zh" ? "深度说明" : "Depth Note"}
        </div>
        <div className="mt-3 text-sm leading-6 text-white/70">
          {locale === "zh" ? (
            <>
              <p>外汇/贵金属/指数等市场通常无法从公开源获取真实 Level2 五档深度。</p>
              <p>若你未来接入券商/交易所 Level2 数据源，本区可升级为真实五档。</p>
              <p className="mt-2 text-xs text-white/50">
                目前不展示“合成五档”，避免与你图表价格不一致造成误导。
              </p>
            </>
          ) : (
            <>
              <p>True Level2 order book is not available for many OTC markets via public sources.</p>
              <p>This panel can be upgraded once a Level2 data source is integrated.</p>
              <p className="mt-2 text-xs text-white/50">
                We intentionally avoid synthetic depth to prevent mismatched prices.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
