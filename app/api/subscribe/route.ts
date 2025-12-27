import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function insertRecord(payload: Record<string, unknown>) {
  const supabase = createSupabaseAdminClient();
  const content = JSON.stringify(payload);
  const email = typeof payload.email === "string" ? payload.email : undefined;
  const baseInsert = {
    type: "subscribe",
    email,
    payload,
    content
  };

  const { error } = await supabase.from("records").insert([baseInsert]);
  if (!error) return { error: null };

  const fallback = await supabase.from("records").insert([{ content }]);
  return { error: fallback.error };
}

export async function POST(request: Request) {
  try {
    const { email, message } = await request.json().catch(() => ({}));

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "邮箱为必填项。" }, { status: 400 });
    }

    const payload = {
      type: "subscribe",
      email: email.trim(),
      message: typeof message === "string" ? message.trim() : null,
      receivedAt: new Date().toISOString()
    };

    const { error } = await insertRecord(payload);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "服务暂时不可用，请稍后重试。" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "服务暂时不可用，请稍后重试。" }, { status: 500 });
  }
}
