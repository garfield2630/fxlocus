import type { FrameworkModule } from "./types";

export const frameworkModules: FrameworkModule[] = [
  {
    id: "mind-triggers",
    pillar: "mind",
    title: {
      zh: "触发器识别：冲动从哪里来",
      en: "Trigger mapping"
    },
    oneLiner: {
      zh: "把“情绪触发”从交易决策链路中拆出来，先看见，才可能控制。",
      en: "Separate emotional triggers from the decision chain before you try to fix execution."
    },
    trainingActions: {
      zh: [
        "连续两周记录：每次下单前的情绪、身体信号、外部刺激",
        "标注触发类别：FOMO、报复、确认偏误、无聊交易"
      ],
      en: [
        "Log pre-trade state for two weeks: emotion, bodily cues, external stimuli",
        "Label trigger types: FOMO, revenge, confirmation bias, boredom"
      ]
    },
    deliverables: {
      zh: ["触发器清单", "情绪标注表", "触发→行为映射图"],
      en: ["Trigger list", "Emotion log", "Trigger → behavior map"]
    },
    evaluation: {
      zh: "触发发生后能否延迟执行 ≥ 3 分钟，并按检查表行动",
      en: "Can you delay action by 3 minutes and follow the checklist?"
    }
  },
  {
    id: "mind-pretrade-checklist",
    pillar: "mind",
    title: {
      zh: "交易前检查表：把冲动关在门外",
      en: "Pre-trade checklist"
    },
    oneLiner: {
      zh: "减少“临场发挥”，用规则把冲动关在门外。",
      en: "Reduce improvisation by forcing a pre-trade gate."
    },
    trainingActions: {
      zh: ["为每笔交易执行检查表并记录结果", "建立红线清单：触发即取消/减仓/停手"],
      en: [
        "Run the checklist gate on every trade and record pass/fail",
        "Define hard limits that force cancel/size-down/stop"
      ]
    },
    deliverables: {
      zh: ["检查表（外汇/黄金/指数/加密通用版本）", "红线清单"],
      en: ["Checklist (FX/Gold/Indices/Crypto)", "Hard limits list"]
    },
    evaluation: {
      zh: "违规次数趋势下降；每笔都有检查记录",
      en: "Violations trend down; each trade has a recorded gate."
    }
  },
  {
    id: "mind-postloss-protocol",
    pillar: "mind",
    title: {
      zh: "亏损后协议：冷却与复盘",
      en: "Post-loss protocol"
    },
    oneLiner: {
      zh: "亏损不可怕，可怕的是亏损后的第二次错误。",
      en: "Loss is fine. The second mistake is expensive."
    },
    trainingActions: {
      zh: ["亏损后强制冷却期（计时/禁单）", "使用复盘模板写清证据链与错误类型", "限制频率：设定当日上限与恢复条件"],
      en: [
        "Enforce a cooldown timer after losses (no trades)",
        "Write a review using a template: evidence chain and error type",
        "Limit frequency with daily caps and re-entry conditions"
      ]
    },
    deliverables: {
      zh: ["冷却协议卡", "亏损后复盘模板", "频率限制规则"],
      en: ["Cooldown protocol", "Post-loss review template", "Frequency limits"]
    },
    evaluation: {
      zh: "亏损后“报复性交易”次数下降",
      en: "Revenge trades decline over time."
    }
  },
  {
    id: "mind-consistency",
    pillar: "mind",
    title: {
      zh: "执行一致性训练：评分卡",
      en: "Consistency scorecard"
    },
    oneLiner: {
      zh: "你不需要更聪明，你需要更一致。",
      en: "You don’t need to be smarter—you need to be more consistent."
    },
    trainingActions: {
      zh: ["为每笔交易打分（0–100）：检查表、风控、证据链、出场纪律", "每周汇总违规分类，并给出一个可执行的修正动作"],
      en: [
        "Score each trade (0–100): gate, risk, evidence, exit discipline",
        "Review weekly violations and define one corrective action"
      ]
    },
    deliverables: {
      zh: ["执行评分卡（0–100）", "违规分类表"],
      en: ["Execution scorecard (0–100)", "Violation taxonomy"]
    },
    evaluation: {
      zh: "评分卡上升且波动收敛",
      en: "Scores improve and variance narrows."
    }
  },
  {
    id: "mind-risk-tolerance",
    pillar: "mind",
    title: {
      zh: "风险耐受与仓位纪律",
      en: "Risk tolerance"
    },
    oneLiner: {
      zh: "风险不是数字，是你在压力下能否保持规则。",
      en: "Risk isn’t a number. It’s behavior under stress."
    },
    trainingActions: {
      zh: ["定义单笔风险上限与最大回撤警戒线", "触发警戒线时执行减仓/停手，并记录原因与恢复条件"],
      en: [
        "Define max risk per trade and drawdown alert lines",
        "When triggered, size-down/stop and record criteria to resume"
      ]
    },
    deliverables: {
      zh: ["单笔风险上限", "最大回撤警戒线", "减仓规则"],
      en: ["Per-trade risk cap", "Drawdown alert lines", "Size-down rules"]
    },
    evaluation: {
      zh: "达到警戒线时能否执行减仓/停手",
      en: "Do you execute size-down/stop when alert lines trigger?"
    }
  },
  {
    id: "mind-overtrading",
    pillar: "mind",
    title: {
      zh: "过度交易治理：节奏与窗口",
      en: "Overtrading control"
    },
    oneLiner: {
      zh: "过度交易通常不是“机会多”，而是缺乏结构与节奏。",
      en: "Overtrading is often a lack of structure, not a lack of opportunities."
    },
    trainingActions: {
      zh: ["定义交易窗口与非交易清单（何时不交易）", "记录无结构交易的触发原因，并设置硬性约束"],
      en: [
        "Define trading windows and a non-trading list (when not to trade)",
        "Log unstructured trades and add hard constraints"
      ]
    },
    deliverables: {
      zh: ["交易窗口定义", "非交易清单", "节奏表"],
      en: ["Trading windows", "Non-trading list", "Cadence table"]
    },
    evaluation: {
      zh: "无结构交易减少；交易频率与质量相关性提升",
      en: "Unstructured trades decline; frequency aligns with quality."
    }
  },

  {
    id: "market-regimes",
    pillar: "market",
    title: {
      zh: "市场阶段识别（趋势/震荡/转折）",
      en: "Regime identification"
    },
    oneLiner: {
      zh: "同一策略在不同阶段表现不同，先识别阶段再决定表达。",
      en: "The same tactic behaves differently across regimes. Identify first."
    },
    trainingActions: {
      zh: ["用同一清单对 EURUSD / XAUUSD / US500 / BTC 做阶段判定", "多周期对照：高周期定边界，小周期做表达"],
      en: [
        "Use one checklist to classify EURUSD / XAUUSD / US500 / BTC",
        "Align timeframes: higher TF sets bounds; lower TF expresses execution"
      ]
    },
    deliverables: {
      zh: ["阶段判定清单（趋势/震荡/转折）", "多周期对照表"],
      en: ["Regime checklist (trend/range/transition)", "Multi-timeframe table"]
    },
    evaluation: {
      zh: "能否用同一标准对 EURUSD / XAUUSD / US500 / BTC 做阶段判定",
      en: "Can you classify EURUSD / XAUUSD / US500 / BTC with one standard?"
    }
  },
  {
    id: "market-narrative",
    pillar: "market",
    title: {
      zh: "参与者与叙事：把新闻写成结构影响",
      en: "Participants & narrative"
    },
    oneLiner: {
      zh: "价格背后是行为与约束：谁在买、谁在卖、他们为什么必须行动。",
      en: "Write “news” as structural impact, not feelings."
    },
    trainingActions: {
      zh: ["用模板记录央行/数据/风险偏好事件，并写出结构影响", "复盘叙事变化与关键位置/流动性之间的关系"],
      en: [
        "Log events (CB/data/risk) and write structural impact",
        "Review narrative shifts against locations and liquidity"
      ]
    },
    deliverables: {
      zh: ["叙事笔记模板", "关键事件记录框架（央行/数据/风险偏好）"],
      en: ["Narrative notes template", "Event log (CB/data/risk)"]
    },
    evaluation: {
      zh: "是否能把“新闻”写成“结构影响”而不是情绪判断",
      en: "Can you translate “news” into structure rather than sentiment?"
    }
  },
  {
    id: "market-liquidity-location",
    pillar: "market",
    title: {
      zh: "流动性与关键位置",
      en: "Liquidity & locations"
    },
    oneLiner: {
      zh: "位置决定风险边界：你在哪儿错，错在哪里。",
      en: "Location defines risk boundaries."
    },
    trainingActions: {
      zh: ["标注关键位置与潜在流动性区，并记录“扫荡行为”", "每笔交易写清止损理由：结构证伪点，而非随意距离"],
      en: [
        "Mark key locations and potential liquidity zones; log sweeps",
        "Write stop placement as structural falsification, not arbitrary distance"
      ]
    },
    deliverables: {
      zh: ["关键位置标注法", "流动性扫荡观察表"],
      en: ["Location marking SOP", "Liquidity sweep log"]
    },
    evaluation: {
      zh: "止损是否放在“结构证伪点”，而非随意距离",
      en: "Are stops placed at falsification points rather than arbitrary distance?"
    }
  },
  {
    id: "market-mtf-alignment",
    pillar: "market",
    title: {
      zh: "多周期一致性（HTF/LTF 对齐）",
      en: "Multi-timeframe alignment"
    },
    oneLiner: {
      zh: "大周期决定“方向与边界”，小周期决定“表达与执行”。",
      en: "Higher TF defines bounds; lower TF expresses execution."
    },
    trainingActions: {
      zh: ["用 HTF/LTF 对齐表判断一致/冲突，并写出处理结论", "冲突时按规则减仓或放弃，并记录原因"],
      en: [
        "Use an HTF/LTF table to decide alignment vs conflict",
        "When conflicted, size-down or pass by rule—and log why"
      ]
    },
    deliverables: {
      zh: ["HTF/LTF 对齐表", "冲突处理规则"],
      en: ["HTF/LTF alignment table", "Conflict handling rules"]
    },
    evaluation: {
      zh: "冲突时是否按规则减仓或放弃",
      en: "Do you size-down or pass when timeframes conflict?"
    }
  },
  {
    id: "market-volatility-context",
    pillar: "market",
    title: {
      zh: "波动与风险环境",
      en: "Volatility context"
    },
    oneLiner: {
      zh: "波动决定“仓位与止损宽度”，不是用同一参数跑所有市场。",
      en: "Volatility sets parameters. One-size-fits-all breaks."
    },
    trainingActions: {
      zh: ["做波动分层（低/中/高），为每层写参数调整规则", "对比 XAUUSD 与 BTC：止损、仓位与管理如何变化"],
      en: [
        "Build a low/medium/high volatility map and parameter rules",
        "Contrast XAUUSD vs BTC: how stops, size, and management change"
      ]
    },
    deliverables: {
      zh: ["波动分层表（低/中/高）", "参数调整规则"],
      en: ["Volatility tiers (low/med/high)", "Parameter adjustment rules"]
    },
    evaluation: {
      zh: "不同资产（XAUUSD vs BTC）参数能否合理变化",
      en: "Do parameters adapt across assets (XAUUSD vs BTC) rationally?"
    }
  },
  {
    id: "market-weekly-breakdown",
    pillar: "market",
    title: {
      zh: "周结构拆解（Weekly breakdown）",
      en: "Weekly breakdown"
    },
    oneLiner: {
      zh: "每周一份结构报告，训练“框架稳定性”。",
      en: "One weekly report trains stable perception."
    },
    trainingActions: {
      zh: ["每周输出结构报告：叙事、阶段、关键位置、风险环境", "复盘执行记录：是否与周结构一致"],
      en: [
        "Publish one report weekly: narrative, regime, locations, risk context",
        "Review execution logs against the weekly structure"
      ]
    },
    deliverables: {
      zh: ["周结构报告模板（FX/Gold/Indices/Crypto）"],
      en: ["Weekly report template (FX/Gold/Indices/Crypto)"]
    },
    evaluation: {
      zh: "是否能持续输出并形成可复用笔记库",
      en: "Can you produce consistently and build a reusable note library?"
    }
  },

  {
    id: "price-impulse-pullback",
    pillar: "price",
    title: {
      zh: "力量：推进与回撤质量",
      en: "Impulse vs pullback"
    },
    oneLiner: {
      zh: "看“推进的质量”和“回撤的性质”，而不是背形态名字。",
      en: "Score impulse and pullback quality—don’t memorize patterns."
    },
    trainingActions: {
      zh: ["用评分表给推进/回撤打分，并按截图模板归档案例", "把入场理由写成：力量 / 位置 / 证伪"],
      en: [
        "Score impulse/pullback and archive examples with screenshots",
        "Write entry rationale as: force / location / falsification"
      ]
    },
    deliverables: {
      zh: ["推进/回撤评分表", "示例图库（截图模板）"],
      en: ["Impulse/pullback score sheet", "Example gallery (screenshot template)"]
    },
    evaluation: {
      zh: "入场理由能否写成“力量/位置/证伪”三件事",
      en: "Can your rationale be written as force/location/falsification?"
    }
  },
  {
    id: "price-pivots-boundaries",
    pillar: "price",
    title: {
      zh: "位置：结构枢纽与边界",
      en: "Pivots & boundaries"
    },
    oneLiner: {
      zh: "结构枢纽决定你该“等待”还是“表达”。",
      en: "Trade near boundaries, not in the middle of nowhere."
    },
    trainingActions: {
      zh: ["用 SOP 标注枢纽与边界，并写清边界的风险含义", "统计交易是否集中在结构边界附近"],
      en: [
        "Mark pivots/boundaries with an SOP and define their risk meaning",
        "Measure whether trades cluster near boundaries"
      ]
    },
    deliverables: {
      zh: ["枢纽标注 SOP", "边界定义卡"],
      en: ["Pivot marking SOP", "Boundary definition card"]
    },
    evaluation: {
      zh: "交易是否集中在结构边界附近而非随机区域",
      en: "Do trades cluster near boundaries rather than random zones?"
    }
  },
  {
    id: "price-falsification",
    pillar: "price",
    title: {
      zh: "失败形态与证伪",
      en: "Failure & falsification"
    },
    oneLiner: {
      zh: "证伪让你从“希望”回到“概率”。",
      en: "Falsification pulls you from hope back to probability."
    },
    trainingActions: {
      zh: ["为常见失败形态建立规则卡与案例库（多资产）", "每笔交易预先写证伪点与退出规则"],
      en: [
        "Build a failure library with rule cards across assets",
        "Write falsification points and exit rules before entry"
      ]
    },
    deliverables: {
      zh: ["证伪规则卡", "失败形态库（外汇/黄金/指数/加密示例）"],
      en: ["Falsification card", "Failure library (FX/Gold/Indices/Crypto)"]
    },
    evaluation: {
      zh: "是否有规则化退出，而不是扛单",
      en: "Do you exit by rule instead of holding by emotion?"
    }
  },
  {
    id: "price-transition",
    pillar: "price",
    title: {
      zh: "结构转折：从趋势到转折",
      en: "Transition"
    },
    oneLiner: {
      zh: "转折不是“一个信号”，是结构行为的组合。",
      en: "Transitions are behavioral sequences, not single signals."
    },
    trainingActions: {
      zh: ["用观察表记录转折序列：推进失败→重测→反向推进", "训练确认与延迟进入规则，避免“猜顶/猜底”"],
      en: [
        "Log transition sequences: failed push → retest → reversal push",
        "Use confirmation/delay rules to avoid guessing tops/bottoms"
      ]
    },
    deliverables: {
      zh: ["转折观察表", "确认与延迟进入规则"],
      en: ["Transition log", "Confirmation & delayed-entry rules"]
    },
    evaluation: {
      zh: "是否能区分“回撤”与“转折”",
      en: "Can you distinguish pullback vs transition?"
    }
  },
  {
    id: "price-entry-expression",
    pillar: "price",
    title: {
      zh: "进场表达",
      en: "Entry expression"
    },
    oneLiner: {
      zh: "进场是表达，不是预测。先定义失败点，再决定表达方式。",
      en: "Entries are expressions. Define failure first."
    },
    trainingActions: {
      zh: ["用表格选择表达方式：限价/市价/分批，并写条件清单", "让表达方式与风险环境匹配（波动/流动性/位置）"],
      en: [
        "Select expression type (limit/market/scale-in) with conditions",
        "Match expression to risk context (volatility/liquidity/location)"
      ]
    },
    deliverables: {
      zh: ["表达方式选择表（限价/市价/分批）", "条件清单"],
      en: ["Expression selector (limit/market/scale-in)", "Condition checklist"]
    },
    evaluation: {
      zh: "表达方式是否与风险环境匹配",
      en: "Does expression match risk context?"
    }
  },
  {
    id: "price-exits-management",
    pillar: "price",
    title: {
      zh: "出场与管理",
      en: "Exits & management"
    },
    oneLiner: {
      zh: "出场是纪律的集中体现：该走就走。",
      en: "Exits are where discipline becomes visible."
    },
    trainingActions: {
      zh: ["为部分止盈/移动止损/时间止损写出场规则与触发条件", "复盘是否遵守出场 SOP，并记录违规原因"],
      en: [
        "Write rules for partials, trailing, and time-based exits",
        "Review adherence to exit SOP and log violations"
      ]
    },
    deliverables: {
      zh: ["出场规则（部分止盈/移动止损/时间止损）", "管理 SOP"],
      en: ["Exit rules (partials/trailing/time)", "Management SOP"]
    },
    evaluation: {
      zh: "是否遵守出场规则而非情绪",
      en: "Do you follow exit rules rather than emotion?"
    }
  }
];

