import { unstable_noStore } from "next/cache";

import { AdminStudentsClient } from "@/components/system/admin/AdminStudentsClient";

export const dynamic = "force-dynamic";

export default function AdminStudentsPage({ params }: { params: { locale: "zh" | "en" } }) {
  unstable_noStore();
  const locale = params.locale === "en" ? "en" : "zh";
  return <AdminStudentsClient locale={locale} />;
}

