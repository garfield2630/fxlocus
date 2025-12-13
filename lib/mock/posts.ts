import type { InsightPost } from "./types";

export const posts: InsightPost[] = [
  {
    slug: "triggers-before-trades",
    pillar: "mind",
    title: {
      zh: "下单前的冲动从哪里来：触发器地图",
      en: "Mapping triggers before trades"
    },
    excerpt: {
      zh: "多数错误不是技术问题，而是触发器触发后“自动驾驶”执行的结果。本文提供一套可记录、可复盘的触发器地图。",
      en: "Many mistakes are not technical—they are automatic responses to triggers. This article provides a reviewable trigger map."
    },
    publishedAt: "2024-06-01",
    readingTime: 7,
    tags: ["discipline", "logging", "behavior"],
    contentMd: {
      zh: String.raw`## 为什么要做触发器地图

很多“错误交易”并不是因为你不懂技术，而是因为你在触发后进入了自动驾驶：你以为自己在做决策，实际上是在执行一个习惯化反应。

触发器地图的目的不是让你更“克制”，而是让触发在进入执行链路之前被看见、被记录、被延迟。

## 触发器分类（示例）

- **FOMO**：错过恐惧，看到动就追
- **报复**：亏损后要立刻“赢回来”
- **确认偏误**：只看支持自己观点的信息
- **无聊交易**：没有结构，只是想做点什么

## 记录模板（两周）

每笔下单前记录三件事：

1. 情绪（例如：焦虑/兴奋/麻木）
2. 身体信号（心跳、呼吸、紧张感）
3. 外部刺激（社群消息、连续亏损、刚错过行情）

然后标注：触发类型 + 你想做的“冲动动作”。

## 用检查表做“闸门”

触发出现后，不需要立刻“战胜它”。你需要一个闸门：

- 延迟 3 分钟
- 重新读一次结构与风险边界
- 按交易前检查表逐项通过/不通过

## 可执行清单

- 连续两周：每笔下单前记录情绪/身体/刺激
- 给每个触发打标签，并统计最常见的 1–2 个
- 为最常见触发写一条“延迟规则”（例如 3 分钟）
- 在复盘里验证：触发出现时，你是否按闸门走

## 证伪标准与误区

- **误区**：把触发器当成“坏情绪”，试图压制
- **误区**：不记录，只凭回忆总结
- **证伪**：若你无法延迟 3 分钟，说明闸门不成立，需要更硬的约束（停手/减仓）`,
      en: String.raw`## Why map triggers

Many “bad trades” are not technical. They are habits executed under a trigger. You think you’re deciding, but you’re running a script.

A trigger map is not about willpower. It’s about making the trigger visible before it enters execution.

## A simple taxonomy

- **FOMO**: chasing movement to avoid missing out
- **Revenge**: trying to win back after a loss
- **Confirmation bias**: only seeing what supports your view
- **Boredom trades**: acting without structure

## A two-week logging template

Before each order, write:

1. Emotion (e.g., anxious / excited / numb)
2. Bodily cues (breath, tension, heart rate)
3. External stimulus (chat room, streaks, missed move)

Then label: trigger type + the impulse you want to execute.

## Use a checklist as a gate

When a trigger appears, don’t “fight it”. Gate it:

- Delay for 3 minutes
- Re-read structure and risk boundaries
- Pass/fail a pre-trade checklist

## Action checklist

- Log emotion/body/stimulus before each order for 2 weeks
- Tag triggers and identify the top 1–2 types
- Write one delay rule for the dominant trigger (e.g., 3 minutes)
- Review: did you run the gate when the trigger appeared?

## Falsification & pitfalls

- **Pitfall**: treating triggers as “bad emotions” and trying to suppress them
- **Pitfall**: relying on memory instead of logs
- **Falsification**: if you cannot delay 3 minutes, your gate is not real—add harder constraints (stop/size-down)`
    }
  },

  {
    slug: "post-loss-protocol",
    pillar: "mind",
    title: {
      zh: "亏损后的第二次错误：你需要一套冷却协议",
      en: "The second mistake after a loss"
    },
    excerpt: {
      zh: "亏损本身不可怕，可怕的是亏损后的自动驾驶：加仓、频率变高、规则松动。本文给出一套“冷却期 + 复盘输出”的协议。",
      en: "Loss is not the problem. The expensive part is what you do next. Here is a protocol built on cooldown and review outputs."
    },
    publishedAt: "2024-06-12",
    readingTime: 6,
    tags: ["discipline", "risk", "review"],
    contentMd: {
      zh: String.raw`## 第二次错误更贵

亏损本身属于概率波动；亏损后的报复性行为才是结构性亏损。

常见模式：

- 频率变高：试图用次数“抹平”亏损
- 规则松动：本来不该做的也做了
- 仓位变大：用风险换情绪缓解

## 冷却协议（最小可行版）

亏损后执行三件事：

1. **强制冷却**：设定计时（例如 30–60 分钟），冷却期间不允许下单
2. **频率上限**：当日最多 N 笔，触发上限自动停手
3. **恢复条件**：只有当你完成复盘输出并通过检查表，才允许恢复

## 复盘输出要写什么

一份复盘至少包含：

- 这笔交易的证据链（结构/位置/证伪点）
- 亏损来自哪里：执行问题还是概率波动
- 下一次的修正动作（只选 1 条）

## 可执行清单

- 为“亏损后”写一张协议卡：冷却时长、当日上限、恢复条件
- 连续 2 周统计：亏损后是否出现报复性交易
- 在评分卡里单独记录“亏损后纪律”

## 证伪标准与误区

- **误区**：把冷却当成“休息”，不做复盘输出
- **误区**：亏损后想通过更大仓位“证明自己”
- **证伪**：如果亏损后频率上升或仓位变大，协议未生效，需要更硬的上限（停手到次日）`,
      en: String.raw`## The second mistake is expensive

Losses can be variance. The structural damage is the behavior after a loss.

Common patterns:

- Higher frequency to “erase” the loss
- Looser rules: doing trades you would normally reject
- Larger size to buy emotional relief

## A minimal protocol

After a loss, do three things:

1. **Cooldown**: set a timer (e.g., 30–60 minutes). No orders during the window.
2. **Daily cap**: max N trades per day. Hit the cap = stop.
3. **Re-entry conditions**: only resume after a written review and checklist pass.

## What the review must contain

- Evidence chain (structure / location / falsification)
- Was the loss execution or variance?
- One corrective action for the next cycle

## Action checklist

- Write a post-loss card: cooldown, daily cap, re-entry conditions
- Track for 2 weeks: do revenge trades occur after losses?
- Add a separate score line for “post-loss discipline”

## Falsification & pitfalls

- **Pitfall**: cooldown as “rest” without review output
- **Pitfall**: sizing up to “prove” yourself
- **Falsification**: if frequency rises or size increases after losses, the protocol is not real—tighten the cap (stop until next day)`
    }
  },

  {
    slug: "consistency-scorecard",
    pillar: "mind",
    title: {
      zh: "一致性不是感觉：如何做一张执行评分卡",
      en: "Consistency needs a scorecard"
    },
    excerpt: {
      zh: "你无法改进你不衡量的东西。本文给出一张可落地的执行评分卡：维度、评分方法与每周迭代方式。",
      en: "You can’t improve what you don’t measure. This article outlines a practical execution scorecard and a weekly iteration loop."
    },
    publishedAt: "2024-06-25",
    readingTime: 7,
    tags: ["process", "audit", "discipline"],
    contentMd: {
      zh: String.raw`## 为什么需要评分卡

“我今天状态不错”不是指标。评分卡让你把执行从情绪叙事变成可审计的记录。

## 建议评分维度（示例 0–100）

- 交易前闸门（检查表是否通过）
- 风控一致性（单笔风险、止损逻辑）
- 证据链完整性（结构/位置/证伪是否清晰）
- 出场纪律（是否按规则）
- 复盘质量（是否输出、是否提炼一个修正动作）

## 违规分类（比“对错”更重要）

把违规分成类别，才能修正：

- 频率违规
- 仓位违规
- 证伪缺失
- 计划外进场
- 情绪化管理

## 每周迭代：只修一个点

每周只选一个“最高频违规”作为修正目标。否则你会在很多改进点之间反复横跳。

## 可执行清单

- 建一张 0–100 的评分卡，并固定 5 个维度
- 交易后 5 分钟内打分（避免事后合理化）
- 每周做一次汇总：平均分、波动、最高频违规
- 给下周写 1 个修正动作

## 证伪标准与误区

- **误区**：评分卡变成“自我安慰”
- **误区**：只记结果，不记过程
- **证伪**：如果分数波动没有收敛，说明规则仍在漂移，需要缩小交易范围与参数`,
      en: String.raw`## Why a scorecard

“I felt good today” is not a metric. A scorecard turns execution into an auditable record.

## Suggested dimensions (0–100)

- Gate: did the pre-trade checklist pass?
- Risk consistency: risk per trade and stop logic
- Evidence chain: structure / location / falsification
- Exit discipline: did you follow rules?
- Review quality: did you produce output and one corrective action?

## Violation taxonomy beats “right vs wrong”

You can’t fix what you don’t classify:

- Frequency violations
- Sizing violations
- Missing falsification
- Off-plan entries
- Emotional management

## Weekly iteration: fix one thing

Pick one high-frequency violation per week. Too many targets creates drift.

## Action checklist

- Build a 0–100 scorecard with 5 fixed dimensions
- Score within 5 minutes after the trade (avoid storytelling)
- Weekly summary: mean score, variance, top violation
- Write one corrective action for next week

## Falsification & pitfalls

- **Pitfall**: turning the scorecard into self-soothing
- **Pitfall**: tracking outcomes without process
- **Falsification**: if variance doesn’t narrow, rules are drifting—reduce scope and parameters`
    }
  },

  {
    slug: "regime-identification",
    pillar: "market",
    title: {
      zh: "趋势、震荡与转折：先识别阶段，再谈策略表达",
      en: "Identify regimes before tactics"
    },
    excerpt: {
      zh: "同一套表达在不同阶段表现不同。本文给出一个简单可复用的阶段识别框架，并说明如何与参数联动。",
      en: "The same expression behaves differently across regimes. Here’s a reusable lens and how it should change your parameters."
    },
    publishedAt: "2024-07-05",
    readingTime: 8,
    tags: ["market", "structure", "process"],
    contentMd: {
      zh: String.raw`## 先识别，再表达

很多“策略失效”并不是策略问题，而是阶段错配：你用趋势表达去做震荡，用震荡表达去做转折。

## 三种阶段的结构信号（简化）

- **趋势**：推进占优，回撤有序；结构不断创新高/新低
- **震荡**：边界清晰，内部来回；突破失败较多
- **转折**：推进开始失败，重测与反向推进组合出现

## 阶段识别与参数联动

阶段不是标签，它决定参数：

- 趋势：允许更深回撤，但必须有清晰证伪
- 震荡：更强调边界位置，止损更“结构化”
- 转折：更强调等待确认与延迟进入

## 可执行清单

- 用同一清单对 EURUSD/XAUUSD/US500/BTC 做阶段判定
- 每次交易写：阶段 + 你选择的表达方式 + 参数（止损/仓位）
- 周复盘：阶段判定是否稳定？是否影响了风险控制？

## 证伪标准与误区

- **误区**：用一个指标判断阶段
- **误区**：阶段识别不影响参数（等于没用）
- **证伪**：如果不同资产/周期你无法用同一标准判断阶段，说明框架不稳定，需要更简化的规则`,
      en: String.raw`## Identify first, then express

Many “strategy failures” are regime mismatch: using a trend expression in a range, or range logic during transition.

## Three regimes (simplified)

- **Trend**: impulse dominates, pullbacks are orderly; structure extends
- **Range**: clear boundaries; frequent failed breaks
- **Transition**: pushes fail; sequences of retest + reversal emerge

## Regime should change parameters

Regime is not a label. It changes risk:

- Trend: tolerate deeper pullbacks, with clear falsification
- Range: prioritize boundary location; stops must be structural
- Transition: wait for confirmation and delay entries

## Action checklist

- Classify EURUSD/XAUUSD/US500/BTC with one checklist
- For each trade, write: regime + expression + parameters (stop/size)
- Weekly review: was regime stable, and did it change risk behavior?

## Falsification & pitfalls

- **Pitfall**: using one indicator to define regimes
- **Pitfall**: regimes that don’t change parameters (useless labels)
- **Falsification**: if you can’t classify across assets/timeframes with one standard, simplify the framework`
    }
  },

  {
    slug: "liquidity-and-location",
    pillar: "market",
    title: {
      zh: "流动性与位置：为什么你总是在“该被扫”的地方止损",
      en: "Liquidity and location: why stops get swept"
    },
    excerpt: {
      zh: "止损被扫不等于“市场针对你”，更多时候是你把止损放在了显眼的位置。本文用结构语言解释流动性与位置。",
      en: "Getting swept isn’t personal. It’s often predictable placement. Here’s a structural view on liquidity and location."
    },
    publishedAt: "2024-07-18",
    readingTime: 8,
    tags: ["liquidity", "risk", "structure"],
    contentMd: {
      zh: String.raw`## “被扫”通常来自位置选择

止损放在“人人看得见”的点位，意味着你把风险边界交给了最拥挤的地方。

## 流动性是什么（交易者语言）

流动性不是概念词，它通常表现为：

- 边界附近密集的止损/挂单
- 关键高低点附近的集中成交
- 突破后快速回撤（失败突破）

## 位置与证伪点

一个更可审计的写法：

- 你在哪里错？（结构证伪点）
- 错了会发生什么？（结构被破坏/阶段改变）
- 所以止损放在哪里？（与证伪点一致）

## 可执行清单

- 标注关键位置：边界、高低点、结构枢纽
- 每笔交易写清止损的“结构理由”
- 复盘 20 笔：止损是否一致地放在证伪点？

## 证伪标准与误区

- **误区**：止损只按固定点数/比例
- **误区**：被扫后情绪化反向
- **证伪**：若你无法解释“为什么这里错”，说明止损不是证伪点，只是距离`,
      en: String.raw`## Sweeps are often placement

Stops at obvious points outsource your risk boundary to the most crowded area.

## Liquidity in trader terms

Liquidity often shows up as:

- Dense stop/limit clustering near boundaries
- Concentrated trading around swing highs/lows
- Breakout then fast return (failed break)

## Location and falsification

A reviewable chain:

- Where are you wrong? (structural falsification)
- What changes if wrong? (structure/regime shifts)
- Therefore where is the stop? (consistent with falsification)

## Action checklist

- Mark key locations: boundaries, swings, pivots
- Write the structural reason for every stop
- Review 20 trades: were stops consistently placed at falsification points?

## Falsification & pitfalls

- **Pitfall**: fixed-pip stops without structure
- **Pitfall**: emotional reversal after getting swept
- **Falsification**: if you can’t explain why it’s wrong there, it’s not falsification—it’s distance`
    }
  },

  {
    slug: "weekly-breakdown-template",
    pillar: "market",
    title: {
      zh: "一份周结构报告，训练你稳定的市场认知",
      en: "A weekly breakdown trains stable perception"
    },
    excerpt: {
      zh: "市场认知的稳定性来自持续输出。本文提供一份周结构报告模板：叙事、阶段、关键位置、风险环境与下周计划。",
      en: "Stable perception comes from repeated output. This is a weekly breakdown template: narrative, regimes, locations, risk context, and plan."
    },
    publishedAt: "2024-08-02",
    readingTime: 7,
    tags: ["review", "market", "process"],
    contentMd: {
      zh: String.raw`## 为什么要写周结构报告

你需要一个固定频率的输出，把“市场解释”从情绪波动里拉出来。

## 周报告模板（建议 20–30 分钟）

1. **叙事**：本周驱动是什么？哪些事件改变了约束？
2. **阶段**：趋势/震荡/转折？用同一清单判断
3. **关键位置**：边界、枢纽、流动性区
4. **风险环境**：波动处于哪一层？参数如何调整？
5. **下周计划**：允许做什么，不允许做什么（节奏与窗口）

## 用报告反推执行

如果你的执行与周结构长期矛盾，要么是结构判断不稳定，要么是纪律不成立。

## 可执行清单

- 每周固定输出 1 份报告（同一模板）
- 报告要能落到：一张图 + 三条结论 + 两条约束
- 周末复盘：执行记录是否与报告一致？

## 证伪标准与误区

- **误区**：周报写成新闻摘要
- **误区**：周报不改变下周的参数/节奏
- **证伪**：若你无法持续输出，说明模板过复杂，需要删减到“最小可行”`,
      en: String.raw`## Why a weekly breakdown

You need a fixed cadence to pull market interpretation out of emotional swings.

## A 20–30 minute template

1. **Narrative**: what drove the week? what constraints changed?
2. **Regime**: trend / range / transition (one checklist)
3. **Locations**: boundaries, pivots, liquidity zones
4. **Risk context**: volatility tier and parameter adjustments
5. **Next-week plan**: what’s allowed, what’s not (cadence & windows)

## Use the report to audit execution

If execution repeatedly contradicts the weekly structure, either the framework is unstable or discipline isn’t real.

## Action checklist

- Publish one report per week using the same template
- Reduce output to: one chart + three conclusions + two constraints
- Weekly review: does execution align with the report?

## Falsification & pitfalls

- **Pitfall**: weekly report as a news summary
- **Pitfall**: no parameter/cadence change for next week
- **Falsification**: if you can’t sustain output, the template is too complex—cut to minimum viable`
    }
  },

  {
    slug: "force-and-location",
    pillar: "price",
    title: {
      zh: "K线本质：力量与位置，而不是形态背诵",
      en: "Price action: force and location, not pattern names"
    },
    excerpt: {
      zh: "形态名称不会提高一致性。更可复用的读图方式是：看推进与回撤的质量（力量），以及它发生在哪里（位置）。",
      en: "Pattern names don’t improve repeatability. A reusable read is force (impulse/pullback quality) and location (where it happens)."
    },
    publishedAt: "2024-08-15",
    readingTime: 8,
    tags: ["price-action", "structure", "process"],
    contentMd: {
      zh: String.raw`## 从“形态”切换到“评分”

形态是结果描述，不是原因解释。你需要的是可复用的因果语言：力量与位置。

## 力量：推进与回撤质量

观察两个问题：

- 推进是否干净、有延续？
- 回撤是否有序、是否破坏结构？

你可以给推进/回撤打分（例如 1–5），并截图归档。

## 位置：结构枢纽与边界

同样的力量，在不同位置意义不同：

- 边界附近：更强调证伪点与风险边界
- 中间区域：噪音更大，表达价值更低

## 可执行清单

- 每笔交易写成三件事：力量 / 位置 / 证伪
- 建一个“示例图库”：每类行为保留 5–10 张截图
- 周复盘：你的交易是否集中在边界附近？

## 证伪标准与误区

- **误区**：把“看不懂”当成加指标的理由
- **误区**：只描述形态，不写证伪点
- **证伪**：如果你无法在进场前写出失败点，你不是在表达，而是在猜`,
      en: String.raw`## From patterns to scoring

Patterns describe outcomes, not causes. A reusable language is force and location.

## Force: impulse and pullback quality

Two questions:

- Is impulse clean and extending?
- Is pullback orderly, or does it damage structure?

Score impulse/pullback (e.g., 1–5) and archive examples with screenshots.

## Location: pivots and boundaries

The same force means different things at different locations:

- Near boundaries: falsification and risk boundaries matter most
- Mid-range: noise is higher; expression value is lower

## Action checklist

- Write every trade as three items: force / location / falsification
- Build an example library: 5–10 screenshots per behavior type
- Weekly review: do trades cluster near boundaries?

## Falsification & pitfalls

- **Pitfall**: adding indicators because “it’s unclear”
- **Pitfall**: describing patterns without falsification
- **Falsification**: if you can’t write failure points before entry, you’re guessing—not expressing`
    }
  },

  {
    slug: "falsification-rules",
    pillar: "price",
    title: {
      zh: "证伪：让你从希望回到概率",
      en: "Falsification returns you to probability"
    },
    excerpt: {
      zh: "没有证伪点，交易会变成“希望”。本文讲如何把证伪写成规则，并把退出从情绪中剥离。",
      en: "Without falsification, trades become hope. This is how to write falsification as rules and remove emotion from exits."
    },
    publishedAt: "2024-08-28",
    readingTime: 7,
    tags: ["risk", "exits", "discipline"],
    contentMd: {
      zh: String.raw`## 证伪点不是“止损点数”

证伪是结构语言：如果发生 X，这个观点不成立。

## 三步写证伪

1. 观点是什么？（结构/阶段/位置）
2. 失败会如何表现？（结构破坏、推进失败、边界失守）
3. 我在哪里承认失败？（对应的位置点）

## 退出规则化

当证伪点成立，你不需要“再等等”。你需要执行退出，并在复盘里记录：

- 证伪是否写清？
- 是否按规则退出？
- 是否发生了“扛单”或“加仓”

## 可执行清单

- 每笔交易进场前写证伪句：如果 X 发生，我退出
- 出场规则写成 SOP：触发条件、动作、记录项
- 统计 20 笔：证伪清晰度与执行一致性

## 证伪标准与误区

- **误区**：证伪写成“价格到我不舒服的地方”
- **误区**：用加仓抵抗证伪
- **证伪**：如果你无法在进场前写出一句完整证伪句，说明你没有边界`,
      en: String.raw`## Falsification is not “stop distance”

Falsification is structural: if X happens, the idea is invalid.

## A three-step method

1. What is the claim? (structure/regime/location)
2. How does failure look? (structure breaks, impulse fails, boundary gives)
3. Where do you admit failure? (a specific location)

## Rule-based exits

When falsification triggers, you don’t “wait”. You execute, then review:

- Was falsification written clearly?
- Did you exit by rule?
- Did you average down or hold by emotion?

## Action checklist

- Before entry, write one sentence: if X happens, I exit
- Write exit SOP: trigger, action, logging fields
- Review 20 trades: falsification clarity and execution consistency

## Falsification & pitfalls

- **Pitfall**: writing falsification as “a place I feel bad”
- **Pitfall**: averaging down against falsification
- **Falsification**: if you cannot write a full falsification sentence before entry, you have no boundary`
    }
  },

  {
    slug: "transition-vs-pullback",
    pillar: "price",
    title: {
      zh: "回撤还是转折：结构行为如何区分",
      en: "Pullback or transition? A structural lens"
    },
    excerpt: {
      zh: "把回撤当转折会让你频繁反向；把转折当回撤会让你扛单。本文用行为序列区分两者，并给出延迟进入规则。",
      en: "Mistaking pullbacks for transitions leads to premature reversals; mistaking transitions for pullbacks leads to holding. Use sequences, not single candles."
    },
    publishedAt: "2024-09-10",
    readingTime: 8,
    tags: ["structure", "transitions", "price-action"],
    contentMd: {
      zh: String.raw`## 不要用“单根K线”判断转折

转折通常是一段行为序列，而不是一个信号。

## 回撤：趋势中的调整

常见特征：

- 推进仍占优
- 回撤有序，不破坏关键结构
- 重新推进很快出现

## 转折：趋势衰竭与反向建立

常见序列：

1. 推进开始失败（延续变差）
2. 关键位置失守或重测失败
3. 反向推进出现，并开始形成新边界

## 延迟进入规则（建议）

转折交易的风险来自“猜”。用延迟规则降低猜测：

- 等待第二次确认（重测失败后）
- 只有在证伪点清晰时表达
- 冲突周期时减仓或放弃

## 可执行清单

- 对每次“想反向”的冲动：写出你看到的行为序列
- 用同一观察表记录 10 个转折案例
- 周复盘：你是在哪个阶段提前了？

## 证伪标准与误区

- **误区**：把一次大阴/阳线当成转折
- **误区**：没有证伪点就反向
- **证伪**：如果你无法写出序列与确认条件，说明你在用感觉交易`,
      en: String.raw`## Don’t call transitions from one candle

Transitions are usually sequences, not single signals.

## Pullback: adjustment within trend

Typical features:

- Impulse still dominates
- Pullback is orderly and respects key structure
- Re-impulse appears quickly

## Transition: exhaustion and reversal building

Common sequence:

1. Impulse starts to fail (weaker continuation)
2. Key location breaks or a retest fails
3. Reversal impulse forms and begins to build a new boundary

## A delay rule for transitions

Transition risk is guessing. Reduce it:

- Wait for a second confirmation (after a failed retest)
- Express only when falsification is clear
- Size-down or pass when timeframes conflict

## Action checklist

- For every “reverse now” impulse, write the observed sequence
- Log 10 transition cases using one template
- Weekly review: at which step did you act too early?

## Falsification & pitfalls

- **Pitfall**: treating one large candle as a transition
- **Pitfall**: reversing without falsification
- **Falsification**: if you can’t write the sequence and confirmation conditions, you’re trading feelings`
    }
  }
];
