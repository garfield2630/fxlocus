export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { requireSystemUser } from "@/lib/system/guard";
import { isAdminRole } from "@/lib/system/roles";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";
import { LADDER_IMAGE_URL, LADDER_REFRESH_MS } from "@/lib/system/ladderConfig";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const { user } = await requireSystemUser();
    const admin = supabaseAdmin();

    if (isAdminRole(user.role)) {
      return json({
        ok: true,
        authorized: true,
        status: "approved",
        imageUrl: LADDER_IMAGE_URL,
        refreshMs: LADDER_REFRESH_MS
      });
    }

    const { data: row, error } = await admin
      .from("ladder_authorizations")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return json({ ok: false, error: error.message }, 500);

    const status = String(row?.status || "none");
    const authorized = status === "approved";

    return json({
      ok: true,
      authorized,
      status,
      imageUrl: authorized ? LADDER_IMAGE_URL : null,
      refreshMs: LADDER_REFRESH_MS
    });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}
