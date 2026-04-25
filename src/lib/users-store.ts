"use client";

import { logAudit } from "./audit-store";
import { getSupabase } from "./supabase";
import type { Role } from "./types";
import { useCallback, useEffect, useState } from "react";

export type DeactivationReason = "INACTIVITY_3_MONTHS" | "ZERO_CREDIT" | "ADMIN_ACTION" | null;

export const DEACTIVATION_MESSAGES: Record<Exclude<DeactivationReason, null>, { title: string; body: string }> = {
  INACTIVITY_3_MONTHS: {
    title: "Akun Tidak Aktif",
    body: "Akun kamu dinonaktifkan karena tidak login lebih dari 3 bulan. Silakan hubungi admin untuk mengaktifkan kembali.",
  },
  ZERO_CREDIT: {
    title: "Saldo Poin Habis",
    body: "Akun kamu nonaktif karena saldo poin 0. Silakan top-up untuk mengaktifkan kembali.",
  },
  ADMIN_ACTION: {
    title: "Akun Dinonaktifkan Admin",
    body: "Akun kamu dinonaktifkan oleh admin. Hubungi support untuk informasi lebih lanjut.",
  },
};

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  points: number;
  status: "ACTIVE" | "INACTIVE";
  avatar?: string;
  deactivated: boolean;
  deactivationReason: DeactivationReason;
  deactivatedAt?: string;
  lastLoginAt: string;
  joinedAt: string;
  completedTests?: number;
  subject?: string;
  rating?: number;
  sessions?: number;
}

type DbProfile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
  tier: string | null;
  created_at: string;
  last_login_at: string | null;
  deactivated: boolean;
  deactivation_reason: DeactivationReason | null;
  deactivated_at: string | null;
};

const toUser = (p: DbProfile, points: number): ManagedUser => ({
  id: p.id,
  name: p.name,
  email: p.email,
  phone: p.phone ?? undefined,
  role: p.role,
  points,
  status: p.deactivated ? "INACTIVE" : "ACTIVE",
  avatar: p.avatar_url ?? undefined,
  deactivated: p.deactivated,
  deactivationReason: p.deactivation_reason,
  deactivatedAt: p.deactivated_at ?? undefined,
  lastLoginAt: p.last_login_at ?? p.created_at,
  joinedAt: p.created_at,
});

// Module-level cache so sync find/update work across components.
let cache: ManagedUser[] = [];
const listeners = new Set<(list: ManagedUser[]) => void>();

function setCache(next: ManagedUser[]) {
  cache = next;
  listeners.forEach((l) => l(next));
}

async function fetchAll(): Promise<ManagedUser[]> {
  const supa = getSupabase();
  if (!supa) return [];
  const { data: profiles } = await supa.from("profiles").select("*");
  if (!profiles) return [];
  const list: ManagedUser[] = [];
  for (const p of profiles as DbProfile[]) {
    // Compute balance per user via RPC (sequential is OK here — usually small set)
    let points = 0;
    if (p.role === "STUDENT") {
      const { data: balance } = await supa.rpc("compute_balance", { p_user_id: p.id });
      points = typeof balance === "number" ? balance : 0;
    }
    list.push(toUser(p, points));
  }
  return list;
}

export function findUserByEmail(email: string): ManagedUser | undefined {
  const lower = email.toLowerCase();
  return cache.find((u) => u.email.toLowerCase() === lower);
}

export function updateUserByEmail(email: string, patch: Partial<ManagedUser>) {
  const supa = getSupabase();
  const user = findUserByEmail(email);
  if (!user) return;

  // Optimistic local update
  const merged = { ...user, ...patch };
  setCache(cache.map((u) => (u.id === user.id ? merged : u)));

  if (supa) {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone ?? null;
    if (patch.avatar !== undefined) dbPatch.avatar_url = patch.avatar ?? null;
    if (patch.deactivated !== undefined) dbPatch.deactivated = patch.deactivated;
    if (patch.deactivationReason !== undefined) dbPatch.deactivation_reason = patch.deactivationReason;
    if (patch.deactivatedAt !== undefined) dbPatch.deactivated_at = patch.deactivatedAt;
    if (patch.lastLoginAt !== undefined) dbPatch.last_login_at = patch.lastLoginAt;
    if (patch.role !== undefined) dbPatch.role = patch.role;
    if (Object.keys(dbPatch).length) {
      void supa.from("profiles").update(dbPatch).eq("id", user.id);
    }
  }

  // Audit log — pilih action berdasarkan intent
  if (patch.deactivated !== undefined) {
    logAudit({
      action: patch.deactivated ? "USER_DEACTIVATE" : "USER_REACTIVATE",
      target: `user:${user.email}`,
    });
  } else if (patch.role !== undefined) {
    logAudit({ action: "USER_ROLE_CHANGE", target: `user:${user.email} → ${patch.role}` });
  } else if (Object.keys(patch).length > 0) {
    logAudit({ action: "USER_UPDATE", target: `user:${user.email}` });
  }
}

export function maybeReactivateOnCredit(email: string, balance: number) {
  const u = findUserByEmail(email);
  if (u && u.deactivated && u.deactivationReason === "ZERO_CREDIT" && balance > 0) {
    updateUserByEmail(email, {
      deactivated: false,
      deactivationReason: null,
      status: "ACTIVE",
    });
  }
}

export function useUsersStore() {
  const [list, setList] = useState<ManagedUser[]>(cache);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setLoaded(true);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      const next = await fetchAll();
      if (cancelled) return;
      setCache(next);
      setList(next);
      setLoaded(true);
    };
    const sub = (next: ManagedUser[]) => setList(next);
    listeners.add(sub);
    refresh();

    const ch = supa
      .channel(`usr_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => refresh())
      .subscribe();

    return () => {
      cancelled = true;
      listeners.delete(sub);
      supa.removeChannel(ch);
    };
  }, []);

  const updateById = useCallback((id: string, patch: Partial<ManagedUser>) => {
    const user = cache.find((u) => u.id === id);
    if (!user) return;
    updateUserByEmail(user.email, patch);
  }, []);

  // Admin/Super-Admin add new user: creates auth user via signUp (no service_role needed).
  const upsert = useCallback(async (u: ManagedUser & { password?: string }) => {
    const supa = getSupabase();
    if (!supa) return;
    const existing = findUserByEmail(u.email);
    if (existing) {
      // Update path
      updateUserByEmail(u.email, u);
      return;
    }
    // Create new auth user — use signUp with admin metadata
    const { error } = await supa.auth.signUp({
      email: u.email,
      password: u.password || "123456",
      options: {
        data: {
          name: u.name,
          role: u.role,
          tier: u.role === "STUDENT" ? "STARTER" : null,
          phone: u.phone,
          avatar_url: u.avatar,
        },
      },
    });
    if (error) {
      console.warn("[users] signUp failed:", error.message);
    }
  }, []);

  const setDeactivated = useCallback(
    (id: string, deactivated: boolean, reason: DeactivationReason = "ADMIN_ACTION") => {
      const user = cache.find((u) => u.id === id);
      if (!user) return;
      updateUserByEmail(user.email, {
        deactivated,
        deactivationReason: deactivated ? reason : null,
        deactivatedAt: deactivated ? new Date().toISOString() : undefined,
        status: deactivated ? "INACTIVE" : "ACTIVE",
      });
    },
    [],
  );

  const remove = useCallback((id: string) => {
    const supa = getSupabase();
    const victim = cache.find((u) => u.id === id);
    setCache(cache.filter((u) => u.id !== id));
    setList((prev) => prev.filter((u) => u.id !== id));
    // Deleting auth.users cascades to profiles — but anon key can't do that.
    // Instead, just soft-delete: mark deactivated.
    if (supa) {
      void supa
        .from("profiles")
        .update({
          deactivated: true,
          deactivation_reason: "ADMIN_ACTION",
          deactivated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }
    if (victim) logAudit({ action: "USER_REMOVE", target: `user:${victim.email}` });
  }, []);

  return { list, updateById, upsert, setDeactivated, remove, loaded };
}
