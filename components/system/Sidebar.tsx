import React from "react";

import { Link } from "@/i18n/navigation";
import type { SystemUser } from "@/lib/system/auth";

type Props = {
  locale: "zh" | "en";
  user: Pick<SystemUser, "role">;
};

export function Sidebar({ locale, user }: Props) {
  const common = [
    { href: "/system/dashboard", zh: "仪表盘", en: "Dashboard" },
    { href: "/system/courses", zh: "课程", en: "Courses" },
    { href: "/system/files", zh: "文件", en: "Files" },
    { href: "/system/notifications", zh: "通知", en: "Notifications" },
    { href: "/system/profile", zh: "资料", en: "Profile" },
    { href: "/system/ladder", zh: "天梯", en: "Ladder" }
  ];

  const admin = [
    { href: "/system/admin", zh: "管理概览", en: "Admin Home" },
    { href: "/system/admin/students", zh: "学员管理", en: "Students" },
    { href: "/system/admin/courses", zh: "课程审批", en: "Course Access" },
    { href: "/system/admin/files", zh: "文件库", en: "File Library" },
    { href: "/system/admin/ladder", zh: "天梯管理", en: "Ladder Admin" },
    { href: "/system/admin/reports", zh: "报表", en: "Reports" },
    { href: "/system/admin/settings", zh: "设置", en: "Settings" }
  ];

  return (
    <aside className="h-full w-[260px] border-r border-white/10 bg-[#050a14]">
      <div className="h-14 flex items-center px-4 border-b border-white/10">
        <div className="text-white font-semibold tracking-tight">
          {locale === "zh" ? "系统" : "System"}
        </div>
      </div>

      <div className="p-3 space-y-2 overflow-y-auto h-[calc(100%-56px)]">
        <div className="text-xs text-white/40 px-2">{locale === "zh" ? "学员区" : "Student"}</div>
        {common.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            locale={locale}
            className="block rounded-xl border border-white/10 bg-white/0 px-3 py-2 text-sm text-white/75 hover:bg-white/5"
          >
            {locale === "zh" ? item.zh : item.en}
          </Link>
        ))}

        {user.role === "admin" ? (
          <>
            <div className="pt-3 text-xs text-white/40 px-2">{locale === "zh" ? "管理区" : "Admin"}</div>
            {admin.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                locale={locale}
                className="block rounded-xl border border-white/10 bg-white/0 px-3 py-2 text-sm text-white/75 hover:bg-white/5"
              >
                {locale === "zh" ? item.zh : item.en}
              </Link>
            ))}
          </>
        ) : null}
      </div>
    </aside>
  );
}

