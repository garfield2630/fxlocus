"use client";

import { useEffect, useState } from "react";
import type { Gender } from "@/components/admin/studentData";
import { createSupabaseClient } from "@/lib/supabase";

export interface Trader {
  id: string;
  studentId: string;
  name: string;
  gender: Gender;
  level?: string;
  accountType?: string;
  passDate?: string; // yyyy-MM-dd
}

const TRADER_TYPE = "admin_trader";

type RecordRow = {
  id: string;
  type: string | null;
  payload: Record<string, unknown> | null;
  content: string | null;
  created_at: string | null;
};

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

function normalizeGender(value: unknown): Gender {
  if (value === "male" || value === "female" || value === "unknown") return value;
  return "unknown";
}

function toTrader(row: RecordRow): Trader {
  const payload = parsePayload(row);
  return {
    id: row.id,
    studentId: typeof payload.studentId === "string" ? payload.studentId : "",
    name: typeof payload.name === "string" ? payload.name : "",
    gender: normalizeGender(payload.gender),
    level: typeof payload.level === "string" ? payload.level : undefined,
    accountType: typeof payload.accountType === "string" ? payload.accountType : undefined,
    passDate: typeof payload.passDate === "string" ? payload.passDate : undefined
  };
}

export function useTraderData() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const supabase = createSupabaseClient();

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("records")
          .select("id,type,payload,content,created_at")
          .eq("type", TRADER_TYPE)
          .order("created_at", { ascending: false });

        if (!alive) return;
        if (!error) setTraders((data || []).map(toTrader));
      } finally {
        if (alive) setLoaded(true);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  async function addTrader(payload: Omit<Trader, "id">) {
    const supabase = createSupabaseClient();
    const recordPayload = {
      ...payload,
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("records")
      .insert([
        {
          type: TRADER_TYPE,
          payload: recordPayload,
          content: JSON.stringify(recordPayload)
        }
      ])
      .select("id,type,payload,content,created_at")
      .maybeSingle();

    if (!error && data) {
      setTraders((prev) => [toTrader(data), ...prev]);
    }
  }

  async function updateTrader(id: string, patch: Partial<Trader>) {
    const current = traders.find((t) => t.id === id);
    if (!current) return;

    const nextPayload = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    };

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("records")
      .update({
        payload: nextPayload,
        content: JSON.stringify(nextPayload)
      })
      .eq("id", id)
      .select("id,type,payload,content,created_at")
      .maybeSingle();

    if (!error && data) {
      setTraders((prev) => prev.map((t) => (t.id === id ? toTrader(data) : t)));
    }
  }

  async function deleteTrader(id: string) {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("records").delete().eq("id", id);
    if (!error) {
      setTraders((prev) => prev.filter((t) => t.id !== id));
    }
  }

  return {
    loaded,
    traders,
    addTrader,
    updateTrader,
    deleteTrader
  };
}
