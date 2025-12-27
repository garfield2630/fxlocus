import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { defaultLocale, locales } from "./i18n/routing";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: false,
  localeCookie: false
});

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(url);
  }

  const response = intlMiddleware(request);

  // Supabase Auth session refresh + optional /system protection.
  // We only run it for locale-prefixed `/system/*` routes to keep overhead low.
  if (hasSupabaseEnv()) {
    const localeMatch = /^\/(zh|en)(?=\/|$)/.exec(pathname);
    const locale = localeMatch?.[1] as "zh" | "en" | undefined;
    if (locale) {
      const rest = pathname.slice(`/${locale}`.length) || "/";
      const isSystem = rest === "/system" || rest.startsWith("/system/");
      const isSystemPublic =
        rest === "/system/login" ||
        rest === "/system/forgot-password" ||
        rest === "/system/reset-password";

      if (isSystem) {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll(cookiesToSet) {
                for (const { name, value, options } of cookiesToSet) {
                  response.cookies.set(name, value, options);
                }
              }
            }
          }
        );

        const {
          data: { session }
        } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        const expired = session?.expires_at && session.expires_at * 1000 <= Date.now();

        if (!isSystemPublic && (!user || expired)) {
          const url = request.nextUrl.clone();
          url.pathname = `/${locale}/system/login`;
          url.searchParams.set("next", pathname + request.nextUrl.search);
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/(zh|en)/:path*"]
};
