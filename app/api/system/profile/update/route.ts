import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";

const Body = z.object({
  fullName: z.string().min(1).max(120).optional(),
  phone: z.string().min(3).max(40).optional()
});

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return noStoreJson({ ok: false, error: "INVALID_BODY" }, 400);

  const admin = supabaseAdmin();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.fullName !== undefined) payload.full_name = parsed.data.fullName;
  if (parsed.data.phone !== undefined) payload.phone = parsed.data.phone;

  const { error } = await admin.from("system_users").update(payload).eq("id", auth.user.id);
  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
  return noStoreJson({ ok: true });
}

