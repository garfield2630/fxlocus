import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import {
  generate6DigitCode,
  hashCode,
  isEmail,
  qualifyIdentifier,
  sendLoginCodeEmail
} from "@/lib/system/loginCodes";

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

  const identifier = parsed.data.identifier.trim();
  if (!isEmail(identifier)) {
    return NextResponse.json({ ok: false, error: "EMAIL_REQUIRED" }, { status: 400 });
  }

  const qualified = qualifyIdentifier("reset", identifier);
  const code = generate6DigitCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const admin = supabaseAdmin();
  await admin.from("system_login_codes").insert({
    identifier: qualified,
    code_hash: codeHash,
    expires_at: expiresAt
  });

  const send = await sendLoginCodeEmail(identifier.trim().toLowerCase(), code, "reset");
  if (send.ok) {
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  }

  if ((process.env.NODE_ENV || "development") !== "production") {
    return NextResponse.json(
      { ok: true, dev_code: code, dev_reason: send.reason },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json({ ok: false, error: "DELIVERY_FAILED" }, { status: 500 });
}

