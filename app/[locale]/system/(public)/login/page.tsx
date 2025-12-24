import React from "react";
import { unstable_noStore } from "next/cache";

import { BrandPanel } from "@/components/system/BrandPanel";
import { AuthTabs } from "@/components/system/AuthTabs";

export const dynamic = "force-dynamic";

export default function SystemLoginPage({ params }: { params: { locale: "zh" | "en" } }) {
  unstable_noStore();
  const locale = params.locale === "en" ? "en" : "zh";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <BrandPanel locale={locale} />
      <div className="flex items-center">
        <div className="w-full">
          <AuthTabs locale={locale} />
        </div>
      </div>
    </div>
  );
}

