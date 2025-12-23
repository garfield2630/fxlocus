import { NextResponse } from "next/server";

import { createSupabaseClient } from "@/lib/supabase";

function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

async function insertRecord(payload: Record<string, unknown>) {
  const supabase = createSupabaseClient();
  const content = JSON.stringify(payload);
  const email = typeof payload.email === "string" ? payload.email : undefined;
  const name = typeof payload.name === "string" ? payload.name : undefined;
  const baseInsert = {
    type: "contact",
    email,
    name,
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
    const body = (await request.json().catch(() => null)) as any;

    if (!body || !isValidEmail(body.email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const phone =
      body?.phone && typeof body.phone === "object"
        ? {
            country: typeof body.phone.country === "string" ? body.phone.country : "",
            dialCode: typeof body.phone.dialCode === "string" ? body.phone.dialCode : "",
            e164: typeof body.phone.e164 === "string" ? body.phone.e164 : "",
            nationalNumber: typeof body.phone.nationalNumber === "string" ? body.phone.nationalNumber : ""
          }
        : null;

    const baseMessage = typeof body.message === "string" ? body.message : "";
    const phoneNote = phone?.e164
      ? `\n\n[Phone]\nE.164: ${phone.e164}\nCountry: ${phone.country || "-"}\nDial: ${phone.dialCode || "-"}\nNational: ${phone.nationalNumber || "-"}`
      : "";

    const payload = {
      type: "contact",
      name: typeof body.name === "string" ? body.name : null,
      email: body.email,
      wechat: typeof body.wechat === "string" ? body.wechat : null,
      intent: typeof body.intent === "string" ? body.intent : null,
      message: (baseMessage + phoneNote).trim() || null,
      instruments: Array.isArray(body.instruments) ? body.instruments : [],
      bottleneck: typeof body.bottleneck === "string" ? body.bottleneck : null,
      phone,
      raw: body,
      receivedAt: new Date().toISOString()
    };

    const { error } = await insertRecord(payload);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Service unavailable." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Service unavailable." }, { status: 500 });
  }
}
