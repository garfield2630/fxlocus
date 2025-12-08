"use client";

import { useEffect, useState } from "react";
import type { Gender } from "@/components/admin/studentData";

export interface Trader {
  id: string;
  studentId: string;
  name: string;
  gender: Gender;
  level?: string;
  accountType?: string;
  passDate?: string; // yyyy-MM-dd
}

const STORAGE_KEY_TRADERS = "fxlocus_admin_traders_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useTraderData() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = safeParse<Trader[]>(localStorage.getItem(STORAGE_KEY_TRADERS), []);
    setTraders(t);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY_TRADERS, JSON.stringify(traders));
  }, [traders, loaded]);

  function addTrader(payload: Omit<Trader, "id">) {
    const id = Date.now().toString();
    setTraders((prev) => [{ id, ...payload }, ...prev]);
  }

  function updateTrader(id: string, patch: Partial<Trader>) {
    setTraders((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function deleteTrader(id: string) {
    setTraders((prev) => prev.filter((t) => t.id !== id));
  }

  return {
    loaded,
    traders,
    addTrader,
    updateTrader,
    deleteTrader
  };
}
