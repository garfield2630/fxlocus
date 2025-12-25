import { unstable_noStore } from "next/cache";

import { AdminFilesClient } from "@/components/system/admin/AdminFilesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminFilesPage({ params }: { params: { locale: "zh" | "en" } }) {
  unstable_noStore();
  const locale = params.locale === "en" ? "en" : "zh";
  return <AdminFilesClient locale={locale} />;
}

