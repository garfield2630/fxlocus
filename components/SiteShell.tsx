"use client";

import { ReactNode } from "react";
import { LangProvider, useLang } from "@/components/lang-context";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SplashIntro } from "@/components/SplashIntro";
import { AnimatedKlineBackground } from "@/components/AnimatedKlineBackground";

function Header() {
  const { lang } = useLang();
  const isZh = lang === "zh";

  return (
    <header className="site-header">
      <div className="container header-content">
        <div className="logo">
          <img src="/favicon.svg" alt="FxLocus logo" className="logo-icon" />
          <div className="logo-text">
            <span>FxLocus Trading</span>
            <span className="logo-sub">{isZh ? "汇点核心交易" : "Core Trading"}</span>
          </div>
        </div>
        <nav className="nav">
          <a href="/">{isZh ? "首页" : "Home"}</a>
          <a href="/about">{isZh ? "关于体系" : "About"}</a>
          <a href="/services">{isZh ? "课程与服务" : "Framework"}</a>
          <a href="/blog">{isZh ? "思想文章" : "Articles"}</a>
          <a href="/donate">{isZh ? "捐赠" : "Donate"}</a>
          <div className="nav-dropdown">
            <span className="nav-dropdown-label">{isZh ? "系统" : "Systems"}</span>
            <div className="nav-dropdown-menu">
              <a href="/trade-system">{isZh ? "交易系统" : "Trading System"}</a>
            </div>
          </div>
          <a href="/contact">{isZh ? "联系咨询" : "Contact"}</a>
        </nav>
        <LanguageToggle />
      </div>
    </header>
  );
}

function Footer() {
  const { lang } = useLang();
  const isZh = lang === "zh";
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <p>© {year} FxLocus Trading</p>
        <p className="footer-disclaimer">
          {isZh
            ? "风险提示：金融交易（包括但不限于外汇、差价合约等）具有高风险，可能导致全部投资损失。请务必确认自身风险承受能力，如有需要请咨询独立的专业意见。"
            : "Risk warning: Financial trading (including but not limited to FX and CFDs) involves high risk and may result in the loss of all invested capital. Assess your risk tolerance and seek independent professional advice if needed."}
        </p>
      </div>
    </footer>
  );
}

type Props = {
  children: ReactNode;
};

export function SiteShell({ children }: Props) {
  return (
    <LangProvider>
      <div className="site-root">
        <div className="site-bg-layer">
          <AnimatedKlineBackground />
        </div>
        <SplashIntro />
        <Header />
        <main className="site-main">
          <div className="container">{children}</div>
        </main>
        <Footer />
      </div>
    </LangProvider>
  );
}
