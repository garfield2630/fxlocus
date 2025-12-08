"use client";

import { useEffect, useState } from "react";

export type Gender = "male" | "female" | "unknown";

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  trainingStartDate: string; // ISO yyyy-MM-dd
   level?: string;
  birthday?: string; // ISO yyyy-MM-dd
  currentStage?: string;
}

export interface DismissedStudent extends Student {
  dismissedAt: string; // ISO datetime
  reason: string;
}

const STORAGE_KEY_STUDENTS = "fxlocus_admin_students_v1";
const STORAGE_KEY_DISMISSED = "fxlocus_admin_dismissed_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function dedupeById<T extends { id: string }>(list: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of list) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

function saveToStorage(students: Student[], dismissed: DismissedStudent[]) {
  if (typeof window === "undefined") return;
  const safeStudents = dedupeById(students);
  const safeDismissed = dedupeById(dismissed);
  window.localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(safeStudents));
  window.localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(safeDismissed));
}

export function useStudentData() {
  const [students, setStudents] = useState<Student[]>([]);
  const [dismissed, setDismissed] = useState<DismissedStudent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = dedupeById(
      safeParse<Student[]>(localStorage.getItem(STORAGE_KEY_STUDENTS), [])
    );
    const d = dedupeById(
      safeParse<DismissedStudent[]>(localStorage.getItem(STORAGE_KEY_DISMISSED), [])
    );
    setStudents(s);
    setDismissed(d);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveToStorage(students, dismissed);
  }, [students, dismissed, loaded]);

  function addStudent(payload: Omit<Student, "id">) {
    const id = Date.now().toString();
    setStudents((prev) => [{ id, ...payload }, ...prev]);
  }

  function updateStudent(id: string, patch: Partial<Student>) {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function dismissStudent(id: string, reason: string) {
    setStudents((prev) => {
      const target = prev.find((s) => s.id === id);
      const rest = prev.filter((s) => s.id !== id);
      if (!target) return prev;
      const record: DismissedStudent = {
        ...target,
        dismissedAt: new Date().toISOString(),
        reason
      };
      setDismissed((d) => [record, ...d]);
      return rest;
    });
  }

  function restoreStudent(id: string) {
    setDismissed((prev) => {
      const target = prev.find((s) => s.id === id);
      const rest = prev.filter((s) => s.id !== id);
      if (!target) return prev;
      const { dismissedAt, reason, ...student } = target;
      setStudents((s) => [student, ...s]);
      return rest;
    });
  }

  function deleteDismissed(id: string) {
    setDismissed((prev) => prev.filter((s) => s.id !== id));
  }

  function batchRestore(ids: string[]) {
    Array.from(new Set(ids)).forEach((id) => restoreStudent(id));
  }

  function batchDelete(ids: string[]) {
    setDismissed((prev) => prev.filter((s) => !ids.includes(s.id)));
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
