import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const { supabase } = await requireAdmin();

    const q = await supabase
      .from("file_access_requests")
      .select("user_id,file_id,status,requested_at")
      .eq("status", "requested")
      .order("requested_at", { ascending: false })
      .limit(500);

    if (q.error) return json({ ok: false, error: q.error.message }, 500);

    const rows = q.data || [];
    const userIds = Array.from(new Set(rows.map((r: any) => String(r.user_id)).filter(Boolean)));
    const fileIds = Array.from(new Set(rows.map((r: any) => String(r.file_id)).filter(Boolean)));

    const [usersRes, filesRes] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id,full_name,email,phone").in("id", userIds)
        : Promise.resolve({ data: [], error: null } as any),
      fileIds.length
        ? supabase
            .from("files")
            .select("id,category,name,description,size_bytes,mime_type,created_at")
            .in("id", fileIds)
        : Promise.resolve({ data: [], error: null } as any)
    ]);

    if (usersRes.error) return json({ ok: false, error: usersRes.error.message }, 500);
    if (filesRes.error) return json({ ok: false, error: filesRes.error.message }, 500);

    const usersById = new Map((usersRes.data || []).map((u: any) => [u.id, u]));
    const filesById = new Map((filesRes.data || []).map((f: any) => [f.id, f]));

    const items = rows.map((r: any) => ({
      user_id: r.user_id,
      file_id: r.file_id,
      status: r.status,
      requested_at: r.requested_at,
      user: usersById.get(r.user_id) || null,
      file: filesById.get(r.file_id) || null
    }));

    return json({ ok: true, items });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

