"use client";

import { useLang } from "@/components/lang-context";
import { AnimatedKlineBackground } from "@/components/AnimatedKlineBackground";

export default function HomePage() {
  const { lang } = useLang();
  const isZh = lang === "zh";

  return (
    <div className="home home-hero-rich">
      <div className="hero-bg-layer">
        <AnimatedKlineBackground />
      </div>
      <section className="hero hero-split">
        <div className="hero-text hero-left-block">
          <div className="hero-eyebrow">FxLocus · 汇点核心交易</div>
          <div className="hero-title-stack">
            <span className="hero-title-main">
              {isZh ? "交易，从心出发" : "Where Mind Meets the Market"}
            </span>
            <span className="hero-title-sub">
              {isZh ? "聚焦核心" : "Focus on the core"}
            </span>
          </div>
          <p className="hero-desc">
            {isZh
              ? "围绕交易心理、市场认知与K线本质，搭建一套面向真实交易者的核心交易体系。"
              : "We build a core trading framework rooted in psychology, market cognition and the essence of price action."}
          </p>
          <div className="hero-bullets">
            <div className="hero-bullet-row">
              <span className="hero-bullet-marker">•</span>
              <span>
                {isZh
                  ? "交易心理 · 市场认知 · K线本质"
                  : "Trading psychology · Market cognition · Price action"}
              </span>
            </div>
            <div className="hero-bullet-row">
              <span className="hero-highlight">
                {isZh ? "首席交易导师" : "Chief trading mentor"}
              </span>
              <span className="hero-bullet-text">
                {isZh
                  ? " 亲自搭建训练路径与实战复盘体系。"
                  : " personally designs the training path and live review loop."}
              </span>
            </div>
            <div className="hero-bullet-row hero-bullet-secondary">
              <span>
                {isZh
                  ? "不只教怎么做交易，更重构你对市场和自我的理解。"
                  : "Beyond tactics, we reshape how you understand the market and yourself."}
              </span>
            </div>
          </div>
          <div className="hero-actions hero-actions-strong">
            <a href="/services" className="btn btn-primary hero-btn-main">
              {isZh ? "进入核心交易体系" : "Enter the core framework"}
            </a>
            <a href="/contact" className="btn btn-outline hero-btn-secondary">
              {isZh ? "预约一对一交流" : "Book a one to one session"}
            </a>
          </div>
        </div>

        <div className="hero-panel hero-right-block">
          <div className="hero-orb-wrap">
            <div className="hero-orb-glow" />
            <div className="hero-orb-core">
              <div className="hero-orb-lens">
                <div className="hero-orb-lens-inner" />
                <img
                  src="/hero-brain-kline.svg"
                  alt={isZh ? "神经网络与K线" : "Neural network and price candles"}
                  className="hero-brain-graphic"
                />
              </div>
              <div className="hero-orb-brand">
                <div className="hero-orb-line" />
                <div className="hero-orb-title">FXLOCUS</div>
                <div className="hero-orb-tag">MIND · MARKET</div>
              </div>
            </div>
          </div>
          <div className="hero-metrics">
            <div className="metric-card">
              <div className="metric-label">
                {isZh ? "心理训练模块" : "Mindset modules"}
              </div>
              <div className="metric-value">4</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">
                {isZh ? "市场认知章节" : "Cognition chapters"}
              </div>
              <div className="metric-value">6</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">
                {isZh ? "K线本质课" : "Price action labs"}
              </div>
              <div className="metric-value">3</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt section-pillar">
        <h2>{isZh ? "品牌核心三角" : "Brand core triangle"}</h2>
        <div className="cards-grid">
          <div className="card card-pillar">
            <h3>{isZh ? "交易心理" : "Trading psychology"}</h3>
            <p>
              {isZh
                ? "从情绪管理、行为惯性到自我叙事，帮助你在剧烈波动中保持稳定而清醒的执行。"
                : "From emotions and habits to self narrative, helping you keep execution steady when volatility is high."}
            </p>
          </div>
          <div className="card card-pillar">
            <h3>{isZh ? "市场认知" : "Market cognition"}</h3>
            <p>
              {isZh
                ? "拆解宏观叙事、资金结构与参与者动机，看见价格背后的对投博弈。"
                : "Decompose macro context, flows and motives so you see the game behind price, not just the chart."}
            </p>
          </div>
          <div className="card card-pillar">
            <h3>{isZh ? "K线本质解读" : "Price action essence"}</h3>
            <p>
              {isZh
                ? "用力量与位置的视角阅读K线，让每一根K线回到市场行为本身。"
                : "Read candles through the lens of force and location so each bar reflects real market behaviour."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
