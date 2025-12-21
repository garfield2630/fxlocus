"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { FooterBrand } from "@/components/layout/FooterBrand";

export function SiteFooter() {
  const tFooter = useTranslations("footer");
  const tRisk = useTranslations("risk");

  return (
    <footer className="border-t border-white/10 py-10">
      <div className="fx-container space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <FooterBrand />
          <div className="flex items-center gap-4 text-sm text-slate-200/70">
            <Link href="/privacy" className="hover:text-slate-50">
              {tFooter("links.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-slate-50">
              {tFooter("links.terms")}
            </Link>
          </div>
        </div>

        <p className="text-xs leading-5 text-slate-200/60">{tRisk("footer")}</p>
      </div>
    </footer>
  );
}
