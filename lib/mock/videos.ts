import type { Video } from "./types";

export const videos: Video[] = [
  {
    id: "v1",
    pillar: "mind",
    title: {
      zh: "交易前检查：把冲动关在门外（3分钟版）",
      en: "Pre-trade gate in 3 minutes"
    },
    excerpt: {
      zh: "用一个短流程降低临场发挥：检查、红线、风险一致性。",
      en: "A short routine to reduce improvisation: gate, guardrails, consistent risk."
    },
    durationMinutes: 8,
    publishedAt: "2024-04-18"
  },
  {
    id: "v2",
    pillar: "market",
    title: {
      zh: "阶段识别：趋势/震荡/转折的结构标准",
      en: "Regimes: trend, range, transition"
    },
    excerpt: {
      zh: "同一策略在不同阶段表现不同。先识别，再表达。",
      en: "The same tactic behaves differently across regimes. Identify first, then express."
    },
    durationMinutes: 12,
    publishedAt: "2024-05-03"
  },
  {
    id: "v3",
    pillar: "price",
    title: {
      zh: "证伪点怎么写：让退出变得规则化",
      en: "Writing falsification points"
    },
    excerpt: {
      zh: "把退出从“扛单/希望”变成“规则/证据”。",
      en: "Turn exits from hope into rules and evidence."
    },
    durationMinutes: 10,
    publishedAt: "2024-05-22"
  }
];

