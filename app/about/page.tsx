"use client";

import { useLang } from "@/components/lang-context";

export default function AboutPage() {
  const { lang } = useLang();

  return (
    <div className="page">
      <h1>
        {lang === "zh"
          ? "关于 FxLocus Trading / 汇点核心交易"
          : "About FxLocus Trading"}
      </h1>
      <p>
        {lang === "zh"
          ? "FxLocus Trading（汇点核心交易）是一套围绕‘交易心理 · 市场认知 · K线本质’打造的核心交易体系品牌。我们更像是一间‘交易思想实验室’，而不是只教技巧的培训机构。"
          : "FxLocus Trading is a trading framework brand built around three pillars: trading psychology, market cognition and the true essence of price action – more of a ‘trading thought lab’ than a pure tactics school."}
      </p>
      <p>
        {lang === "zh"
          ? "品牌的中文名‘汇点核心交易’，强调的是：真正决定交易结果的，不只是进场位置，而是你如何理解市场、如何和自己的情绪共处。"
          : "The name FxLocus reflects a belief that results are driven not just by entries, but by how you understand the market and coexist with your own emotions."}
      </p>

      <h2>{lang === "zh" ? "角色与团队定位" : "Role & Positioning"}</h2>
      <p>
        {lang === "zh"
          ? "我不仅是‘团队长’，更是整个体系的首席交易导师与交易哲学布道者——亲自设计课程结构、训练路径与实战复盘框架。个人理念与品牌世界观深度绑定。"
          : "Beyond running the team, the founder acts as Chief Trading Mentor and a preacher of trading philosophy, personally designing course structures, training paths and review frameworks."}
      </p>

      <h2>{lang === "zh" ? "我们的信念" : "What We Believe"}</h2>
      <ul>
        <li>
          {lang === "zh"
            ? "先认知，后技巧：技术只是载体，真正改变结果的是你对市场与自我的理解。"
            : "Cognition before tactics: techniques are vehicles; lasting change comes from how you view the market and yourself."}
        </li>
        <li>
          {lang === "zh"
            ? "先做人，再做交易：交易桌前的每一个选择，都是性格、习惯与价值观的外化。"
            : "Character before trade: each decision at the desk reflects underlying habits, personality and values."}
        </li>
        <li>
          {lang === "zh"
            ? "体系重于灵感：我们追求的是可复现、可传承的核心交易框架，而不是一时灵感下的‘英雄一单’。"
            : "Systems over inspiration: the goal is a repeatable, teachable core framework, not one‑off hero trades."}
        </li>
      </ul>
    </div>
  );
}
