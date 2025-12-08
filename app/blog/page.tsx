"use client";

import { useLang } from "@/components/lang-context";

const mockPosts = [
  {
    id: "trading-psychology",
    date: "2024-01-10",
    titleZh: "当账户回撤时，大脑到底在想什么？",
    titleEn: "What Your Mind Does During Drawdowns",
    summaryZh:
      "从恐惧、报复性交易到麻木与放弃，拆解回撤阶段最常见的心理陷阱，并给出可执行的应对方案。",
    summaryEn:
      "From fear and revenge trading to numbness, this piece dissects common mental traps during drawdowns and offers practical responses." 
  },
  {
    id: "market-cognition",
    date: "2024-02-05",
    titleZh: "价格背后的博弈：如何建立自己的市场认知框架",
    titleEn: "Seeing the Game Behind Price: A Market Cognition Framework",
    summaryZh:
      "用参与者视角重构你对K线和波动的理解，把‘行情’还原成一场多方博弈的结果，而不是孤立的线条。",
    summaryEn:
      "Rebuild your understanding of candles and swings from the perspective of market participants so price becomes the outcome of a game, not isolated lines." 
  },
  {
    id: "price-action-essence",
    date: "2024-03-15",
    titleZh: "抛开形态名称，只用‘力量与位置’读懂K线",
    titleEn: "Reading Candles Through Force and Location",
    summaryZh:
      "不再死记‘锤头线’、‘吞没形态’，而是通过力量大小、方向与所处位置，重新理解每一根K线的含义。",
    summaryEn:
      "Instead of memorising patterns, learn to read each candle through the size, direction and location of underlying buying and selling forces." 
  }
];

export default function BlogPage() {
  const { lang } = useLang();

  return (
    <div className="page">
      <h1>{lang === "zh" ? "思想与市场的交汇" : "Where Thought Meets the Market"}</h1>
      <p>
        {lang === "zh"
          ? "这里是汇点核心交易的内容中枢：围绕交易心理学、市场认知论与K线本质的深度文章与研究。"
          : "This is the content hub of FxLocus: deep pieces on trading psychology, market cognition and the essence of price action."}
      </p>

      <div className="blog-list">
        {mockPosts.map((post) => (
          <article key={post.id} className="blog-item">
            <h2>{lang === "zh" ? post.titleZh : post.titleEn}</h2>
            <p className="blog-date">{post.date}</p>
            <p>{lang === "zh" ? post.summaryZh : post.summaryEn}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
