import React from "react";

type Props = {
  locale: "zh" | "en";
};

export function BrandPanel({ locale }: Props) {
  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a1634] to-[#050a14] p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_55%)]" />
      <div className="relative space-y-6">
        <div>
          <div className="text-white/70 text-sm">
            {locale === "zh" ? "FxLocus Trading｜汇点核心交易" : "FxLocus Trading"}
          </div>
          <div className="mt-2 text-white text-3xl font-extrabold tracking-tight">
            {locale === "zh" ? "系统后台" : "System Portal"}
          </div>
          <div className="mt-3 text-white/70 leading-7">
            {locale === "zh"
              ? "先重塑认知与执行，再谈策略与技巧。把训练变成可记录、可复盘、可审计的过程。"
              : "Cognition → execution first. Turn training into a recordable, reviewable process."}
          </div>
        </div>

        <div className="grid gap-3">
          {[
            {
              zh: "交易心理学：用流程约束冲动与报复交易",
              en: "Psychology: constrain impulse & revenge trading"
            },
            {
              zh: "市场认知论：叙事/阶段/关键位置/证伪点",
              en: "Market cognition: narrative, phase, levels, invalidation"
            },
            {
              zh: "K线本质：结构与证据链，而非猜测",
              en: "Price action: structure & evidence, not guesses"
            }
          ].map((item) => (
            <div key={item.en} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/85 text-sm">
                {locale === "zh" ? item.zh : item.en}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60 leading-6">
          {locale === "zh"
            ? "免责声明：本系统内容仅用于教育训练，不构成投资建议；交易有风险，盈亏自负。"
            : "Disclaimer: Training use only. Not financial advice. Trading involves risk."}
        </div>
      </div>
    </div>
  );
}

