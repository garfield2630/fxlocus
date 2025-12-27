import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const email = String(body?.email ?? "").trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("donation_applications").insert({
      email,
      name: body?.name ?? null,
      wechat: body?.wechat ?? null,
      locale: body?.locale ?? null,
      ip,
      user_agent: userAgent,
      payload: body
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, success: true });
  } catch (e: any) {
    console.error("api/donate failed:", e);
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
