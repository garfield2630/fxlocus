import { NextRequest, NextResponse } from "next/server";

import { requireSystemUser } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(_req: NextRequest, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  if (!id) return noStoreJson({ ok: false, error: "INVALID_ID" }, 400);

  try {
    const { user, supabase } = await requireSystemUser();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() } as any)
      .eq("id", id)
      .eq("to_user_id", user.id);

    if (error) return noStoreJson({ ok: false, error: error.message }, 500);
    return noStoreJson({ ok: true });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return noStoreJson({ ok: false, error: code }, status);
  }
}
