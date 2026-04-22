"use client";

import { useCallback, useEffect, useState } from "react";
import { logAudit } from "./audit-store";
import { mockTeachers } from "./mock-data";
import type { Teacher } from "./types";

const KEY = "edudoc.teacher_profiles";

export interface TeacherStats {
  penjelasan: number;
  interaktif: number;
  penguasaan: number;
  ketepatan: number;
  motivasi: number;
  kesabaran: number;
}

export interface TeacherProfile extends Teacher {
  photo?: string;
  description: string;
  stats: TeacherStats;
}

export const statLabels: Record<keyof TeacherStats, string> = {
  penjelasan: "Penjelasan",
  interaktif: "Interaktif",
  penguasaan: "Penguasaan Materi",
  ketepatan: "Ketepatan",
  motivasi: "Motivasi",
  kesabaran: "Kesabaran",
};

export const MAX_STAT = 10;

const seed: Record<string, Partial<TeacherStats> & { description: string }> = {
  t1: {
    description:
      "Alumni ITB Matematika, 8 tahun pengalaman mengajar UTBK. Spesialisasi aljabar, geometri analitik, dan trigonometri tingkat lanjut.",
    penjelasan: 9.2, interaktif: 8.5, penguasaan: 9.5, ketepatan: 9.0, motivasi: 8.8, kesabaran: 9.0,
  },
  t2: {
    description:
      "Alumni UI Kimia, peraih medali OSN. Mengajar kimia organik dan anorganik dengan pendekatan soal-centric dan studi kasus real.",
    penjelasan: 9.0, interaktif: 8.8, penguasaan: 9.5, ketepatan: 9.2, motivasi: 8.5, kesabaran: 8.8,
  },
  t3: {
    description:
      "Native-level fluency, sertifikasi IELTS 8.5. Fokus pada speaking confidence, writing structure, dan advanced vocabulary.",
    penjelasan: 9.5, interaktif: 9.5, penguasaan: 9.2, ketepatan: 9.0, motivasi: 9.6, kesabaran: 9.4,
  },
  t4: {
    description:
      "Master Teacher Fisika dengan 10+ tahun pengalaman. Kuat di listrik-magnet, mekanika, dan pembahasan soal Olimpiade.",
    penjelasan: 8.8, interaktif: 8.0, penguasaan: 9.5, ketepatan: 9.0, motivasi: 8.2, kesabaran: 8.6,
  },
  t5: {
    description:
      "Alumni UGM Biologi, riset di bidang fisiologi manusia. Mengajar dengan analogi lapangan dan visual anatomi interaktif.",
    penjelasan: 9.0, interaktif: 9.2, penguasaan: 9.0, ketepatan: 8.5, motivasi: 9.0, kesabaran: 9.5,
  },
};

function defaultStats(): TeacherStats {
  return {
    penjelasan: 8,
    interaktif: 8,
    penguasaan: 8,
    ketepatan: 8,
    motivasi: 8,
    kesabaran: 8,
  };
}

const STAT_KEYS: (keyof TeacherStats)[] = [
  "penjelasan",
  "interaktif",
  "penguasaan",
  "ketepatan",
  "motivasi",
  "kesabaran",
];

export function overallScore(s: TeacherStats): number {
  const sum = STAT_KEYS.reduce((acc, k) => {
    const v = s?.[k];
    return acc + (typeof v === "number" && Number.isFinite(v) ? v : 0);
  }, 0);
  return Math.round((sum / STAT_KEYS.length) * 10) / 10;
}

export const defaultTeachers: TeacherProfile[] = mockTeachers.map((t) => {
  const s = seed[t.id];
  const statsOnly: Partial<TeacherStats> = {};
  if (s) {
    if (typeof s.penjelasan === "number") statsOnly.penjelasan = s.penjelasan;
    if (typeof s.interaktif === "number") statsOnly.interaktif = s.interaktif;
    if (typeof s.penguasaan === "number") statsOnly.penguasaan = s.penguasaan;
    if (typeof s.ketepatan === "number") statsOnly.ketepatan = s.ketepatan;
    if (typeof s.motivasi === "number") statsOnly.motivasi = s.motivasi;
    if (typeof s.kesabaran === "number") statsOnly.kesabaran = s.kesabaran;
  }
  return {
    ...t,
    description: s?.description ?? "Guru berpengalaman di EduDoc.",
    stats: { ...defaultStats(), ...statsOnly },
  };
});

function migrateStats(s: Partial<TeacherStats> | undefined | null): TeacherStats {
  const base = defaultStats();
  if (!s) return base;
  const keys = Object.keys(base) as (keyof TeacherStats)[];
  const out: TeacherStats = { ...base };
  for (const k of keys) {
    const v = (s as Record<string, unknown>)[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      // migrate old 0-100 values to 0-10
      out[k] = v > 10 ? Math.round(v) / 10 : v;
    }
  }
  return out;
}

import { getSupabase } from "./supabase";

type DbRow = {
  id: string;
  name: string;
  email: string | null;
  subject: string;
  rating: number;
  students: number;
  sessions: number;
  status: "ACTIVE" | "INACTIVE";
  photo: string | null;
  description: string;
  stats: Partial<TeacherStats>;
};

const toProfile = (r: DbRow): TeacherProfile => ({
  id: r.id,
  name: r.name,
  email: r.email ?? "",
  subject: r.subject,
  rating: r.rating,
  students: r.students,
  sessions: r.sessions,
  status: r.status,
  photo: r.photo ?? undefined,
  description: r.description,
  stats: migrateStats(r.stats),
});

const toDb = (p: TeacherProfile) => ({
  id: p.id,
  name: p.name,
  email: p.email ?? null,
  subject: p.subject,
  rating: p.rating,
  students: p.students,
  sessions: p.sessions,
  status: p.status,
  photo: p.photo ?? null,
  description: p.description,
  stats: p.stats,
});

export function useTeacherProfiles() {
  const [list, setList] = useState<TeacherProfile[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setList(defaultTeachers);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const { data } = await supa.from("teacher_profiles").select("*");
      if (cancelled) return;
      const rows = (data as DbRow[]) ?? [];
      setList(rows.length ? rows.map(toProfile) : defaultTeachers);
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`tp_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teacher_profiles" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const upsert = useCallback((p: TeacherProfile) => {
    let isNew = true;
    setList((prev) => {
      isNew = !prev.some((t) => t.id === p.id);
      return prev.some((t) => t.id === p.id)
        ? prev.map((t) => (t.id === p.id ? p : t))
        : [p, ...prev];
    });
    const supa = getSupabase();
    if (supa) void supa.from("teacher_profiles").upsert(toDb(p));
    logAudit({
      action: isNew ? "TEACHER_CREATE" : "TEACHER_UPDATE",
      target: `teacher:${p.id} ${p.name}`,
    });
  }, []);

  const remove = useCallback((id: string) => {
    setList((prev) => prev.filter((t) => t.id !== id));
    const supa = getSupabase();
    if (supa) void supa.from("teacher_profiles").delete().eq("id", id);
    logAudit({ action: "TEACHER_DELETE", target: `teacher:${id}` });
  }, []);

  const reset = useCallback(() => {
    setList(defaultTeachers);
  }, []);

  return { list, upsert, remove, reset, loaded };
}
