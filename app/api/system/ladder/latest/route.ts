import { NextResponse } from "next/server";

import { requireSystemUser } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const { user } = await requireSystemUser();
    const admin = supabaseAdmin();

    if (user.role !== "admin") {
      const auth = await admin
        .from("ladder_authorizations")
        .select("status,enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      const status = String(auth.data?.status || "none");
      if (!auth.data || status !== "approved" || !auth.data.enabled) {
        return json({ ok: true, status, url: null });
      }
    }

    const snap = await admin
      .from("ladder_snapshots")
      .select("storage_bucket,storage_path,captured_at")
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!snap.data) return json({ ok: true, status: "approved", url: null });

    const signed = await admin.storage
      .from(snap.data.storage_bucket)
      .createSignedUrl(snap.data.storage_path, 60);

    if (signed.error) return json({ ok: false, error: signed.error.message }, 500);

    return json({
      ok: true,
      status: "approved",
      url: signed.data.signedUrl,
      captured_at: snap.data.captured_at
    });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

