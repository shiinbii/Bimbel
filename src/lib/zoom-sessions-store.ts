"use client";

import { mockZoomSessions } from "./mock-data";
import { getSupabase } from "./supabase";
import type { ZoomSession, ZoomStatus } from "./types";
import { useCallback, useEffect, useState } from "react";

const KEY = "edudoc.zoom_sessions";

type DbRow = {
  id: string;
  title: string;
  teacher: string;
  teacher_avatar: string | null;
  subject: string;
  scheduled_at: string;
  duration: number;
  cost: number;
  max_participants: number;
  current_participants: number;
  status: ZoomStatus;
  description: string;
  meeting_url: string;
};

const toZoom = (r: DbRow): ZoomSession => ({
  id: r.id,
  title: r.title,
  teacher: r.teacher,
  teacherAvatar: r.teacher_avatar ?? undefined,
  subject: r.subject,
  scheduledAt: r.scheduled_at,
  duration: r.duration,
  cost: r.cost,
  maxParticipants: r.max_participants,
  currentParticipants: r.current_participants,
  status: r.status,
  description: r.description,
  meetingUrl: r.meeting_url,
});

const toDb = (s: ZoomSession) => ({
  id: s.id,
  title: s.title,
  teacher: s.teacher,
  teacher_avatar: s.teacherAvatar ?? null,
  subject: s.subject,
  scheduled_at: s.scheduledAt,
  duration: s.duration,
  cost: s.cost,
  max_participants: s.maxParticipants,
  current_participants: s.currentParticipants,
  status: s.status,
  description: s.description,
  meeting_url: s.meetingUrl,
});

function readLS(): ZoomSession[] {
  if (typeof window === "undefined") return mockZoomSessions;
  const raw = localStorage.getItem(KEY);
  if (!raw) return mockZoomSessions;
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p as ZoomSession[];
  } catch {}
  return mockZoomSessions;
}
function writeLS(list: ZoomSession[]) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
}

export function useZoomSessions() {
  const [list, setList] = useState<ZoomSession[]>([]);
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
      const { data } = await supa.from("zoom_sessions").select("*").order("scheduled_at", { ascending: true });
      if (cancelled) return;
      setList(((data as DbRow[]) ?? []).map(toZoom));
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`zoom_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "zoom_sessions" }, () => refresh())
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const upsert = useCallback((s: ZoomSession) => {
    const supa = getSupabase();
    setList((prev) => {
      const ex = prev.some((x) => x.id === s.id);
      return ex ? prev.map((x) => (x.id === s.id ? s : x)) : [s, ...prev];
    });
    if (supa) void supa.from("zoom_sessions").upsert(toDb(s));
    else writeLS([s, ...readLS().filter((x) => x.id !== s.id)]);
  }, []);

  const remove = useCallback((id: string) => {
    const supa = getSupabase();
    setList((prev) => prev.filter((x) => x.id !== id));
    if (supa) void supa.from("zoom_sessions").delete().eq("id", id);
    else writeLS(readLS().filter((x) => x.id !== id));
  }, []);

  const reset = useCallback(() => {
    setList(mockZoomSessions);
    const supa = getSupabase();
    if (!supa && typeof window !== "undefined") localStorage.removeItem(KEY);
  }, []);

  return { list, upsert, remove, reset, loaded };
}
