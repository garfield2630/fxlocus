"use client";

import { AdminReviewPanel } from "@/components/news/AdminReviewPanel";

export default function NewsAdminPage({ params }: { params: { locale: "zh" | "en" } }) {
  const locale = params?.locale === "en" ? "en" : "zh";
  return (
    <div className="px-4 py-8 md:px-8">
      <AdminReviewPanel locale={locale} />
    </div>
  );
}
