"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";

export type Gender = "male" | "female" | "unknown";

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  trainingStartDate: string; // yyyy-MM-dd
  level?: string;
  birthday?: string; // yyyy-MM-dd
  currentStage?: string;
}

export interface DismissedStudent extends Student {
  dismissedAt: string; // ISO datetime
  reason: string;
}

const STUDENT_TYPE = "admin_student";
const DISMISSED_TYPE = "admin_student_dismissed";

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

function toStudent(row: RecordRow): Student {
  const payload = parsePayload(row);
  return {
    id: row.id,
    name: typeof payload.name === "string" ? payload.name : "",
    gender: normalizeGender(payload.gender),
    trainingStartDate:
      typeof payload.trainingStartDate === "string" ? payload.trainingStartDate : "",
    level: typeof payload.level === "string" ? payload.level : undefined,
    birthday: typeof payload.birthday === "string" ? payload.birthday : undefined,
    currentStage: typeof payload.currentStage === "string" ? payload.currentStage : undefined
  };
}

function toDismissed(row: RecordRow): DismissedStudent {
  const payload = parsePayload(row);
  return {
    ...toStudent(row),
    dismissedAt:
      typeof payload.dismissedAt === "string"
        ? payload.dismissedAt
        : row.created_at || new Date().toISOString(),
    reason: typeof payload.reason === "string" ? payload.reason : ""
  };
}

export function useStudentData() {
  const [students, setStudents] = useState<Student[]>([]);
  const [dismissed, setDismissed] = useState<DismissedStudent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const supabase = createSupabaseClient();

    const load = async () => {
      try {
        const [studentsRes, dismissedRes] = await Promise.all([
          supabase
            .from("records")
            .select("id,type,payload,content,created_at")
            .eq("type", STUDENT_TYPE)
            .order("created_at", { ascending: false }),
          supabase
            .from("records")
            .select("id,type,payload,content,created_at")
            .eq("type", DISMISSED_TYPE)
            .order("created_at", { ascending: false })
        ]);

        if (!alive) return;

        if (!studentsRes.error) {
          setStudents((studentsRes.data || []).map(toStudent));
        }
        if (!dismissedRes.error) {
          setDismissed((dismissedRes.data || []).map(toDismissed));
        }
      } finally {
        if (alive) setLoaded(true);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  async function addStudent(payload: Omit<Student, "id">) {
    const supabase = createSupabaseClient();
    const recordPayload = {
      ...payload,
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("records")
      .insert([
        {
          type: STUDENT_TYPE,
          payload: recordPayload,
          content: JSON.stringify(recordPayload)
        }
      ])
      .select("id,type,payload,content,created_at")
      .maybeSingle();

    if (!error && data) {
      setStudents((prev) => [toStudent(data), ...prev]);
    }
  }

  async function updateStudent(id: string, patch: Partial<Student>) {
    const current = students.find((s) => s.id === id);
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
      setStudents((prev) => prev.map((s) => (s.id === id ? toStudent(data) : s)));
    }
  }

  async function dismissStudent(id: string, reason: string) {
    const target = students.find((s) => s.id === id);
    if (!target) return;

    const recordPayload = {
      ...target,
      dismissedAt: new Date().toISOString(),
      reason,
      updatedAt: new Date().toISOString()
    };

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("records")
      .update({
        type: DISMISSED_TYPE,
        payload: recordPayload,
        content: JSON.stringify(recordPayload)
      })
      .eq("id", id)
      .select("id,type,payload,content,created_at")
      .maybeSingle();

    if (!error && data) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setDismissed((prev) => [toDismissed(data), ...prev]);
    }
  }

  async function restoreStudent(id: string) {
    const target = dismissed.find((s) => s.id === id);
    if (!target) return;

    const { dismissedAt, reason, ...student } = target;
    const recordPayload = {
      ...student,
      updatedAt: new Date().toISOString()
    };

    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("records")
      .update({
        type: STUDENT_TYPE,
        payload: recordPayload,
        content: JSON.stringify(recordPayload)
      })
      .eq("id", id)
      .select("id,type,payload,content,created_at")
      .maybeSingle();

    if (!error && data) {
      setDismissed((prev) => prev.filter((s) => s.id !== id));
      setStudents((prev) => [toStudent(data), ...prev]);
    }
  }

  async function deleteDismissed(id: string) {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("records").delete().eq("id", id);
    if (!error) {
      setDismissed((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function batchRestore(ids: string[]) {
    const unique = Array.from(new Set(ids));
    await Promise.all(unique.map((id) => restoreStudent(id)));
  }

  async function batchDelete(ids: string[]) {
    const unique = Array.from(new Set(ids));
    await Promise.all(unique.map((id) => deleteDismissed(id)));
  }

  return {
    loaded,
    students,
    dismissed,
    addStudent,
    updateStudent,
    dismissStudent,
    restoreStudent,
    deleteDismissed,
    batchRestore,
    batchDelete
  };
}
