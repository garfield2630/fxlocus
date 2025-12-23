"use client";

import { useEffect, useState } from "react";
import type { Gender } from "@/components/admin/studentData";
import { createSupabaseClient } from "@/lib/supabase";

export interface Leader {
  id: string;
  traderId: string;
  name: string;
  gender: Gender;
  level?: string;
  teamCreateDate?: string; // yyyy-MM-dd
}

const LEADER_TYPE = "admin_leader";

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

function toLeader(row: RecordRow): Leader {
  const payload = parsePayload(row);
  return {
    id: row.id,
    traderId: typeof payload.traderId === "string" ? payload.traderId : "",
    name: typeof payload.name === "string" ? payload.name : "",
    gender: normalizeGender(payload.gender),
    level: typeof payload.level === "string" ? payload.level : undefined,
    teamCreateDate:
      typeof payload.teamCreateDate === "string" ? payload.teamCreateDate : undefined
  };
}

export function useLeaderData() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const supabase = createSupabaseClient();

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("records")
          .select("id,type,payload,content,created_at")
          .eq("type", LEADER_TYPE)
          .order("created_at", { ascending: false });

        if (!alive) return;
        if (!error) setLeaders((data || []).map(toLeader));
      } finally {
        if (alive) setLoaded(true);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  async function addLeader(payload: Omit<Leader, "id">) {
    const supabase = createSupabaseClient();
    const recordPayload = {
      ...payload,
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("records")
      .insert([
        {
          type: LEADER_TYPE,
          payload: recordPayload,
          content: JSON.stringify(recordPayload)
        }
      ])
      .select("id,type,payload,content,created_at")
      .maybeSingle();

    if (!error && data) {
      setLeaders((prev) => [toLeader(data), ...prev]);
    }
  }

  async function updateLeader(id: string, patch: Partial<Leader>) {
    const current = leaders.find((l) => l.id === id);
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
      setLeaders((prev) => prev.map((l) => (l.id === id ? toLeader(data) : l)));
    }
  }

  async function deleteLeader(id: string) {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("records").delete().eq("id", id);
    if (!error) {
      setLeaders((prev) => prev.filter((l) => l.id !== id));
    }
  }

  return {
    loaded,
    leaders,
    addLeader,
    updateLeader,
    deleteLeader
  };
}
