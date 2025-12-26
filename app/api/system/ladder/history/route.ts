import { NextRequest, NextResponse } from "next/server";

import { getSystemAuth } from "@/lib/system/auth";
import { isAdminRole } from "@/lib/system/roles";
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

export async function GET(req: NextRequest) {
  const auth = await getSystemAuth();
  if (!auth.ok) return noStoreJson({ ok: false, error: auth.reason }, 401);

  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 20)));

  const admin = supabaseAdmin();
  if (!isAdminRole(auth.user.role)) {
    const enabled = await userCanView(admin, auth.user.id);
    if (!enabled) return noStoreJson({ ok: true, items: [] });
  }

  const { data: snaps, error } = await admin
    .from("ladder_snapshots")
    .select("id,storage_bucket,storage_path,captured_at")
    .order("captured_at", { ascending: false })
    .limit(limit);

  if (error) return noStoreJson({ ok: false, error: "DB_ERROR" }, 500);

  const items = await Promise.all(
    (snaps || []).map(async (snap: any) => {
      const { data: signed } = await admin.storage
        .from(snap.storage_bucket)
        .createSignedUrl(snap.storage_path, 180);
      return signed?.signedUrl
        ? { id: snap.id, url: signed.signedUrl, captured_at: snap.captured_at }
        : null;
    })
  );

  return noStoreJson({ ok: true, items: items.filter(Boolean) });
}

