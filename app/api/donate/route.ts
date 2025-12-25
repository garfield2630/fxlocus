import { NextRequest, NextResponse } from "next/server";

import { createSupabaseClient } from "@/lib/supabase";
import { getDonatePrice } from "@/lib/donate/pricing";

type RecordRow = {
  id: string;
  created_at: string | null;
  payload: Record<string, unknown> | null;
  content: string | null;
};

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

function parsePayload(row: RecordRow): Record<string, unknown> {
  if (row.payload && typeof row.payload === "object") return row.payload;
  if (row.content) {
    try {
      const parsed = JSON.parse(row.content) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      return {};
    }
  }
  return {};
}

async function insertRecord(payload: Record<string, unknown>) {
  const supabase = createSupabaseClient();
  const content = JSON.stringify(payload);
  const email = normalizeEmail(payload.email) || undefined;
  const name = typeof payload.name === "string" ? payload.name : undefined;
  const baseInsert = {
    type: "donate",
    email,
    name,
    payload,
    content
  };

  const { error } = await supabase.from("records").insert([baseInsert]);
  if (!error) return { error: null };

  const fallback = await supabase.from("records").insert([{ content }]);
  return { error: fallback.error };
}

async function hasRecentSubmission(email: string) {
  const supabase = createSupabaseClient();
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("records")
    .select("id, created_at")
    .eq("type", "donate")
    .eq("email", email)
    .gte("created_at", since)
    .limit(1);

  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

export async function GET(request: NextRequest) {
  const email = normalizeEmail(request.nextUrl.searchParams.get("email"));
  if (!email) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("records")
      .select("id, created_at, payload, content")
      .eq("type", "donate")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const items = (data || []).map((row: RecordRow) => {
      const payload = parsePayload(row);
      return {
        ...payload,
        id: row.id,
        createdAt:
          typeof payload.createdAt === "string"
            ? payload.createdAt
            : row.created_at || payload.receivedAt || new Date().toISOString()
      };
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const email = normalizeEmail(body?.email);

    if (!body || !email) {
      return NextResponse.json({ error: "Invalid email.", code: "invalid_email" }, { status: 400 });
    }

    if (await hasRecentSubmission(email)) {
      return NextResponse.json({ error: "Rate limited.", code: "rate_limited" }, { status: 429 });
    }

    const priceInfo = await getDonatePrice();
    const payload = {
      type: "donate",
      ...body,
      email,
      price: priceInfo.price,
      priceDate: priceInfo.priceDate,
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
