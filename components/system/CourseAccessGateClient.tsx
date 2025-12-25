"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { StatusBadge } from "@/components/system/StatusBadge";

export function CourseAccessGateClient({
  locale,
  courseId,
  status,
  rejectionReason
}: {
  locale: "zh" | "en";
  courseId: number;
  status: "none" | "requested" | "approved" | "rejected" | "completed";
  rejectionReason?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const canRequest = status === "none" || status === "rejected";

  const request = async () => {
    if (!canRequest) return;
    setLoading(true);
    try {
      const res = await fetch("/api/system/courses/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) return;
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-2">
          <div className="text-white/90 font-semibold text-xl">
            {locale === "zh" ? `第${courseId}课` : `Lesson ${courseId}`}
          </div>
          <div className="ml-auto">{status === "none" ? null : <StatusBadge value={status} locale={locale} />}</div>
        </div>
        <div className="mt-3 text-white/60 text-sm leading-6">
          {status === "requested"
            ? locale === "zh"
              ? "已提交申请，等待管理员审批。"
              : "Request submitted. Waiting for admin approval."
            : status === "rejected"
              ? locale === "zh"
                ? `申请被拒绝：${rejectionReason || "-"}`
                : `Rejected: ${rejectionReason || "-"}`
              : locale === "zh"
                ? "你尚未获得该课程的学习权限。"
                : "You don't have access to this course yet."}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {canRequest ? (
            <button
              type="button"
              disabled={loading}
              onClick={request}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50"
            >
              {loading ? (locale === "zh" ? "提交中…" : "Submitting…") : locale === "zh" ? "申请学习" : "Request access"}
            </button>
          ) : null}
          <a
            className="ml-auto px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
            href={`/${locale}/system/courses`}
          >
            {locale === "zh" ? "返回课程列表" : "Back to courses"}
          </a>
        </div>
      </div>
    </div>
  );
}

