import { NextRequest, NextResponse } from "next/server";

import { getSystemAuth } from "@/lib/system/auth";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";

function noStoreJson(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

async function userCanView(admin: ReturnType<typeof supabaseAdmin>, userId: string) {
  const { data } = await admin
    .from("ladder_authorizations")
    .select("enabled")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data?.enabled);
}

export async function GET(_req: NextRequest) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);

  const admin = supabaseAdmin();
  if (auth.user.role !== "admin") {
    const enabled = await userCanView(admin, auth.user.id);
    if (!enabled) return noStoreJson({ ok: true, item: null });
  }

  const { data: snap } = await admin
    .from("ladder_snapshots")
    .select("id,storage_bucket,storage_path,captured_at")
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!snap) return noStoreJson({ ok: true, item: null });

  const { data: signed } = await admin.storage
    .from(snap.storage_bucket)
    .createSignedUrl(snap.storage_path, 180);

  if (!signed?.signedUrl) return noStoreJson({ ok: true, item: null });

  return noStoreJson({
    ok: true,
    item: { id: snap.id, url: signed.signedUrl, captured_at: snap.captured_at }
  });
}

