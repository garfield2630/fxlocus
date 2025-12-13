import type { Course } from "./types";

export const courses: Course[] = [
  {
    id: "course-core",
    tier: "course",
    title: {
      zh: "核心课程（自学体系）",
      en: "Core course (self-paced)"
    },
    lead: {
      zh: "模块化训练 + 作业 + 模板，把框架与纪律落地。",
      en: "Modular training with assignments and templates—turning framework into practice."
    },
    deliverables: {
      zh: ["模块讲义", "检查表与模板", "测验与作业"],
      en: ["Modules & notes", "Checklists & templates", "Assignments & quizzes"]
    }
  },
  {
    id: "course-camp",
    tier: "camp",
    title: {
      zh: "陪练营（周期训练）",
      en: "Training cohort (time-boxed)"
    },
    lead: {
      zh: "按周训练：输入、作业、复盘审计，把一致性训练出来。",
      en: "A weekly cadence: input, work, and review audits—training consistency."
    },
    deliverables: {
      zh: ["每周训练计划", "复盘审计", "评分卡与修正动作"],
      en: ["Weekly plan", "Review audits", "Scorecards & corrective actions"]
    }
  },
  {
    id: "course-audit",
    tier: "audit",
    title: {
      zh: "1v1 审计（申请制）",
      en: "1:1 audit (application-based)"
    },
    lead: {
      zh: "围绕你的记录与复盘材料，输出个人SOP、红线与评分基线。",
      en: "Work from your logs and reviews to produce an SOP, guardrails, and a baseline scorecard."
    },
    deliverables: {
      zh: ["个人SOP", "红线规则", "评分基线与复盘框架"],
      en: ["Personal SOP", "Guardrails", "Baseline scorecard & review framework"]
    }
  }
];

