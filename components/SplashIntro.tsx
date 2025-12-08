"use client";

import { useEffect, useState } from "react";
import { useLang } from "./lang-context";

export function SplashIntro() {
  const { lang } = useLang();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const seen = window.localStorage.getItem("fxlocus-splash-seen");
    if (seen === "1") {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      window.localStorage.setItem("fxlocus-splash-seen", "1");
      setVisible(false);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const handleClose = () => {
    window.localStorage.setItem("fxlocus-splash-seen", "1");
    setVisible(false);
  };

  const slogan =
    lang === "zh" ? "交易，从心出发，聚焦核心。" : "Where Mind Meets the Market.";

  return (
    <div className="intro-overlay" onClick={handleClose}>
      <div className="intro-inner">
        <div className="intro-logo-row">
          <span className="intro-mark" />
          <span className="intro-brand-main">FxLocus</span>
          <span className="intro-brand-sub">TRADING</span>
        </div>
        <div className="intro-accent-line">
          <span className="intro-dot" />
          <span className="intro-bar" />
        </div>
        <div className="intro-progress">
          <div className="intro-progress-bar" />
        </div>
        <div className="intro-tagline">{slogan}</div>
      </div>
    </div>
  );
}
