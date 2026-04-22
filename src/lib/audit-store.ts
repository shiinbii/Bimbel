"use client";

import { useEffect, useState } from "react";
import { mockAuditLogs } from "./mock-data";
import { getSupabase } from "./supabase";
import type { AuditLog, Role } from "./types";

type DbRow = {
  id: string;
  action: string;
  actor: string;
  role: Role;
  target: string;
  ip: string | null;
  created_at: string;
};

const toLog = (r: DbRow): AuditLog => ({
  id: r.id,
  action: r.action,
  user: r.actor,
  role: r.role,
  target: r.target,
  ip: r.ip ?? "-",
  time: r.created_at,
});

export function useAuditLogs() {
  const [list, setList] = useState<AuditLog[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [source, setSource] = useState<"db" | "mock">("mock");

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setList(mockAuditLogs);
      setSource("mock");
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const { data, error } = await supa
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error || !data) {
        setList(mockAuditLogs);
        setSource("mock");
        setLoaded(true);
        return;
      }
      const rows = (data as DbRow[]).map(toLog);
      setList(rows.length > 0 ? rows : mockAuditLogs);
      setSource(rows.length > 0 ? "db" : "mock");
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`aud_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_logs" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  return { list, loaded, source };
}

type Actor = { name: string; email: string; role: Role };

function readActor(): Actor | null {
  if (typeof window === "undefined") return null;
  try {
    const user = JSON.parse(localStorage.getItem("edudoc.current_user") ?? "{}") as {
      name?: string;
      email?: string;
    };
    const role = (localStorage.getItem("edudoc.role") as Role | null) ?? null;
    if (!user.email || !role) return null;
    return { name: user.name ?? user.email, email: user.email, role };
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget audit log. Membaca actor dari localStorage (user yg sedang login).
 * Kalau Supabase belum terkonfigurasi / user belum login → no-op (return void).
 */
export function logAudit(entry: { action: string; target: string }) {
  const supa = getSupabase();
  if (!supa) return;
  const actor = readActor();
  if (!actor) return;
  void supa.from("audit_logs").insert({
    action: entry.action,
    actor: actor.email,
    role: actor.role,
    target: entry.target,
    ip: null,
  });
}
