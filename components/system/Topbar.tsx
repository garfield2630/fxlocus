"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  locale: "zh" | "en";
  user: { full_name: string; role: "admin" | "student" };
};

function swapLocale(pathname: string, nextLocale: "zh" | "en") {
  return pathname.replace(/^\/(zh|en)(?=\/|$)/, `/${nextLocale}`);
}

export function Topbar({ locale, user }: Props) {
  const router = useRouter();
  const pathname = usePathname() || `/${locale}/system/dashboard`;
  const [loading, setLoading] = React.useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/system/auth/logout", { method: "POST" });
    } finally {
      router.replace(`/${locale}/system/login`);
      setLoading(false);
    }
  };

  const toLocale = (nextLocale: "zh" | "en") => {
    router.replace(swapLocale(pathname, nextLocale));
  };

  return (
    <div className="h-14 border-b border-white/10 bg-white/5 backdrop-blur px-4 flex items-center gap-3">
      <div className="text-white/80 text-sm">
        {user.full_name}
        <span className="ml-2 text-white/40 text-xs">
          {user.role === "admin"
            ? locale === "zh"
              ? "管理员"
              : "Admin"
            : locale === "zh"
              ? "学员"
              : "Student"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center rounded-xl border border-white/10 bg-white/0 overflow-hidden">
          <button
            type="button"
            onClick={() => toLocale("zh")}
            className={`px-3 py-1.5 text-sm ${locale === "zh" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => toLocale("en")}
            className={`px-3 py-1.5 text-sm ${locale === "en" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}
          >
            EN
          </button>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={logout}
          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-50"
        >
          {locale === "zh" ? "退出系统" : "Logout"}
        </button>
      </div>
    </div>
  );
}
