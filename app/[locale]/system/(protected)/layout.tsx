import React from "react";
import { unstable_noStore } from "next/cache";

import { requireSystemUser } from "@/lib/system/auth";
import { Sidebar } from "@/components/system/Sidebar";
import { Topbar } from "@/components/system/Topbar";
import { BfcacheGuard } from "@/components/system/BfcacheGuard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      <BfcacheGuard locale={locale} />
      <div className="flex h-full w-full">
        <Sidebar locale={locale} user={user} />
        <main className="flex-1 min-w-0 h-full overflow-hidden flex flex-col bg-[#050a14]">
          <Topbar locale={locale} user={{ full_name: user.full_name, role: user.role }} />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="min-h-full w-full p-4">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

