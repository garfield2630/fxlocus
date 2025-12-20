import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./i18n/routing";

export default createMiddleware({
  locales,
  defaultLocale,
  localeDetection: false,
  localeCookie: false
});

export const config = {
  matcher: ["/", "/(zh|en)/:path*"]
};
