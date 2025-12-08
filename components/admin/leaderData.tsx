"use client";

import { useEffect, useState } from "react";
import type { Gender } from "@/components/admin/studentData";

export interface Leader {
  id: string;
  traderId: string;
  name: string;
  gender: Gender;
  level?: string;
  teamCreateDate?: string; // yyyy-MM-dd
}

const STORAGE_KEY_LEADERS = "fxlocus_admin_leaders_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useLeaderData() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const l = safeParse<Leader[]>(localStorage.getItem(STORAGE_KEY_LEADERS), []);
    setLeaders(l);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY_LEADERS, JSON.stringify(leaders));
  }, [leaders, loaded]);

  function addLeader(payload: Omit<Leader, "id">) {
    const id = Date.now().toString();
    setLeaders((prev) => [{ id, ...payload }, ...prev]);
  }

  function updateLeader(id: string, patch: Partial<Leader>) {
    setLeaders((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function deleteLeader(id: string) {
    setLeaders((prev) => prev.filter((l) => l.id !== id));
  }

  return {
    loaded,
    leaders,
    addLeader,
    updateLeader,
    deleteLeader
  };
}
