"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { StatusBadge } from "./StatusBadge";

type CourseRow = {
  id: number;
  title_en: string;
  title_zh: string;
  summary_en?: string | null;
  summary_zh?: string | null;
  content_type?: string | null;
};

type AccessRow = {
  course_id: number;
  status: "requested" | "approved" | "rejected" | "completed";
  rejection_reason?: string | null;
  progress?: number | null;
};

export function CoursesClient({
  locale,
  courses,
  access
}: {
  locale: "zh" | "en";
  courses: CourseRow[];
  access: AccessRow[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = React.useState<number | null>(null);
  const accessById = React.useMemo(() => new Map(access.map((a) => [a.course_id, a])), [access]);

  const request = async (courseId: number) => {
    setLoadingId(courseId);
    try {
      const res = await fetch(`/api/system/courses/${courseId}/request`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) return;
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">{locale === "zh" ? "课程" : "Courses"}</div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh"
            ? "申请课程权限，通过后即可进入学习。"
            : "Request course access. Once approved you can start learning."}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => {
          const a = accessById.get(c.id);
          const status = a?.status || "none";
          const canEnter = status === "approved" || status === "completed";
          return (
            <div key={c.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2">
                <div className="text-white/90 font-semibold">
                  {locale === "zh" ? `第${c.id}课` : `Lesson ${c.id}`}
                </div>
                <div className="ml-auto">
                  {status === "none" ? (
                    <span className="text-xs text-white/50">{locale === "zh" ? "未申请" : "Not requested"}</span>
                  ) : (
                    <StatusBadge value={status} locale={locale} />
                  )}
                </div>
              </div>

              <div className="mt-2 text-white text-lg font-semibold">
                {locale === "zh" ? c.title_zh : c.title_en}
              </div>
              <div className="mt-2 text-sm text-white/65 leading-6 line-clamp-3">
                {locale === "zh" ? c.summary_zh : c.summary_en}
              </div>

              {a?.status === "rejected" && a.rejection_reason ? (
                <div className="mt-3 text-xs text-rose-200/90">
                  {locale === "zh" ? "拒绝原因：" : "Reason: "} {a.rejection_reason}
                </div>
              ) : null}

              <div className="mt-4 flex items-center gap-2">
                {canEnter ? (
                  <a
                    href={`/${locale}/system/courses/${c.id}`}
                    className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15"
                  >
                    {locale === "zh" ? "进入学习" : "Open"}
                  </a>
                ) : null}

                {status === "none" || status === "rejected" ? (
                  <button
                    type="button"
                    disabled={loadingId === c.id}
                    onClick={() => request(c.id)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-50"
                  >
                    {locale === "zh" ? "申请学习" : "Request access"}
                  </button>
                ) : null}

                {status === "requested" ? (
                  <div className="text-xs text-white/50">{locale === "zh" ? "等待审批…" : "Waiting…"}</div>
                ) : null}

                {typeof a?.progress === "number" ? (
                  <div className="ml-auto text-xs text-white/50">{a.progress}%</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

