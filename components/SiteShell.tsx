import { ReactNode } from "react";

import { AnimatedKlineBackground } from "@/components/AnimatedKlineBackground";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

type Props = {
  children: ReactNode;
  locale: "zh" | "en";
};

export function SiteShell({ children }: Props) {
  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-50">
        <AnimatedKlineBackground />
      </div>

      <SiteHeader />
      <main className="fx-container pb-20 pt-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
