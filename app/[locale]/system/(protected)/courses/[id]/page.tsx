import { unstable_noStore } from "next/cache";
import { redirect } from "next/navigation";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import { CoursePlayerClient } from "@/components/system/CoursePlayerClient";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params
}: {
  params: { locale: "zh" | "en"; id: string };
}) {
  unstable_noStore();
  const locale = params.locale === "en" ? "en" : "zh";
  const courseId = Number(params.id);
  if (!courseId || courseId < 1 || courseId > 20) redirect(`/${locale}/system/courses`);

  const auth = await getSystemAuth();
  if (!auth.ok) return null;

  const admin = supabaseAdmin();
  const [{ data: course }, { data: access }, { data: note }] = await Promise.all([
    admin.from("courses").select("*").eq("id", courseId).maybeSingle(),
    admin.from("course_access").select("*").eq("user_id", auth.user.id).eq("course_id", courseId).maybeSingle(),
    admin.from("course_notes").select("*").eq("user_id", auth.user.id).eq("course_id", courseId).maybeSingle()
  ]);

  const status = access?.status || "none";
  const canView = status === "approved" || status === "completed";
  if (!canView) {
    redirect(`/${locale}/system/courses`);
  }

  return (
    <CoursePlayerClient
      locale={locale}
      course={course as any}
      access={access as any}
      initialNote={note?.content_md || ""}
    />
  );
}

