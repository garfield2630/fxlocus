import React from "react";
import { unstable_noStore } from "next/cache";

import { requireSystemUser } from "@/lib/system/auth";
import { SystemShell } from "@/components/system/SystemShell";

export const dynamic = "force-dynamic";

export default async function SystemProtectedLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: "zh" | "en" };
}) {
  unstable_noStore();
  const locale = params.locale === "en" ? "en" : "zh";
  const user = await requireSystemUser(locale);
  return (
    <SystemShell locale={locale} user={user}>
      {children}
    </SystemShell>
  );
}

