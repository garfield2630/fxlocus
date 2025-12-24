import { NextRequest, NextResponse } from "next/server";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(_req: NextRequest, ctx: { params: { id: string } }) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);

  const id = ctx.params.id;
  if (!id) return noStoreJson({ ok: false, error: "INVALID_ID" }, 400);

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("to_user_id", auth.user.id);

  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);
  return noStoreJson({ ok: true });
}

