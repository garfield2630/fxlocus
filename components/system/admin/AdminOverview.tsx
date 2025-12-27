import React from "react";
import { unstable_noStore } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

export async function AdminOverview({ locale }: { locale: "zh" | "en" }) {
  unstable_noStore();
  const supabase = createSupabaseServerClient();
  const [{ count: studentsCount }, { count: frozenCount }, { count: requestedCount }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "frozen"),
    supabase.from("course_access").select("id", { count: "exact", head: true }).eq("status", "requested")
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/90 font-semibold text-xl">{locale === "zh" ? "管理员概览" : "Admin overview"}</div>
        <div className="mt-2 text-white/60 text-sm">
          {locale === "zh"
            ? "学员管理、课程审批、文件库与天梯截图在侧栏进入。"
            : "Use the sidebar for students, approvals, files and ladder."}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">{locale === "zh" ? "学员总数" : "Students"}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{studentsCount || 0}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">{locale === "zh" ? "冻结账号" : "Frozen"}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{frozenCount || 0}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">{locale === "zh" ? "待审批申请" : "Pending requests"}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{requestedCount || 0}</div>
        </div>
      </div>
    </div>
  );
}
