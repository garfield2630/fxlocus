import { unstable_noStore } from "next/cache";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import { CoursesClient } from "@/components/system/CoursesClient";

export const dynamic = "force-dynamic";

export default async function CoursesPage({ params }: { params: { locale: "zh" | "en" } }) {
  unstable_noStore();
  const locale = params.locale === "en" ? "en" : "zh";
  const auth = await getSystemAuth();
  if (!auth.ok) return null;

  const admin = supabaseAdmin();
  const [{ data: courses }, { data: access }] = await Promise.all([
    admin.from("courses").select("*").order("id", { ascending: true }),
    admin.from("course_access").select("*").eq("user_id", auth.user.id)
  ]);

  return (
    <CoursesClient
      locale={locale}
      courses={(courses || []) as any[]}
      access={(access || []) as any[]}
    />
  );
}

