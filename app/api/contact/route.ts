import { NextResponse } from "next/server";

function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
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

    const hasSupabase =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (!hasSupabase) {
      return NextResponse.json({ success: true, demo: true });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );

    const { error: insertError } = await supabase.from("contact_requests").insert([
      {
        name: typeof body.name === "string" ? body.name : null,
        email: body.email,
        wechat: typeof body.wechat === "string" ? body.wechat : null,
        intent: typeof body.intent === "string" ? body.intent : null,
        message: (baseMessage + phoneNote).trim() || null,
        instruments: Array.isArray(body.instruments) ? body.instruments : [],
        bottleneck: typeof body.bottleneck === "string" ? body.bottleneck : null
      }
    ]);

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ success: true, demo: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Service unavailable." }, { status: 500 });
  }
}
