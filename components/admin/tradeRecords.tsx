"use client";

import { useEffect, useState } from "react";

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

const STORAGE_KEY_TRADE = "fxlocus_admin_trade_records_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useTradeRecords() {
  const [records, setRecords] = useState<TradeRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const r = safeParse<TradeRecord[]>(localStorage.getItem(STORAGE_KEY_TRADE), []);
    setRecords(r);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    try {
      // 为了防止图片的 base64 数据过大撑爆 localStorage，这里只持久化元数据，
      // 图片字段在本地运行期保留，但不写入 localStorage。
      const lightRecords = records.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        stageStartDate: r.stageStartDate,
        currentStage: r.currentStage,
        tradeResult: r.tradeResult,
        remark: r.remark,
        createdAt: r.createdAt
      }));
      window.localStorage.setItem(STORAGE_KEY_TRADE, JSON.stringify(lightRecords));
    } catch (err) {
      // 如果仍然超过配额，忽略错误，避免页面崩溃。
      console.warn("保存交易记录到 localStorage 失败，已忽略：", err);
    }
  }, [records, loaded]);

  function addRecord(payload: Omit<TradeRecord, "id" | "createdAt">) {
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    const rec: TradeRecord = { id, createdAt, ...payload };
    setRecords((prev) => [rec, ...prev]);
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
