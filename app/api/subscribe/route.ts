import { NextResponse } from "next/server";

import { createSupabaseClient } from "@/lib/supabase";

async function insertRecord(payload: Record<string, unknown>) {
  const supabase = createSupabaseClient();
  const content = JSON.stringify(payload);
  const email = typeof payload.email === "string" ? payload.email : undefined;
  const baseInsert = {
    type: "subscribe",
    email,
    payload,
    content
  };

  const { data, error } = await supabase
    .from("records")
    .insert([baseInsert])
    .select("id, created_at")
    .maybeSingle();

  if (!error) return { data, error };

  const fallback = await supabase
    .from("records")
    .insert([{ content }])
    .select("id, created_at")
    .maybeSingle();

  return fallback;
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
