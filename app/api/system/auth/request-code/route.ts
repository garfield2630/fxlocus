import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import { generate6DigitCode, hashCode, isEmail, isPhoneLike, qualifyIdentifier, sendLoginCodeEmail } from "@/lib/system/loginCodes";

export const runtime = "nodejs";

const Body = z.object({
  identifier: z.string().min(3)
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const rawIdentifier = parsed.data.identifier;
  const identifier = rawIdentifier.trim();
  const qualified = qualifyIdentifier("login", identifier);

  const code = generate6DigitCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const admin = supabaseAdmin();
  await admin.from("system_login_codes").insert({
    identifier: qualified,
    code_hash: codeHash,
    expires_at: expiresAt
  });

  const nodeEnv = process.env.NODE_ENV || "development";

  if (isEmail(identifier)) {
    const send = await sendLoginCodeEmail(identifier.trim().toLowerCase(), code, "login");
    if (send.ok) {
      return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }
    if (nodeEnv !== "production") {
      return NextResponse.json(
        { ok: true, dev_code: code, dev_reason: send.reason },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json({ ok: false, error: "DELIVERY_FAILED" }, { status: 500 });
  }

  if (isPhoneLike(identifier)) {
    if (nodeEnv !== "production") {
      return NextResponse.json(
        { ok: true, dev_code: code, dev_reason: "SMS_NOT_CONFIGURED" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json({ ok: false, error: "SMS_NOT_CONFIGURED" }, { status: 501 });
  }

  return NextResponse.json({ ok: false, error: "INVALID_IDENTIFIER" }, { status: 400 });
}

