"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";

const KEY = "edudoc.quiz_history";

export interface QuizAttemptRecord {
  id: string;
  testId: string;
  testTitle: string;
  subject: string;
  studentEmail: string;
  answered: number;
  correct: number;
  wrong: number;
  unanswered: number;
  totalQuestions: number;
  score: number;
  passed: boolean;
  durationUsedSec: number;
  tabSwitches: number;
  flagged: boolean;
  completedAt: string;
  cancelled: boolean;
}

type DbRow = {
  id: string;
  test_id: string;
  test_title: string;
  subject: string;
  student_email: string;
  answered: number;
  correct: number;
  wrong: number;
  unanswered: number;
  total_questions: number;
  score: number;
  passed: boolean;
  duration_used_sec: number;
  tab_switches: number;
  flagged: boolean;
  completed_at: string;
  cancelled: boolean;
};

const toRec = (r: DbRow): QuizAttemptRecord => ({
  id: r.id,
  testId: r.test_id,
  testTitle: r.test_title,
  subject: r.subject,
  studentEmail: r.student_email,
  answered: r.answered,
  correct: r.correct,
  wrong: r.wrong,
  unanswered: r.unanswered,
  totalQuestions: r.total_questions,
  score: r.score,
  passed: r.passed,
  durationUsedSec: r.duration_used_sec,
  tabSwitches: r.tab_switches,
  flagged: r.flagged,
  completedAt: r.completed_at,
  cancelled: r.cancelled,
});

function readLS(): QuizAttemptRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p as QuizAttemptRecord[];
  } catch {}
  return [];
}
function writeLS(list: QuizAttemptRecord[]) {
  if (typeof window !== "undefined") {
    const s = JSON.stringify(list.slice(0, 200));
    localStorage.setItem(KEY, s);
    queueMicrotask(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: s }));
    });
  }
}

export function recordAttempt(record: Omit<QuizAttemptRecord, "id">) {
  const supa = getSupabase();
  if (supa) {
    void (async () => {
      const { data: s } = await supa.auth.getSession();
      const uid = s.session?.user.id ?? null;
      await supa.from("quiz_attempts").insert({
        user_id: uid,
        student_email: record.studentEmail,
        test_id: record.testId,
        test_title: record.testTitle,
        subject: record.subject,
        answered: record.answered,
        correct: record.correct,
        wrong: record.wrong,
        unanswered: record.unanswered,
        total_questions: record.totalQuestions,
        score: record.score,
        passed: record.passed,
        duration_used_sec: record.durationUsedSec,
        tab_switches: record.tabSwitches,
        flagged: record.flagged,
        cancelled: record.cancelled,
        completed_at: record.completedAt,
      });
    })();
    return;
  }
  if (typeof window === "undefined") return;
  const full: QuizAttemptRecord = {
    ...record,
    id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
  writeLS([full, ...readLS()]);
}

export function useQuizHistory(email?: string) {
  const [all, setAll] = useState<QuizAttemptRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setAll(readLS());
      setLoaded(true);
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) setAll(readLS());
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    let cancelled = false;
    const refresh = async () => {
      let q = supa
        .from("quiz_attempts")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(200);
      if (email) q = q.ilike("student_email", email);
      const { data } = await q;
      if (cancelled) return;
      setAll(((data as DbRow[]) ?? []).map(toRec));
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`qa_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_attempts" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, [email]);

  const list = email
    ? all.filter((a) => a.studentEmail.toLowerCase() === email.toLowerCase())
    : all;

  const clear = useCallback(() => {
    const supa = getSupabase();
    setAll([]);
    if (supa) {
      let q = supa.from("quiz_attempts").delete().gte("completed_at", "1970-01-01");
      if (email) q = q.ilike("student_email", email);
      void q;
    } else if (typeof window !== "undefined") {
      localStorage.removeItem(KEY);
    }
  }, [email]);

  return { list, clear, loaded };
}
