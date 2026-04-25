"use client";

import { getSupabase } from "./supabase";
import { useCallback, useEffect, useRef, useState } from "react";

const SESSIONS_KEY = "edudoc.helpdesk_sessions";
const MESSAGES_KEY = "edudoc.helpdesk_messages";
const PRESENCE_KEY = "edudoc.helpdesk_presence";

/** Heartbeat staleness: admin considered offline if last ping > 12s ago. */
const PRESENCE_TIMEOUT_MS = 12_000;
const PRESENCE_HEARTBEAT_MS = 4_000;

export interface HelpdeskSession {
  id: string;
  studentEmail: string;
  studentName: string;
  adminEmail: string | null;
  adminName: string | null;
  status: "OPEN" | "CLAIMED" | "CLOSED";
  createdAt: string;
  lastMessageAt: string;
  lastMessagePreview: string;
}

export interface HelpdeskMessage {
  id: string;
  sessionId: string;
  author: "student" | "admin";
  authorEmail: string;
  authorName: string;
  text: string;
  at: string;
}

export interface PresenceEntry {
  email: string;
  name: string;
  role: "ADMIN" | "SUPER_ADMIN";
  lastSeenAt: number;
  available: boolean;
}

/* ───────────────────── mappers (db row ↔ UI shape) ───────────────────── */

type DbSession = {
  id: string;
  student_email: string;
  student_name: string;
  admin_email: string | null;
  admin_name: string | null;
  status: HelpdeskSession["status"];
  created_at: string;
  last_message_at: string;
  last_message_preview: string;
};

type DbMessage = {
  id: string;
  session_id: string;
  author: HelpdeskMessage["author"];
  author_email: string;
  author_name: string;
  text: string;
  at: string;
};

type DbPresence = {
  email: string;
  name: string;
  role: PresenceEntry["role"];
  available: boolean;
  last_seen_at: string;
};

const toSession = (r: DbSession): HelpdeskSession => ({
  id: r.id,
  studentEmail: r.student_email,
  studentName: r.student_name,
  adminEmail: r.admin_email,
  adminName: r.admin_name,
  status: r.status,
  createdAt: r.created_at,
  lastMessageAt: r.last_message_at,
  lastMessagePreview: r.last_message_preview,
});

const toMessage = (r: DbMessage): HelpdeskMessage => ({
  id: r.id,
  sessionId: r.session_id,
  author: r.author,
  authorEmail: r.author_email,
  authorName: r.author_name,
  text: r.text,
  at: r.at,
});

const toPresence = (r: DbPresence): PresenceEntry => ({
  email: r.email,
  name: r.name,
  role: r.role,
  available: r.available,
  lastSeenAt: new Date(r.last_seen_at).getTime(),
});

/* ───────────────────── localStorage helpers (fallback) ───────────────────── */

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  const s = JSON.stringify(value);
  localStorage.setItem(key, s);
  queueMicrotask(() => {
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: s }));
  });
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function channelName(base: string): string {
  return `${base}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

function cleanPresence(list: PresenceEntry[]): PresenceEntry[] {
  const now = Date.now();
  return list.filter((p) => now - p.lastSeenAt < PRESENCE_TIMEOUT_MS);
}

/* ────────────────────────── SESSIONS ────────────────────────── */

export function useHelpdeskSessions() {
  const [sessions, setSessions] = useState<HelpdeskSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setSessions(readLS<HelpdeskSession[]>(SESSIONS_KEY, []));
      setLoaded(true);
      const onStorage = (e: StorageEvent) => {
        if (e.key === SESSIONS_KEY) setSessions(readLS<HelpdeskSession[]>(SESSIONS_KEY, []));
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supa
        .from("helpdesk_sessions")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.warn("[helpdesk] sessions fetch", error.message);
        setSessions([]);
      } else {
        setSessions((data as DbSession[]).map(toSession));
      }
      setLoaded(true);
    })();

    const ch = supa
      .channel(channelName("helpdesk_sessions_rt"))
      .on("postgres_changes", { event: "*", schema: "public", table: "helpdesk_sessions" }, (payload) => {
        setSessions((prev) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string }).id;
            return prev.filter((s) => s.id !== oldId);
          }
          const row = toSession(payload.new as DbSession);
          const without = prev.filter((s) => s.id !== row.id);
          return [row, ...without].sort(
            (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
          );
        });
      })
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[helpdesk_sessions] realtime subscribe", status, err);
        }
      });

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const openOrGet = useCallback(
    async (studentEmail: string, studentName: string): Promise<HelpdeskSession> => {
      const supa = getSupabase();
      const existing = sessions.find(
        (s) => s.studentEmail.toLowerCase() === studentEmail.toLowerCase() && s.status !== "CLOSED",
      );
      if (existing) return existing;

      const fresh: HelpdeskSession = {
        id: genId("hd"),
        studentEmail,
        studentName,
        adminEmail: null,
        adminName: null,
        status: "OPEN",
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: "Sesi baru dimulai",
      };

      if (!supa) {
        const all = readLS<HelpdeskSession[]>(SESSIONS_KEY, []);
        const next = [fresh, ...all];
        writeLS(SESSIONS_KEY, next);
        setSessions(next);
        return fresh;
      }

      // Optimistic local insert agar UI student responsif
      setSessions((prev) => [fresh, ...prev]);

      // AWAIT insert ke DB — kalau pakai fire-and-forget, RLS check di
      // helpdesk_messages (`exists session WHERE id = session_id`) bisa
      // jalan sebelum row session commit → message insert ditolak diam-diam.
      const { error } = await supa.from("helpdesk_sessions").insert({
        id: fresh.id,
        student_email: fresh.studentEmail,
        student_name: fresh.studentName,
        status: fresh.status,
        created_at: fresh.createdAt,
        last_message_at: fresh.lastMessageAt,
        last_message_preview: fresh.lastMessagePreview,
      });
      if (error) {
        console.warn("[helpdesk_sessions] insert failed:", error.message, "student_email:", studentEmail);
      }
      return fresh;
    },
    [sessions],
  );

  const updateSession = useCallback((id: string, patch: Partial<HelpdeskSession>) => {
    const supa = getSupabase();
    if (!supa) {
      const next = readLS<HelpdeskSession[]>(SESSIONS_KEY, []).map((s) => (s.id === id ? { ...s, ...patch } : s));
      writeLS(SESSIONS_KEY, next);
      setSessions(next);
      return;
    }

    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

    const dbPatch: Record<string, unknown> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.adminEmail !== undefined) dbPatch.admin_email = patch.adminEmail;
    if (patch.adminName !== undefined) dbPatch.admin_name = patch.adminName;
    if (patch.lastMessageAt !== undefined) dbPatch.last_message_at = patch.lastMessageAt;
    if (patch.lastMessagePreview !== undefined) dbPatch.last_message_preview = patch.lastMessagePreview;
    if (Object.keys(dbPatch).length > 0) {
      void supa.from("helpdesk_sessions").update(dbPatch).eq("id", id);
    }
  }, []);

  const closeSession = useCallback(
    (id: string) => {
      updateSession(id, { status: "CLOSED" });
    },
    [updateSession],
  );

  return { sessions, openOrGet, updateSession, closeSession, loaded };
}

/* ────────────────────────── MESSAGES ────────────────────────── */

export function useHelpdeskMessages(sessionId: string | null) {
  const [messages, setMessages] = useState<HelpdeskMessage[]>([]);

  useEffect(() => {
    setMessages([]);
    if (!sessionId) return;

    const supa = getSupabase();
    if (!supa) {
      const refresh = () => {
        const all = readLS<HelpdeskMessage[]>(MESSAGES_KEY, []);
        setMessages(
          all
            .filter((m) => m.sessionId === sessionId)
            .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
        );
      };
      refresh();
      const onStorage = (e: StorageEvent) => {
        if (e.key === MESSAGES_KEY) refresh();
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supa
        .from("helpdesk_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("at", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.warn("[helpdesk] messages fetch", error.message);
        setMessages([]);
      } else {
        setMessages((data as DbMessage[]).map(toMessage));
      }
    })();

    const ch = supa
      .channel(channelName(`helpdesk_messages_rt_${sessionId}`))
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "helpdesk_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = toMessage(payload.new as DbMessage);
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, [sessionId]);

  const send = useCallback(
    (msg: Omit<HelpdeskMessage, "id" | "at">) => {
      const supa = getSupabase();
      const full: HelpdeskMessage = {
        ...msg,
        id: genId("hm"),
        at: new Date().toISOString(),
      };

      if (!supa) {
        const next = [...readLS<HelpdeskMessage[]>(MESSAGES_KEY, []), full];
        writeLS(MESSAGES_KEY, next);
        setMessages((prev) => (msg.sessionId === sessionId ? [...prev, full] : prev));
        // update session summary
        const ses = readLS<HelpdeskSession[]>(SESSIONS_KEY, []).map((s) =>
          s.id === msg.sessionId
            ? {
                ...s,
                lastMessageAt: full.at,
                lastMessagePreview: full.text.slice(0, 80),
                status: s.status === "OPEN" && msg.author === "admin" ? ("CLAIMED" as const) : s.status,
                adminEmail: msg.author === "admin" ? msg.authorEmail : s.adminEmail,
                adminName: msg.author === "admin" ? msg.authorName : s.adminName,
              }
            : s,
        );
        writeLS(SESSIONS_KEY, ses);
        return full;
      }

      // Optimistic append
      if (msg.sessionId === sessionId) {
        setMessages((prev) => [...prev, full]);
      }
      void supa
        .from("helpdesk_messages")
        .insert({
          id: full.id,
          session_id: full.sessionId,
          author: full.author,
          author_email: full.authorEmail,
          author_name: full.authorName,
          text: full.text,
          at: full.at,
        })
        .then(({ error }) => {
          if (error) {
            console.warn(
              "[helpdesk_messages] insert failed:",
              error.message,
              "session_id:",
              full.sessionId,
              "author:",
              full.author,
              "author_email:",
              full.authorEmail,
            );
            return;
          }
          // Update session summary supaya admin lihat preview baru di list.
          // Kalau admin yg kirim, status pindah OPEN→CLAIMED.
          const sumPatch: Record<string, unknown> = {
            last_message_at: full.at,
            last_message_preview: full.text.slice(0, 80),
          };
          if (full.author === "admin") {
            sumPatch.admin_email = full.authorEmail;
            sumPatch.admin_name = full.authorName;
            sumPatch.status = "CLAIMED";
          }
          void supa
            .from("helpdesk_sessions")
            .update(sumPatch)
            .eq("id", full.sessionId)
            .then(({ error: updateErr }) => {
              if (updateErr) {
                console.warn("[helpdesk_sessions] summary update failed:", updateErr.message);
              }
            });
        });
      return full;
    },
    [sessionId],
  );

  return { messages, send };
}

/* ────────────────────────── PRESENCE ────────────────────────── */

export function usePresenceHeartbeat(
  email: string | undefined,
  name: string,
  role: PresenceEntry["role"],
  available: boolean,
) {
  useEffect(() => {
    if (!email || !available) return;
    const supa = getSupabase();

    const tickLS = () => {
      const cur = readLS<PresenceEntry[]>(PRESENCE_KEY, []);
      const withoutMe = cur.filter((p) => p.email.toLowerCase() !== email.toLowerCase());
      const next: PresenceEntry[] = [
        ...cleanPresence(withoutMe),
        { email, name, role, available: true, lastSeenAt: Date.now() },
      ];
      writeLS(PRESENCE_KEY, next);
    };

    const tickRemote = () => {
      if (!supa) return;
      void supa
        .from("helpdesk_presence")
        .upsert(
          {
            email,
            name,
            role,
            available: true,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "email" },
        )
        .then(({ error }) => {
          if (error) {
            // Common cause: tabel `helpdesk_presence` belum dibuat di Supabase
            // (run docs/SCHEMA_HELPDESK.sql), atau RLS block insert/update.
            console.warn("[helpdesk_presence] heartbeat failed:", error.message);
          }
        });
    };

    if (supa) {
      tickRemote();
      const id = setInterval(tickRemote, PRESENCE_HEARTBEAT_MS);
      return () => {
        clearInterval(id);
        void supa.from("helpdesk_presence").delete().eq("email", email);
      };
    }

    tickLS();
    const id = setInterval(tickLS, PRESENCE_HEARTBEAT_MS);
    return () => {
      clearInterval(id);
      const cur = readLS<PresenceEntry[]>(PRESENCE_KEY, []);
      const next = cur.filter((p) => p.email.toLowerCase() !== email.toLowerCase());
      writeLS(PRESENCE_KEY, next);
    };
  }, [email, name, role, available]);
}

export function useOnlineAdmins() {
  const [list, setList] = useState<PresenceEntry[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supa = getSupabase();

    if (!supa) {
      const refresh = () => {
        setList(cleanPresence(readLS<PresenceEntry[]>(PRESENCE_KEY, [])));
      };
      refresh();
      const onStorage = (e: StorageEvent) => {
        if (e.key === PRESENCE_KEY) refresh();
      };
      window.addEventListener("storage", onStorage);
      tickRef.current = setInterval(refresh, 4_000);
      return () => {
        window.removeEventListener("storage", onStorage);
        if (tickRef.current) clearInterval(tickRef.current);
      };
    }

    let cancelled = false;
    const refreshFromDb = async () => {
      const { data, error } = await supa.from("helpdesk_presence").select("*");
      if (cancelled) return;
      if (error) {
        console.warn("[helpdesk_presence] select failed:", error.message);
        return;
      }
      setList(cleanPresence((data as DbPresence[]).map(toPresence)));
    };

    refreshFromDb();

    const ch = supa
      .channel(channelName("helpdesk_presence_rt"))
      .on("postgres_changes", { event: "*", schema: "public", table: "helpdesk_presence" }, () => {
        refreshFromDb();
      })
      .subscribe();

    // Local tick to drop stale entries even without events
    tickRef.current = setInterval(() => {
      setList((prev) => cleanPresence(prev));
    }, 4_000);

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  return list;
}
