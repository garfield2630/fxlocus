"use client";

import { useLang } from "@/components/lang-context";

export default function ServicesPage() {
  const { lang } = useLang();

  return (
    <div className="page">
      <h1>{lang === "zh" ? "核心交易体系与服务" : "Core Framework & Offerings"}</h1>
      <p>
        {lang === "zh"
          ? "这里列出的不是传统意义上的‘产品’，而是围绕汇点核心交易体系展开的几个服务形态：系统训练、深度内容与一对一陪跑。"
          : "These are not generic products, but different expressions of the FxLocus core trading framework: structured training, deep content and 1:1 mentoring."}
      </p>

      <div className="cards-grid">
        <div className="card">
          <h3>{lang === "zh" ? "核心交易课程" : "Core Trading Curriculum"}</h3>
          <p>
            {lang === "zh"
              ? "围绕‘心理—认知—K线本质’三条主线设计模块化课程，帮助你从零散技巧走向完整的交易世界观。"
              : "A modular curriculum aligned with psychology, cognition and price‑action, helping you move from scattered tricks to a coherent trading worldview."}
          </p>
        </div>
        <div className="card">
          <h3>{lang === "zh" ? "内容矩阵与社群" : "Content Matrix & Community"}</h3>
          <p>
            {lang === "zh"
              ? "通过文章、视频、直播与作业体系输出思想密度更高的内容，构建一群真正‘以思考为核心’的交易者圈层。"
              : "Articles, videos, live sessions and assignments that form a high‑signal content matrix and a community of thinking‑driven traders."}
          </p>
        </div>
        <div className="card">
          <h3>{lang === "zh" ? "一对一核心辅导" : "1:1 Mentoring"}</h3>
          <p>
            {lang === "zh"
              ? "由首席交易导师亲自进行深度访谈、交易记录拆解与心理侧写，帮助你找到自己的核心交易方式。"
              : "Deep 1:1 sessions with the Chief Trading Mentor to dissect journals, map psychological patterns and shape a trading style that fits you."}
          </p>
        </div>
      </div>
    </div>
  );
}
