"use client";

import React from "react";

import { useMarket } from "./context/MarketContext";
import { useFullscreen } from "./hooks/useFullscreen";
import { MarketInfoDock } from "./panels/MarketInfoDock";
import { TradingViewAdvancedChart } from "./widgets/TradingViewAdvancedChart";

export function MarketCenterPanel() {
  const { locale, instrument } = useMarket();
  const fsRef = React.useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle } = useFullscreen(fsRef);

  const [rebuildKey, setRebuildKey] = React.useState("init");

  React.useEffect(() => {
    setRebuildKey(String(Date.now()));
  }, [isFullscreen]);

  return (
    <div ref={fsRef} className="flex h-full min-h-0 flex-col bg-[#050a14]">
      <div className="relative min-h-0 flex-1 border-b border-white/10">
        <button
          onClick={toggle}
          className="absolute right-3 top-3 z-20 rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-white/90 hover:bg-black/65"
          title={
            isFullscreen
              ? locale === "zh"
                ? "退出全屏（ESC）"
                : "Exit fullscreen (ESC)"
              : locale === "zh"
                ? "全屏（ESC退出）"
                : "Fullscreen (ESC to exit)"
          }
        >
          {isFullscreen
            ? locale === "zh"
              ? "退出全屏"
              : "Exit fullscreen"
            : locale === "zh"
              ? "全屏"
              : "Fullscreen"}
        </button>

        <div className="absolute right-24 top-3 z-20 hidden text-xs text-white/50 md:block">
          {locale === "zh" ? "ESC 退出" : "ESC to exit"}
        </div>

        <div className="h-full w-full">
          <TradingViewAdvancedChart
            tvSymbol={instrument.tvSymbol}
            locale={locale}
            rebuildKey={rebuildKey}
          />
        </div>
      </div>

      <div className="h-[320px] min-h-[260px] max-h-[460px] overflow-hidden">
        <MarketInfoDock />
      </div>
    </div>
  );
}
