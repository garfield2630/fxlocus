"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";

export interface TradeRecord {
  id: string;
  studentId: string;
  stageStartDate: string; // yyyy-MM-dd
  currentStage: string;
  tradeResult: string;
  strategyImage?: string; // Data URL or file name
  weeklySummaryImage?: string; // Data URL or file name
  remark?: string;
  createdAt: string;
}

const TRADE_TYPE = "admin_trade_record";

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

function toRecord(row: RecordRow): TradeRecord {
  const payload = parsePayload(row);
  return {
    id: row.id,
    studentId: typeof payload.studentId === "string" ? payload.studentId : "",
    stageStartDate:
      typeof payload.stageStartDate === "string" ? payload.stageStartDate : "",
    currentStage: typeof payload.currentStage === "string" ? payload.currentStage : "",
    tradeResult: typeof payload.tradeResult === "string" ? payload.tradeResult : "",
    strategyImage:
      typeof payload.strategyImage === "string" ? payload.strategyImage : undefined,
    weeklySummaryImage:
      typeof payload.weeklySummaryImage === "string" ? payload.weeklySummaryImage : undefined,
    remark: typeof payload.remark === "string" ? payload.remark : undefined,
    createdAt:
      typeof payload.createdAt === "string"
        ? payload.createdAt
        : row.created_at || new Date().toISOString()
  };
}

export function useTradeRecords() {
  const [records, setRecords] = useState<TradeRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const supabase = createSupabaseClient();

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("records")
          .select("id,type,payload,content,created_at")
          .eq("type", TRADE_TYPE)
          .order("created_at", { ascending: false });

        if (!alive) return;
        if (!error) setRecords((data || []).map(toRecord));
      } finally {
        if (alive) setLoaded(true);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  async function addRecord(payload: Omit<TradeRecord, "id" | "createdAt">) {
    const supabase = createSupabaseClient();
    const recordPayload = {
      ...payload,
      createdAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("records")
      .insert([
        {
          type: TRADE_TYPE,
          payload: recordPayload,
          content: JSON.stringify(recordPayload)
        }
      ])
      .select("id,type,payload,content,created_at")
      .maybeSingle();

    if (!error && data) {
      setRecords((prev) => [toRecord(data), ...prev]);
    }
  }

  function getLatestForStudent(studentId: string): TradeRecord | undefined {
    return records
      .filter((r) => r.studentId === studentId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  }

  function getAllForStudent(studentId: string): TradeRecord[] {
    return records
      .filter((r) => r.studentId === studentId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  return {
    loaded,
    records,
    addRecord,
    getLatestForStudent,
    getAllForStudent
  };
}
