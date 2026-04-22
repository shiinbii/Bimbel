"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";

const KEY = "edudoc.private_zoom_requests";

export type PrivateZoomStatus =
  | "PENDING"
  | "SCHEDULED"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "DONE";

export interface PrivateZoomRequest {
  id: string;
  studentEmail: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  topic: string;
  notes?: string;
  status: PrivateZoomStatus;
  createdAt: string;
  scheduledAt?: string;
  durationMinutes?: number;
  meetingUrl?: string;
  studentNote?: string;
}

type DbRow = {
  id: string;
  student_email: string;
  student_name: string;
  teacher_id: string;
  teacher_name: string;
  subject: string;
  topic: string;
  notes: string | null;
  status: PrivateZoomStatus;
  created_at: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meeting_url: string | null;
  student_note: string | null;
};

const toPZ = (r: DbRow): PrivateZoomRequest => ({
  id: r.id,
  studentEmail: r.student_email,
  studentName: r.student_name,
  teacherId: r.teacher_id,
  teacherName: r.teacher_name,
  subject: r.subject,
  topic: r.topic,
  notes: r.notes ?? undefined,
  status: r.status,
  createdAt: r.created_at,
  scheduledAt: r.scheduled_at ?? undefined,
  durationMinutes: r.duration_minutes ?? undefined,
  meetingUrl: r.meeting_url ?? undefined,
  studentNote: r.student_note ?? undefined,
});

const toDb = (p: PrivateZoomRequest) => ({
  id: p.id,
  student_email: p.studentEmail,
  student_name: p.studentName,
  teacher_id: p.teacherId,
  teacher_name: p.teacherName,
  subject: p.subject,
  topic: p.topic,
  notes: p.notes ?? null,
  status: p.status,
  created_at: p.createdAt,
  scheduled_at: p.scheduledAt ?? null,
  duration_minutes: p.durationMinutes ?? null,
  meeting_url: p.meetingUrl ?? null,
  student_note: p.studentNote ?? null,
});

function readLS(): PrivateZoomRequest[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p as PrivateZoomRequest[];
  } catch {}
  return [];
}
function writeLS(list: PrivateZoomRequest[]) {
  if (typeof window === "undefined") return;
  const s = JSON.stringify(list);
  localStorage.setItem(KEY, s);
  queueMicrotask(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: s }));
  });
}

export function usePrivateZoom() {
  const [list, setList] = useState<PrivateZoomRequest[]>([]);
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
        .from("private_zoom_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setList(((data as DbRow[]) ?? []).map(toPZ));
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`pz_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "private_zoom_requests" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const create = useCallback(
    (r: Omit<PrivateZoomRequest, "id" | "status" | "createdAt">) => {
      const supa = getSupabase();
      const full: PrivateZoomRequest = {
        ...r,
        id: `pz_${Date.now()}`,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      setList((prev) => [full, ...prev]);
      if (supa) void supa.from("private_zoom_requests").insert(toDb(full));
      else writeLS([full, ...readLS()]);
      return full;
    },
    []
  );

  const update = useCallback(
    (id: string, patch: Partial<PrivateZoomRequest>) => {
      const supa = getSupabase();
      setList((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      if (supa) {
        const dbPatch: Record<string, unknown> = {};
        if (patch.status !== undefined) dbPatch.status = patch.status;
        if (patch.scheduledAt !== undefined) dbPatch.scheduled_at = patch.scheduledAt;
        if (patch.durationMinutes !== undefined) dbPatch.duration_minutes = patch.durationMinutes;
        if (patch.meetingUrl !== undefined) dbPatch.meeting_url = patch.meetingUrl;
        if (patch.studentNote !== undefined) dbPatch.student_note = patch.studentNote;
        if (patch.notes !== undefined) dbPatch.notes = patch.notes;
        if (patch.topic !== undefined) dbPatch.topic = patch.topic;
        if (patch.subject !== undefined) dbPatch.subject = patch.subject;
        if (Object.keys(dbPatch).length > 0)
          void supa.from("private_zoom_requests").update(dbPatch).eq("id", id);
      } else {
        writeLS(readLS().map((r) => (r.id === id ? { ...r, ...patch } : r)));
      }
    },
    []
  );

  const remove = useCallback((id: string) => {
    const supa = getSupabase();
    setList((prev) => prev.filter((r) => r.id !== id));
    if (supa) void supa.from("private_zoom_requests").delete().eq("id", id);
    else writeLS(readLS().filter((r) => r.id !== id));
  }, []);

  return { list, create, update, remove, loaded };
}
