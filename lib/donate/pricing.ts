import { createSupabaseClient } from "@/lib/supabase";

export const DONATE_PRICE_BASE = 1680;
export const DONATE_DAILY_INCREASE = 5;

type RecordRow = {
  id: string;
  created_at: string | null;
  payload: Record<string, unknown> | null;
  content: string | null;
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
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

function dayFromKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export async function getDonatePrice() {
  const supabase = createSupabaseClient();
  const todayKey = toDateKey(new Date());
  const today = dayFromKey(todayKey);
  const nextUpdateAt = new Date(today.getTime() + 86_400_000).toISOString();

  const { data } = await supabase
    .from("records")
    .select("id, created_at, payload, content")
    .eq("type", "donate_price")
    .order("created_at", { ascending: false })
    .limit(1);

  const row = Array.isArray(data) && data.length ? (data[0] as RecordRow) : null;
  let price = DONATE_PRICE_BASE;
  let priceDate = todayKey;
  let shouldInsert = true;

  if (row) {
    const payload = parsePayload(row);
    const lastPrice = Number(payload.price);
    const lastDateRaw = typeof payload.priceDate === "string" ? payload.priceDate : null;
    const lastDate = lastDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(lastDateRaw) ? lastDateRaw : null;

    if (Number.isFinite(lastPrice) && lastDate) {
      const lastDay = dayFromKey(lastDate);
      const diffDays = Math.max(0, Math.floor((today.getTime() - lastDay.getTime()) / 86_400_000));
      if (diffDays === 0) {
        price = lastPrice;
        priceDate = lastDate;
        shouldInsert = false;
      } else {
        price = lastPrice + diffDays * DONATE_DAILY_INCREASE;
        priceDate = todayKey;
      }
    }
  }

  if (shouldInsert) {
    const payload = {
      price,
      priceDate,
      basePrice: DONATE_PRICE_BASE,
      dailyIncrease: DONATE_DAILY_INCREASE
    };
    await supabase.from("records").insert([
      {
        type: "donate_price",
        payload,
        content: JSON.stringify(payload)
      }
    ]);
  }

  return { price, priceDate, nextUpdateAt };
}
