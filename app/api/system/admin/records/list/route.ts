import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdmin } from "@/lib/system/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TypeParam = z.enum(["donate", "contact", "enrollment"]);

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireSuperAdmin();
    const type = TypeParam.safeParse(req.nextUrl.searchParams.get("type"));
    if (!type.success) return json({ ok: false, error: "INVALID_TYPE" }, 400);

    const q = await supabase
      .from("records")
      .select("id,type,created_at,email,name,payload,content")
      .eq("type", type.data)
      .order("created_at", { ascending: false })
      .limit(200);

    if (q.error) return json({ ok: false, error: q.error.message }, 500);
    return json({ ok: true, items: q.data || [] });
  } catch (e: any) {
    const code = String(e?.code || "UNAUTHORIZED");
    const status = code === "FORBIDDEN" ? 403 : code === "FROZEN" ? 403 : 401;
    return json({ ok: false, error: code }, status);
  }
}

