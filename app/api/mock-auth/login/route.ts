import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, signSession, type SessionRole } from "@/lib/auth/session";

type Body = {
  username?: string;
  password?: string;
};

function getSecret() {
  return process.env.FXLOCUS_AUTH_SECRET || "fxlocus-dev-secret";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  const adminPassword = process.env.FXLOCUS_ADMIN_PASSWORD || "fxlocus-admin";
  const memberPassword = process.env.FXLOCUS_MEMBER_PASSWORD || "fxlocus-member";

  let role: SessionRole | null = null;
  if (username === "admin" && password === adminPassword) role = "admin";
  if (username === "member" && password === memberPassword) role = "member";

  if (!role) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const secret = getSecret();
  const value = signSession({ role, iat: Date.now() }, secret);

  const res = NextResponse.json({ role }, { status: 200 });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return res;
}

