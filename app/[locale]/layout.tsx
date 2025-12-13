import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LocaleMeta } from "@/components/LocaleMeta";
import { SiteShell } from "@/components/SiteShell";
import { locales, type Locale } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const locale = params.locale as Locale;
  if (!locales.includes(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <>
      <LocaleMeta locale={locale} />
      <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
        <SiteShell locale={locale}>{children}</SiteShell>
      </NextIntlClientProvider>
    </>
  );
}
