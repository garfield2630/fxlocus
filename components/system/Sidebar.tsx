"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FolderCog,
  FolderDown,
  Gauge,
  ImageUp,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  User,
  Users
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { SystemUser } from "@/lib/system/auth";
import { isAdminRole } from "@/lib/system/roles";

type NavItem = {
  href: string;
  zh: string;
  en: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: number;
};

function normalizePathname(pathname: string) {
  const withoutLocale = pathname.replace(/^\/(zh|en)(?=\/|$)/, "");
  const withLeadingSlash = withoutLocale.startsWith("/") ? withoutLocale : `/${withoutLocale}`;
  const normalized = withLeadingSlash === "//" ? "/" : withLeadingSlash;
  if (normalized === "") return "/";
  if (normalized === "/") return "/";
  return normalized.replace(/\/+$/, "");
}

function isActive(pathname: string, item: NavItem) {
  const current = normalizePathname(pathname);
  const target = normalizePathname(item.href);
  if (item.exact) return current === target;
  return current === target || current.startsWith(`${target}/`);
}

function SidebarItem({
  locale,
  item,
  active,
  collapsed
}: {
  locale: "zh" | "en";
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      locale={locale}
      title={collapsed ? (locale === "zh" ? item.zh : item.en) : undefined}
      className={[
        "group relative flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition-colors",
        collapsed ? "justify-center" : "",
        active
          ? "bg-white/10 border-white/20 text-white"
          : "bg-white/0 border-white/10 text-white/75 hover:bg-white/5 hover:text-white"
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={[
          "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r",
          active ? "bg-sky-400" : "bg-transparent"
        ].join(" ")}
      />
      <Icon className={["h-4 w-4", active ? "text-sky-200" : "text-white/70 group-hover:text-white"].join(" ")} />

      {!collapsed ? <span className="min-w-0 truncate">{locale === "zh" ? item.zh : item.en}</span> : null}

      {typeof item.badge === "number" && item.badge > 0 ? (
        <span
          className={[
            "ml-auto inline-flex items-center justify-center rounded-full bg-rose-500/90 text-white text-[11px] font-semibold",
            collapsed ? "h-2.5 w-2.5" : "h-5 min-w-[20px] px-1.5"
          ].join(" ")}
        >
          {collapsed ? "" : item.badge > 99 ? "99+" : String(item.badge)}
        </span>
      ) : null}
    </Link>
  );
}

export function Sidebar({ locale, user }: { locale: "zh" | "en"; user: Pick<SystemUser, "role"> }) {
  const pathname = usePathname() || `/${locale}/system/dashboard`;
  const router = useRouter();
  const [collapsed, setCollapsed] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const [loggingOut, setLoggingOut] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("fxlocus_system_sidebar_collapsed");
    setCollapsed(stored === "1");
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem("fxlocus_system_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/system/notifications/unread-count", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        if (!res.ok || !json?.ok) return;
        setUnread(Number(json.count || 0));
      } catch {
        // ignore
      }
    };

    const onFocus = () => {
      if (!document.hidden) load();
    };

    load();
    const id = window.setInterval(load, 15_000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      alive = false;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/system/auth/logout", { method: "POST" });
    } finally {
      router.replace(`/${locale}/system/login`);
      setLoggingOut(false);
    }
  };

  const studentItems: NavItem[] = [
    { href: "/system/dashboard", zh: "仪表盘", en: "Dashboard", icon: LayoutDashboard },
    { href: "/system/courses", zh: "课程", en: "Courses", icon: BookOpen },
    { href: "/system/files", zh: "文件", en: "Files", icon: FolderDown },
    { href: "/system/notifications", zh: "通知", en: "Notifications", icon: Bell, badge: unread },
    { href: "/system/profile", zh: "个人资料", en: "Profile", icon: User },
    { href: "/system/ladder", zh: "天梯", en: "Ladder", icon: TrendingUp }
  ];

  const adminItems: NavItem[] = [
    { href: "/system/admin", zh: "管理概览", en: "Admin Home", icon: Gauge, exact: true },
    { href: "/system/admin/students", zh: "学员管理", en: "Students", icon: Users },
    { href: "/system/admin/courses", zh: "课程审批", en: "Course Approvals", icon: ClipboardCheck },
    { href: "/system/admin/course-content", zh: "课程内容", en: "Course Content", icon: UploadCloud },
    { href: "/system/admin/files", zh: "文件库", en: "File Library", icon: FolderCog, exact: true },
    { href: "/system/admin/files/requests", zh: "文件权限审批", en: "File Access", icon: ShieldCheck },
    { href: "/system/admin/ladder", zh: "天梯管理", en: "Ladder Admin", icon: ImageUp },
    { href: "/system/admin/reports", zh: "报表", en: "Reports", icon: BarChart3 },
    { href: "/system/admin/settings", zh: "设置", en: "Settings", icon: Settings }
  ];

  return (
    <aside
      className={[
        "h-full border-r border-white/10 bg-[#050a14] flex flex-col",
        collapsed ? "w-[72px]" : "w-[260px]"
      ].join(" ")}
    >
      <div className="h-14 flex items-center px-3 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          {!collapsed ? (
            <div className="text-white font-semibold tracking-tight truncate">{locale === "zh" ? "系统" : "System"}</div>
          ) : (
            <div className="h-8 w-8 rounded-2xl bg-white/10 border border-white/10" />
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
          aria-label={collapsed ? "expand" : "collapse"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        <div className={["text-xs text-white/40 px-2", collapsed ? "hidden" : ""].join(" ")}>
          {locale === "zh" ? "学员区" : "Student"}
        </div>
        <div className="space-y-2">
          {studentItems.map((item) => (
            <SidebarItem
              key={item.href}
              locale={locale}
              item={item}
              collapsed={collapsed}
              active={isActive(pathname, item)}
            />
          ))}
        </div>

        {isAdminRole(user.role) ? (
          <>
            <div className={["pt-2 text-xs text-white/40 px-2", collapsed ? "hidden" : ""].join(" ")}>
              {locale === "zh" ? "管理区" : "Admin"}
            </div>
            <div className="space-y-2">
              {adminItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  locale={locale}
                  item={item}
                  collapsed={collapsed}
                  active={isActive(pathname, item)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="p-3 border-t border-white/10">
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className={[
            "w-full flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition-colors",
            "border-white/10 text-white/75 hover:bg-white/5 hover:text-white",
            collapsed ? "justify-center" : ""
          ].join(" ")}
        >
          <LogOut className="h-4 w-4 text-white/70" />
          {!collapsed ? <span>{locale === "zh" ? "退出系统" : "Logout"}</span> : null}
        </button>
      </div>
    </aside>
  );
}
