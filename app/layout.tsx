import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
  display: "swap"
});

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = headers().get("x-next-intl-locale") ?? "zh";
  const isEn = locale === "en";

  return (
    <html
      lang={isEn ? "en" : "zh"}
      className={`${inter.variable} ${notoSans.variable} ${isEn ? "font-en" : "font-zh"}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
