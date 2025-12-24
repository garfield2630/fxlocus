import React from "react";
import { unstable_noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "系统" };

export default function SystemPublicLayout({ children }: { children: React.ReactNode }) {
  unstable_noStore();
  return (
    <div className="min-h-[calc(100vh-var(--header-h,72px))] w-full">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-10">{children}</div>
    </div>
  );
}

