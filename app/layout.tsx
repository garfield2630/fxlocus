import type { Metadata } from "next";
import { headers } from "next/headers";
import { defaultLocale } from "@/i18n/routing";
import "./globals.css";

import "@fontsource/inter/latin.css";
import "@fontsource/noto-sans-sc/chinese-simplified.css";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = headers().get("x-next-intl-locale") ?? defaultLocale;
  const isEn = locale === "en";

  return (
    <html
      lang={isEn ? "en" : "zh"}
      className={isEn ? "font-en" : "font-zh"}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
