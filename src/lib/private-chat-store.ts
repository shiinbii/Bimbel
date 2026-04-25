"use client";

import { getSupabase } from "./supabase";
import { useCallback, useEffect, useState } from "react";

const KEY = "edudoc.private_chat";

export interface PrivateChatMessage {
  id: string;
  requestId: string;
  author: "student" | "teacher";
  name: string;
  text: string;
  at: string;
  flagged?: boolean;
}

const OFFPLATFORM_PATTERNS = [
  /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
  /\b(?:\+?62|0)8[1-9][0-9]{7,12}\b/g,
  /\b(?:wa|whatsapp|telegram|line|ig|instagram|discord)(?:\s*(?:me|saya|kontak))?\b/gi,
  /t\.me\//gi,
  /wa\.me\//gi,
  /chat\.whatsapp\.com/gi,
];

export function detectOffPlatform(text: string): boolean {
  return OFFPLATFORM_PATTERNS.some((re) => re.test(text));
}

type DbRow = {
  id: string;
  request_id: string;
  author: "student" | "teacher";
  name: string;
  text: string;
  flagged: boolean;
  at: string;
};

const toMsg = (r: DbRow): PrivateChatMessage => ({
  id: r.id,
  requestId: r.request_id,
  author: r.author,
  name: r.name,
  text: r.text,
  flagged: r.flagged,
  at: r.at,
});

function readLS(): PrivateChatMessage[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p as PrivateChatMessage[];
  } catch {}
  return [];
}
function writeLS(list: PrivateChatMessage[]) {
  if (typeof window === "undefined") return;
  const s = JSON.stringify(list);
  localStorage.setItem(KEY, s);
  queueMicrotask(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: s }));
  });
}

export function usePrivateChat(requestId: string | null) {
  const [all, setAll] = useState<PrivateChatMessage[]>([]);
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

    if (!requestId) {
      setAll([]);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await supa
        .from("private_chats")
        .select("*")
        .eq("request_id", requestId)
        .order("at", { ascending: true });
      if (cancelled) return;
      setAll(((data as DbRow[]) ?? []).map(toMsg));
      setLoaded(true);
    })();

    const ch = supa
      .channel(`pc_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_chats",
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const row = toMsg(payload.new as DbRow);
          setAll((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, [requestId]);

  const messages = requestId
    ? all.filter((m) => m.requestId === requestId).sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    : [];

  const send = useCallback(
    (msg: Omit<PrivateChatMessage, "id" | "at" | "flagged">) => {
      const flagged = detectOffPlatform(msg.text);
      const full: PrivateChatMessage = {
        ...msg,
        id: `pm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        at: new Date().toISOString(),
        flagged,
      };
      const supa = getSupabase();
      if (supa) {
        setAll((prev) => (msg.requestId === requestId ? [...prev, full] : prev));
        void supa.from("private_chats").insert({
          id: full.id,
          request_id: full.requestId,
          author: full.author,
          name: full.name,
          text: full.text,
          flagged: full.flagged ?? false,
          at: full.at,
        });
      } else {
        setAll((prev) => {
          const next = [...prev, full];
          writeLS(next);
          return next;
        });
      }
      return full;
    },
    [requestId],
  );

  return { messages, send, loaded };
}
