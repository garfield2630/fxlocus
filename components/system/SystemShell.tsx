import React from "react";

import type { SystemUser } from "@/lib/system/auth";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BfcacheGuard } from "./BfcacheGuard";

export function SystemShell({
  locale,
  user,
  children
}: {
  locale: "zh" | "en";
  user: SystemUser;
  children: React.ReactNode;
}) {
  return (
    <div className="h-[calc(100vh-var(--header-h,72px))] w-full overflow-hidden">
      <BfcacheGuard locale={locale} />
      <div className="h-full grid grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar locale={locale} user={user} />
        <div className="h-full min-w-0 flex flex-col bg-[#050a14]">
          <Topbar locale={locale} user={{ full_name: user.full_name, role: user.role }} />
          <div className="flex-1 min-h-0 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

