"use client";

import { useCallback, useEffect, useState } from "react";
import { mockTests } from "./mock-data";
import type { Test, Question } from "./types";
import { getSupabase } from "./supabase";

const KEY = "edudoc.tests";

export interface ManagedTest extends Test {
  active: boolean;
  questionsPerAttempt: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

function normalize(t: Partial<ManagedTest> & Test): ManagedTest {
  const bankSize = t.questions?.length ?? 0;
  const per =
    typeof t.questionsPerAttempt === "number" && t.questionsPerAttempt > 0
      ? t.questionsPerAttempt
      : t.totalQuestions || bankSize || 10;
  return {
    ...(t as Test),
    active: t.active ?? true,
    questionsPerAttempt: Math.max(1, Math.min(per, Math.max(bankSize, per))),
    shuffleQuestions: t.shuffleQuestions ?? true,
    shuffleOptions: t.shuffleOptions ?? true,
  };
}

function seed(): ManagedTest[] {
  return mockTests.map((t) =>
    normalize({ ...(t as Test), active: true } as ManagedTest)
  );
}

type DbRow = {
  id: string;
  title: string;
  subject: string;
  type: Test["type"];
  duration: number;
  cost: number;
  total_questions: number;
  require_video: boolean;
  video_url: string | null;
  passing_score: number;
  description: string;
  questions: Question[];
  active: boolean;
  questions_per_attempt: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
};

const toTest = (r: DbRow): ManagedTest =>
  normalize({
    id: r.id,
    title: r.title,
    subject: r.subject,
    type: r.type,
    duration: r.duration,
    cost: r.cost,
    totalQuestions: r.total_questions,
    requireVideo: r.require_video,
    videoUrl: r.video_url ?? undefined,
    passingScore: r.passing_score,
    description: r.description,
    questions: Array.isArray(r.questions) ? r.questions : [],
    active: r.active,
    questionsPerAttempt: r.questions_per_attempt,
    shuffleQuestions: r.shuffle_questions,
    shuffleOptions: r.shuffle_options,
  });

const toDb = (t: ManagedTest) => ({
  id: t.id,
  title: t.title,
  subject: t.subject,
  type: t.type,
  duration: t.duration,
  cost: t.cost,
  total_questions: t.totalQuestions,
  require_video: t.requireVideo,
  video_url: t.videoUrl ?? null,
  passing_score: t.passingScore,
  description: t.description,
  questions: t.questions ?? [],
  active: t.active,
  questions_per_attempt: t.questionsPerAttempt,
  shuffle_questions: t.shuffleQuestions,
  shuffle_options: t.shuffleOptions,
});

function readLS(): ManagedTest[] {
  if (typeof window === "undefined") return seed();
  const raw = localStorage.getItem(KEY);
  if (!raw) return seed();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return (parsed as Partial<ManagedTest>[]).map((t) =>
        normalize(t as Partial<ManagedTest> & Test)
      );
  } catch {}
  return seed();
}
function writeLS(list: ManagedTest[]) {
  if (typeof window !== "undefined")
    localStorage.setItem(KEY, JSON.stringify(list));
}

export function useTestsStore() {
  const [list, setList] = useState<ManagedTest[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setList(readLS());
      setLoaded(true);
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) setList(readLS());
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    let cancelled = false;
    const refresh = async () => {
      const { data } = await supa
        .from("quiz_tests")
        .select("*")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const rows = (data as DbRow[]) ?? [];
      setList(rows.length > 0 ? rows.map(toTest) : seed());
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`qt_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_tests" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const upsert = useCallback((t: ManagedTest) => {
    const supa = getSupabase();
    const n = normalize(t);
    setList((prev) =>
      prev.some((x) => x.id === n.id)
        ? prev.map((x) => (x.id === n.id ? n : x))
        : [n, ...prev]
    );
    if (supa) void supa.from("quiz_tests").upsert(toDb(n));
    else writeLS([n, ...readLS().filter((x) => x.id !== n.id)]);
  }, []);

  const toggleActive = useCallback((id: string) => {
    const supa = getSupabase();
    setList((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, active: !t.active } : t
      );
      if (!supa) writeLS(next);
      return next;
    });
    if (supa) {
      void (async () => {
        const cur = (
          await supa.from("quiz_tests").select("active").eq("id", id).maybeSingle()
        ).data as { active: boolean } | null;
        if (cur)
          await supa
            .from("quiz_tests")
            .update({ active: !cur.active })
            .eq("id", id);
      })();
    }
  }, []);

  const remove = useCallback((id: string) => {
    const supa = getSupabase();
    setList((prev) => prev.filter((t) => t.id !== id));
    if (supa) void supa.from("quiz_tests").delete().eq("id", id);
    else writeLS(readLS().filter((t) => t.id !== id));
  }, []);

  const importMany = useCallback((tests: ManagedTest[]) => {
    const supa = getSupabase();
    const normed = tests.map(normalize);
    setList((prev) => [...normed, ...prev]);
    if (supa) {
      void supa.from("quiz_tests").upsert(normed.map(toDb));
    } else {
      writeLS([...normed, ...readLS()]);
    }
  }, []);

  const reset = useCallback(() => {
    setList(seed());
    const supa = getSupabase();
    if (!supa && typeof window !== "undefined") localStorage.removeItem(KEY);
  }, []);

  return { list, upsert, toggleActive, remove, importMany, reset, loaded };
}
