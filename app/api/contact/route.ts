import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export async function POST(req: NextRequest) {
  try {
    // env 自检（避免线上继续“Service unavailable”猜谜）
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => null)) as any;
    if (!body || !isValidEmail(body.email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    // 兼容 phone 对象
    const phone =
      body?.phone && typeof body.phone === "object"
        ? {
            country: typeof body.phone.country === "string" ? body.phone.country : "",
            dialCode: typeof body.phone.dialCode === "string" ? body.phone.dialCode : "",
            e164: typeof body.phone.e164 === "string" ? body.phone.e164 : "",
            nationalNumber:
              typeof body.phone.nationalNumber === "string" ? body.phone.nationalNumber : "",
          }
        : null;

    // 你原来把 phone 拼到 message 里，这里保留
    const baseMessage = typeof body.message === "string" ? body.message : "";
    const phoneNote = phone?.e164
      ? `\n\n[Phone]\nE.164: ${phone.e164}\nCountry: ${phone.country || "-"}\nDial: ${phone.dialCode || "-"}\nNational: ${phone.nationalNumber || "-"}`
      : "";

    const message = (baseMessage + phoneNote).trim() || null;

    // 你原来的 payload 结构保留（以后方便追溯）
    const payload = {
      type: "contact",
      name: typeof body.name === "string" ? body.name : null,
      email: body.email,
      wechat: typeof body.wechat === "string" ? body.wechat : null,
      intent: typeof body.intent === "string" ? body.intent : null,
      message,
      instruments: Array.isArray(body.instruments) ? body.instruments : [],
      bottleneck: typeof body.bottleneck === "string" ? body.bottleneck : null,
      phone,
      raw: body,
      receivedAt: new Date().toISOString(),
    };

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const supabase = createSupabaseAdminClient();

    // ✅ 写入 contact_submissions（你已建表）
    const { error } = await supabase.from("contact_submissions").insert({
      name: payload.name,
      email: payload.email,
      wechat: payload.wechat,
      intent: payload.intent,
      bottleneck: payload.bottleneck,
      // contact_submissions 里 instruments 是 text[] 的话，这里是数组就能直接写
      instruments: payload.instruments,
      message: payload.message,
      locale: typeof body.locale === "string" ? body.locale : null,
      ip,
      user_agent: userAgent,
      payload, // 需要表里有 payload jsonb
    });

    if (error) {
      console.error("Supabase insert failed:", error);
      // 调试期建议返回真实错误，方便你立刻定位
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("api/contact failed:", error);
    return NextResponse.json(
      { error: error?.message ?? "Service unavailable." },
      { status: 500 }
    );
  }
}
