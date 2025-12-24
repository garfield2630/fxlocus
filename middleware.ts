import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, locales } from "./i18n/routing";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: false,
  localeCookie: false
});

const SESSION_COOKIE_NAME = "fxlocus_session";
const SYSTEM_COOKIE_NAME = "fxlocus_system_token";

function base64UrlToBytes(input: string) {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) base64 += "=".repeat(4 - pad);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: ArrayBuffer) {
  const arr = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function verifySessionCookie(value: string | undefined) {
  if (!value) return null as null | { role: "admin" | "member"; iat: number };
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const secret = process.env.FXLOCUS_AUTH_SECRET || "fxlocus-dev-secret";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expectedBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const expected = bytesToBase64Url(expectedBytes);
  if (expected !== sigB64) return null;

  try {
    const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    const payload = JSON.parse(payloadJson) as any;
    if (payload?.role !== "admin" && payload?.role !== "member") return null;
    if (typeof payload?.iat !== "number") return null;
    return payload as { role: "admin" | "member"; iat: number };
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(url);
  }

  const localeMatch = /^\/(zh|en)(?=\/|$)/.exec(pathname);
  const locale = localeMatch?.[1] as "zh" | "en" | undefined;

  if (locale) {
    const rest = pathname.slice(`/${locale}`.length) || "/";
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionCookie(sessionCookie);

    if (rest === "/trade-system/app" || rest.startsWith("/trade-system/app/")) {
      if (!session) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/trade-system/login`;
        url.searchParams.set("next", pathname + request.nextUrl.search);
        return NextResponse.redirect(url);
      }
    }

    if (rest === "/admin-system" || rest.startsWith("/admin-system/")) {
      if (!session || session.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/trade-system/login`;
        url.searchParams.set("next", pathname + request.nextUrl.search);
        return NextResponse.redirect(url);
      }
    }

    if (rest === "/system" || rest.startsWith("/system/")) {
      const isPublic = rest === "/system/login";

      if (!isPublic) {
        const token = request.cookies.get(SYSTEM_COOKIE_NAME)?.value;
        if (!token) {
          const url = request.nextUrl.clone();
          url.pathname = `/${locale}/system/login`;
          url.searchParams.set("next", pathname + request.nextUrl.search);
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(zh|en)/:path*"]
};
