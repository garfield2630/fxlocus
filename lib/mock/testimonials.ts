import type { Testimonial } from "./types";

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    role: { zh: "匿名｜外汇交易 3 年", en: "Anonymous | FX trader (3 years)" },
    market: "FX",
    before: {
      zh: "纪律不稳定，连续亏损后容易加仓追回。",
      en: "Discipline was unstable—sizing up after consecutive losses."
    },
    after: {
      zh: "建立交易前检查表与亏损冷却协议，违规次数明显下降。",
      en: "Built a pre-trade gate and post-loss cooldown; violations dropped."
    },
    quote: {
      zh: "从“想赢回来”变成“先按规则把过程跑对”。",
      en: "Shifted from “winning it back” to “running the process correctly.”"
    }
  },
  {
    id: "t2",
    role: { zh: "匿名｜黄金 XAUUSD", en: "Anonymous | Gold (XAUUSD)" },
    market: "Gold",
    before: {
      zh: "止损随意、经常被扫后情绪化反向。",
      en: "Stops were arbitrary; getting swept led to emotional reversals."
    },
    after: {
      zh: "用“结构证伪点”放止损，退出更规则化。",
      en: "Placed stops at structural falsification; exits became rule-based."
    },
    quote: {
      zh: "我开始能解释“为什么错”，而不是只说“又被扫”。",
      en: "I can explain why it failed—not just that it got swept."
    }
  },
  {
    id: "t3",
    role: { zh: "匿名｜指数 US500/GER40", en: "Anonymous | Indices (US500/GER40)" },
    market: "Indices",
    before: {
      zh: "看很多指标，进出场理由不一致。",
      en: "Too many indicators; entry/exit logic wasn’t consistent."
    },
    after: {
      zh: "用阶段识别+多周期对齐表，减少无结构交易。",
      en: "Used regime identification + MTF alignment; fewer unstructured trades."
    },
    quote: {
      zh: "策略没变，但我对市场的解释变稳定了。",
      en: "The tactic didn’t change—my interpretation became stable."
    }
  },
  {
    id: "t4",
    role: { zh: "匿名｜加密 BTC/ETH", en: "Anonymous | Crypto (BTC/ETH)" },
    market: "Crypto",
    before: {
      zh: "波动大时用同一套仓位与止损，经常被波动洗掉。",
      en: "Used one set of size/stops in high vol—often shaken out."
    },
    after: {
      zh: "做了波动分层与参数调整规则，仓位更一致。",
      en: "Created volatility tiers and parameter rules; sizing became consistent."
    },
    quote: {
      zh: "我终于把“风险环境”当成参数，而不是情绪。",
      en: "I treat risk context as a parameter—not a feeling."
    }
  },
  {
    id: "t5",
    role: { zh: "匿名｜外汇（EURUSD/GBPUSD）", en: "Anonymous | FX (EURUSD/GBPUSD)" },
    market: "FX",
    before: {
      zh: "每周缺少复盘，错误反复出现。",
      en: "No weekly review—same errors kept repeating."
    },
    after: {
      zh: "开始输出周复盘报告与错误分类表，同类错误复发下降。",
      en: "Produced weekly reports and error taxonomy; recurrence declined."
    },
    quote: {
      zh: "复盘不是总结，是下周行动的设计。",
      en: "Review isn’t reflection—it’s next week’s design."
    }
  },
  {
    id: "t6",
    role: { zh: "匿名｜多资产（FX+Gold）", en: "Anonymous | Multi-asset (FX + Gold)" },
    market: "Multi",
    before: {
      zh: "遇到连赢容易自信膨胀，规则松动。",
      en: "Winning streaks led to overconfidence and looser rules."
    },
    after: {
      zh: "加入执行评分卡与红线，连赢后也按流程走。",
      en: "Added a scorecard and hard limits; kept the process after wins."
    },
    quote: {
      zh: "稳定性来自“限制自己”，不是“相信自己”。",
      en: "Stability comes from constraints—not self-belief."
    }
  }
];

