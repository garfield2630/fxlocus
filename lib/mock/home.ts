import type { Locale } from "@/lib/mock/types";

type Localized<T> = {
  zh: T;
  en: T;
};

export type TrainingPathStep = {
  key: "market" | "mind" | "price" | "execution" | "review";
  title: Localized<string>;
  trainingAction: Localized<string>;
  deliverables: Localized<string[]>;
  evaluation: Localized<string>;
};

export type ArtifactPreview = {
  key:
    | "preTradeChecklist"
    | "postLossProtocol"
    | "weeklyBreakdown"
    | "consistencyScorecard"
    | "falsificationCard"
    | "volatilityContextTable";
  title: Localized<string>;
  purpose: Localized<string>;
  snippets: Localized<string[]>;
};

export type MarketCoverageCard = {
  key: "fx" | "gold" | "indices" | "crypto";
  title: Localized<string>;
  pitfalls: Localized<string[]>;
  focus: Localized<string[]>;
  scenario: Localized<string>;
};

export const homeTrainingPath: TrainingPathStep[] = [
  {
    key: "market",
    title: { zh: "Training Path 01 · Market", en: "Training Path 01 · Market" },
    trainingAction: {
      zh: "每周输出一次结构拆解：阶段、叙事、关键位置与风险边界。",
      en: "Publish one weekly breakdown: regime, narrative, key locations, and risk boundaries."
    },
    deliverables: {
      zh: ["周结构报告模板", "阶段识别清单（趋势/震荡/转折）", "关键位置标注规则"],
      en: ["Weekly breakdown template", "Regime checklist (trend/range/transition)", "Location marking rules"]
    },
    evaluation: {
      zh: "能否用同一框架解释 EURUSD / XAUUSD / US500 / BTC 的“阶段与边界”。",
      en: "Can you explain EURUSD/XAUUSD/US500/BTC with one consistent regime + boundary lens?"
    }
  },
  {
    key: "mind",
    title: { zh: "Training Path 02 · Mind", en: "Training Path 02 · Mind" },
    trainingAction: {
      zh: "用交易前检查表做“执行闸门”，并记录两周触发器（FOMO/报复/确认偏误/无聊交易）。",
      en: "Run a pre-trade gate and log triggers for two weeks (FOMO/revenge/confirmation bias/boredom)."
    },
    deliverables: {
      zh: ["交易前检查表（通用版本）", "红线规则清单", "触发器→行为映射表"],
      en: ["Pre-trade checklist (universal)", "Hard limits list", "Trigger → behavior map"]
    },
    evaluation: {
      zh: "触发发生后能否延迟执行 ≥ 3 分钟，并按检查表行动？",
      en: "Can you delay action by 3 minutes and follow the checklist when triggered?"
    }
  },
  {
    key: "price",
    title: { zh: "Training Path 03 · Price Action", en: "Training Path 03 · Price Action" },
    trainingAction: {
      zh: "每笔交易把理由写成三件事：力量 / 位置 / 证伪点；并记录示例截图。",
      en: "Write every trade as three items: force, location, and falsification; attach a screenshot sample."
    },
    deliverables: {
      zh: ["读图 SOP（推进/回撤评分）", "证伪规则卡", "示例截图模板"],
      en: ["Reading SOP (impulse/pullback scoring)", "Falsification card", "Screenshot template"]
    },
    evaluation: {
      zh: "止损是否放在结构证伪点；退出是否规则化、可复盘。",
      en: "Are stops at structural falsification points, and are exits rule-based and reviewable?"
    }
  },
  {
    key: "execution",
    title: { zh: "Training Path 04 · Execution", en: "Training Path 04 · Execution" },
    trainingAction: {
      zh: "把风控参数写成可执行规则，并记录每笔决策（含执行偏差）。",
      en: "Turn risk parameters into explicit rules and log every decision (including deviations)."
    },
    deliverables: {
      zh: ["参数表（仓位/止损/频率）", "执行评分卡（0–100）", "错误分类表"],
      en: ["Parameter sheet (size/stop/frequency)", "Execution scorecard (0–100)", "Error taxonomy"]
    },
    evaluation: {
      zh: "评分卡上升且波动收敛；违规次数趋势下降。",
      en: "Does the score improve with lower variance, while violations trend down?"
    }
  },
  {
    key: "review",
    title: { zh: "Training Path 05 · Review", en: "Training Path 05 · Review" },
    trainingAction: {
      zh: "每周输出复盘报告：证据链、错误类型、修正动作与下周节奏。",
      en: "Publish a weekly review: evidence, error types, corrective actions, and next week’s cadence."
    },
    deliverables: {
      zh: ["周复盘报告模板", "错误复发追踪表", "修正动作清单"],
      en: ["Weekly review template", "Recurrence tracker", "Corrective action list"]
    },
    evaluation: {
      zh: "同类错误复发率是否下降？复盘是否能驱动下一周行动？",
      en: "Does recurrence decline, and does review produce actionable next-week changes?"
    }
  }
];

export const homeArtifacts: ArtifactPreview[] = [
  {
    key: "preTradeChecklist",
    title: { zh: "Pre-trade checklist", en: "Pre-trade checklist" },
    purpose: {
      zh: "把冲动关在门外：先过闸门，再做表达。",
      en: "Keep impulse out: pass the gate before you express an entry."
    },
    snippets: {
      zh: ["品种：____（EURUSD / XAUUSD / US500 / BTC）", "阶段：趋势 / 震荡 / 转折", "证伪点：结构失效位置 = ____"],
      en: ["Instrument: ____ (EURUSD / XAUUSD / US500 / BTC)", "Regime: trend / range / transition", "Falsification: structural invalidation = ____"]
    }
  },
  {
    key: "postLossProtocol",
    title: { zh: "Post-loss protocol", en: "Post-loss protocol" },
    purpose: {
      zh: "亏损不可怕，第二次错误才贵：冷却 + 限频 + 复盘。",
      en: "Loss is fine. The second mistake is expensive: cool down, cap frequency, review."
    },
    snippets: {
      zh: ["冷却期：____ 分钟（至少 30）", "当日最大笔数：____", "复盘输出：错误类型 + 修正动作"],
      en: ["Cooldown: ____ minutes (min 30)", "Max trades today: ____", "Review output: error type + corrective action"]
    }
  },
  {
    key: "weeklyBreakdown",
    title: { zh: "Weekly breakdown", en: "Weekly breakdown" },
    purpose: {
      zh: "稳定认知：把“新闻”写成结构影响，而不是情绪判断。",
      en: "Stabilize perception: write news as structural impact, not feelings."
    },
    snippets: {
      zh: ["叙事：央行/数据/风险偏好 → ____", "关键位置：HTF 枢纽 = ____", "本周边界：上/下证伪 = ____ / ____"],
      en: ["Narrative: CB/data/risk appetite → ____", "Key locations: HTF pivots = ____", "Weekly bounds: up/down invalidation = ____ / ____"]
    }
  },
  {
    key: "consistencyScorecard",
    title: { zh: "Consistency scorecard", en: "Consistency scorecard" },
    purpose: {
      zh: "一致性不是感觉：让执行可审计、可迭代。",
      en: "Consistency needs a scorecard: auditable execution that can iterate."
    },
    snippets: {
      zh: ["执行一致性：____ / 100", "风控合规：____ / 100", "复盘质量：____ / 100"],
      en: ["Execution consistency: ____ / 100", "Risk compliance: ____ / 100", "Review quality: ____ / 100"]
    }
  },
  {
    key: "falsificationCard",
    title: { zh: "Falsification card", en: "Falsification card" },
    purpose: {
      zh: "证伪把你从希望拉回概率：先定义失败，再谈表达。",
      en: "Falsification pulls you from hope back to probability: define failure first."
    },
    snippets: {
      zh: ["失败条件：结构破坏 = ____", "退出规则：时间/价格/行为 = ____", "是否扛单：禁止"],
      en: ["Failure condition: structure break = ____", "Exit rule: time/price/behavior = ____", "Holding & hoping: prohibited"]
    }
  },
  {
    key: "volatilityContextTable",
    title: { zh: "Volatility context table", en: "Volatility context table" },
    purpose: {
      zh: "一套参数跑所有市场会坏：波动决定仓位与止损宽度。",
      en: "One-size-fits-all breaks: volatility sets size and stop width."
    },
    snippets: {
      zh: ["波动分层：低 / 中 / 高", "参数调整：止损×____；仓位×____", "警戒线：触发 → 减仓/停手"],
      en: ["Volatility tier: low / mid / high", "Parameter shift: stop ×____; size ×____", "Guardrail: trigger → reduce risk / stop"]
    }
  }
];

export const homeMarketsCoverage: MarketCoverageCard[] = [
  {
    key: "fx",
    title: { zh: "FX", en: "FX" },
    pitfalls: {
      zh: ["追逐波动，缺少结构边界", "把“新闻”当信号，不写结构影响"],
      en: ["Chasing volatility without boundaries", "Treating news as signals instead of structural impact"]
    },
    focus: {
      zh: ["阶段识别 + 关键位置", "止损放在结构证伪点"],
      en: ["Regime + key locations", "Stops at structural falsification points"]
    },
    scenario: {
      zh: "EURUSD 数据公布后：流动性扫荡 vs 叙事转向。",
      en: "EURUSD after data: liquidity sweep vs narrative shift."
    }
  },
  {
    key: "gold",
    title: { zh: "Gold", en: "Gold" },
    pitfalls: {
      zh: ["用过紧止损硬扛波动环境", "忽略关键时段（FOMC/数据）引发的波动切换"],
      en: ["Using tight stops in high-volatility regimes", "Ignoring event-driven regime shifts (FOMC/data)"]
    },
    focus: {
      zh: ["波动分层 + 参数调整规则", "枢纽附近表达，不在中间随机做单"],
      en: ["Volatility tiers + parameter rules", "Express near pivots, not in the middle"]
    },
    scenario: {
      zh: "XAUUSD 事件周：边界先定，再谈表达方式。",
      en: "XAUUSD event week: define bounds first, then choose an entry expression."
    }
  },
  {
    key: "indices",
    title: { zh: "Indices", en: "Indices" },
    pitfalls: {
      zh: ["指标堆叠，进出场理由不一致", "震荡中频繁追价，缺少限频规则"],
      en: ["Indicator stacking with inconsistent reasons", "Overtrading ranges without frequency caps"]
    },
    focus: {
      zh: ["多周期对齐（HTF 边界 / LTF 表达）", "参与者与风险偏好叙事"],
      en: ["Multi-timeframe alignment (HTF bounds / LTF execution)", "Participants and risk appetite narrative"]
    },
    scenario: {
      zh: "US500 开盘缺口：转折 vs 回撤，按规则处理冲突。",
      en: "US500 gap open: transition vs pullback—resolve conflicts by rule."
    }
  },
  {
    key: "crypto",
    title: { zh: "Crypto", en: "Crypto" },
    pitfalls: {
      zh: ["用外汇参数做加密，风险被放大", "忽略周末流动性变化导致滑点与假突破"],
      en: ["Using FX parameters for crypto volatility", "Ignoring weekend liquidity shifts and false breaks"]
    },
    focus: {
      zh: ["波动环境优先：仓位与止损随层级调整", "证伪规则卡：失败就走"],
      en: ["Volatility-first sizing and stops", "Falsification card: exit on failure"]
    },
    scenario: {
      zh: "BTC 结构破坏后回抽：证伪点明确，再决定表达。",
      en: "BTC after structure break: define falsification, then express the retest."
    }
  }
];

export function pickLocale<T>(locale: Locale, value: Localized<T>): T {
  return locale === "en" ? value.en : value.zh;
}

