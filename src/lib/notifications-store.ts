"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";

const KEY = "edudoc.notifications";

export type NotificationKind =
  | "PRIVATE_ZOOM_REQUEST"
  | "PRIVATE_ZOOM_SCHEDULED"
  | "PRIVATE_ZOOM_CONFIRMED"
  | "PRIVATE_ZOOM_REJECTED"
  | "CHAT_MESSAGE"
  | "ACCOUNT_WARNING"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  targetEmail: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  at: string;
}

type DbRow = {
  id: string;
  kind: NotificationKind;
  target_email: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  at: string;
};

const toNotif = (r: DbRow): AppNotification => ({
  id: r.id,
  kind: r.kind,
  targetEmail: r.target_email,
  title: r.title,
  body: r.body,
  link: r.link ?? undefined,
  read: r.read,
  at: r.at,
});

function readLS(): AppNotification[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as AppNotification[];
  } catch {}
  return [];
}

function writeLS(list: AppNotification[]) {
  if (typeof window !== "undefined") {
    const s = JSON.stringify(list);
    localStorage.setItem(KEY, s);
    queueMicrotask(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: s }));
    });
  }
}

export function pushNotification(n: Omit<AppNotification, "id" | "read" | "at">) {
  const supa = getSupabase();
  if (supa) {
    void supa
      .from("notifications")
      .insert({
        kind: n.kind,
        target_email: n.targetEmail,
        title: n.title,
        body: n.body,
        link: n.link ?? null,
      });
    return;
  }
  if (typeof window === "undefined") return;
  const full: AppNotification = {
    ...n,
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    read: false,
    at: new Date().toISOString(),
  };
  writeLS([full, ...readLS()].slice(0, 100));
}

export function useNotifications(email?: string) {
  const [all, setAll] = useState<AppNotification[]>([]);
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
      let q = supa.from("notifications").select("*").order("at", { ascending: false }).limit(200);
      if (email) q = q.eq("target_email", email);
      const { data } = await q;
      if (cancelled) return;
      setAll(((data as DbRow[]) ?? []).map(toNotif));
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`notif_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, [email]);

  const list = email
    ? all.filter((n) => n.targetEmail.toLowerCase() === email.toLowerCase())
    : all;
  const unreadCount = list.filter((n) => !n.read).length;

  const markRead = useCallback((id: string) => {
    const supa = getSupabase();
    setAll((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (supa) {
      void supa.from("notifications").update({ read: true }).eq("id", id);
    } else {
      writeLS(all.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  }, [all]);

  const markAllRead = useCallback(() => {
    const supa = getSupabase();
    setAll((prev) =>
      prev.map((n) =>
        email && n.targetEmail.toLowerCase() !== email.toLowerCase()
          ? n
          : { ...n, read: true }
      )
    );
    if (supa) {
      let q = supa.from("notifications").update({ read: true }).eq("read", false);
      if (email) q = q.eq("target_email", email);
      void q;
    } else {
      writeLS(
        all.map((n) =>
          email && n.targetEmail.toLowerCase() !== email.toLowerCase()
            ? n
            : { ...n, read: true }
        )
      );
    }
  }, [email, all]);

  const clear = useCallback(() => {
    const supa = getSupabase();
    setAll((prev) =>
      email
        ? prev.filter((n) => n.targetEmail.toLowerCase() !== email.toLowerCase())
        : []
    );
    if (supa) {
      let q = supa.from("notifications").delete().gte("at", "1970-01-01");
      if (email) q = q.eq("target_email", email);
      void q;
    } else if (email) {
      writeLS(all.filter((n) => n.targetEmail.toLowerCase() !== email.toLowerCase()));
    } else {
      writeLS([]);
    }
  }, [email, all]);

  return { list, unreadCount, markRead, markAllRead, clear, loaded };
}
