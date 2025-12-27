import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || "LOGOUT_FAILED" }, 500);
  }
}

