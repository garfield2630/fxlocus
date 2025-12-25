import { NextResponse } from "next/server";

import { requireStudent } from "@/lib/system/guard";
import { supabaseAdmin } from "@/lib/system/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const { user } = await requireStudent();
    const admin = supabaseAdmin();

    const [filesRes, permsRes, reqRes] = await Promise.all([
      admin
        .from("files")
        .select("id,category,name,description,size_bytes,mime_type,created_at")
        .order("created_at", { ascending: false })
        .limit(300),
      admin.from("file_permissions").select("file_id").eq("user_id", user.id),
      admin
        .from("file_access_requests")
        .select("file_id,status,rejection_reason,requested_at,reviewed_at")
        .eq("user_id", user.id)
    ]);

    if (filesRes.error) return json({ ok: false, error: filesRes.error.message }, 500);
    if (permsRes.error) return json({ ok: false, error: permsRes.error.message }, 500);

    let requests: any[] = [];
    if (reqRes.error) {
      const msg = String(reqRes.error.message || "");
      if (!msg.toLowerCase().includes("does not exist")) {
        return json({ ok: false, error: reqRes.error.message }, 500);
      }
    } else {
      requests = reqRes.data || [];
    }

    const allowed = new Set((permsRes.data || []).map((p: any) => p.file_id).filter(Boolean));
    const reqByFile = new Map(requests.map((r: any) => [r.file_id, r]));

    const files = (filesRes.data || []).map((f: any) => {
      const req = reqByFile.get(f.id);
      return {
        ...f,
        can_download: allowed.has(f.id),
        request_status: req?.status || "none",
        rejection_reason: req?.rejection_reason || null,
        requested_at: req?.requested_at || null,
        reviewed_at: req?.reviewed_at || null
      };
    });

    return json({ ok: true, files });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}
