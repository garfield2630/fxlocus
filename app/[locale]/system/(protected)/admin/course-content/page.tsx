import { unstable_noStore } from "next/cache";

import { AdminCourseContentClient } from "@/components/system/admin/AdminCourseContentClient";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCourseContentPage({ params }: { params: { locale: "zh" | "en" } }) {
  unstable_noStore();
  const locale = params.locale === "en" ? "en" : "zh";

  const admin = supabaseAdmin();
  const { data } = await admin.from("courses").select("*").order("id", { ascending: true }).limit(20);

  return <AdminCourseContentClient locale={locale} initialCourses={(data || []) as any[]} />;
}

