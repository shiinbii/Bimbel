"use client";

import type { ProfileRow } from "./auth-client";
import { getSupabase } from "./supabase";
import { useCallback, useEffect, useState } from "react";

const KEY = "edudoc.current_user";

import type { Tier } from "./tiers";

export interface CurrentUser {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  tier?: Tier;
}

export const defaultCurrentUser: CurrentUser = {
  name: "",
  email: "",
};

const GOOGLE_SAMPLE_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stop-color='#4285F4'/>
          <stop offset='.4' stop-color='#34A853'/>
          <stop offset='.7' stop-color='#FBBC04'/>
          <stop offset='1' stop-color='#EA4335'/>
        </linearGradient>
      </defs>
      <rect width='128' height='128' rx='64' fill='url(#g)'/>
      <circle cx='64' cy='50' r='22' fill='white'/>
      <path d='M20 112c6-22 26-36 44-36s38 14 44 36H20z' fill='white'/>
    </svg>`,
  );

export const GOOGLE_DEMO_AVATAR = GOOGLE_SAMPLE_AVATAR;

function profileToUser(p: ProfileRow): CurrentUser {
  return {
    name: p.name,
    email: p.email,
    phone: p.phone ?? undefined,
    avatar: p.avatar_url ?? undefined,
    tier: (p.tier as Tier) ?? undefined,
  };
}

function readLocal(): CurrentUser {
  if (typeof window === "undefined") return defaultCurrentUser;
  const saved = localStorage.getItem(KEY);
  if (!saved) return defaultCurrentUser;
  try {
    return { ...defaultCurrentUser, ...JSON.parse(saved) };
  } catch {
    return defaultCurrentUser;
  }
}

function writeLocal(user: CurrentUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function useCurrentUser() {
  const [user, setUserState] = useState<CurrentUser>(defaultCurrentUser);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const supa = getSupabase();

    // Selalu mulai dari localStorage supaya UI tidak blank saat boot.
    setUserState(readLocal());
    setLoaded(true);

    if (!supa) {
      const onStorage = (e: StorageEvent) => {
        if (e.key !== KEY) return;
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : defaultCurrentUser;
          setUserState({ ...defaultCurrentUser, ...parsed });
        } catch {}
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    // Supabase configured — prioritaskan session + profile.
    let cancelled = false;

    const syncFromSession = async () => {
      const { data: s } = await supa.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid) {
        // Tidak ada session → fallback ke default (user baru).
        if (!cancelled) {
          setUserState(defaultCurrentUser);
          writeLocal(defaultCurrentUser);
        }
        return;
      }
      const { data, error } = await supa.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        // Session ada tapi profile belum ada (rare) — pakai metadata dari auth
        const meta = s.session!.user.user_metadata ?? {};
        const u: CurrentUser = {
          name: (meta.name as string) || s.session!.user.email?.split("@")[0] || "User",
          email: s.session!.user.email ?? undefined,
          phone: (meta.phone as string) || undefined,
          avatar: (meta.avatar_url as string) || undefined,
        };
        setUserState(u);
        writeLocal(u);
        return;
      }
      const u = profileToUser(data as ProfileRow);
      setUserState(u);
      writeLocal(u);
    };

    syncFromSession();

    const { data: sub } = supa.auth.onAuthStateChange(() => {
      if (!cancelled) syncFromSession();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const setUser = useCallback((patch: Partial<CurrentUser>) => {
    setUserState((prev) => {
      const next = { ...prev, ...patch };
      writeLocal(next);
      // Sync ke Supabase profile (best-effort, non-blocking)
      const supa = getSupabase();
      if (supa) {
        void (async () => {
          const { data: s } = await supa.auth.getSession();
          const uid = s.session?.user.id;
          if (!uid) return;
          const dbPatch: Record<string, unknown> = {};
          if (patch.name !== undefined) dbPatch.name = patch.name;
          if (patch.phone !== undefined) dbPatch.phone = patch.phone;
          if (patch.avatar !== undefined) dbPatch.avatar_url = patch.avatar;
          if (patch.tier !== undefined) dbPatch.tier = patch.tier;
          if (Object.keys(dbPatch).length > 0) {
            await supa.from("profiles").update(dbPatch).eq("id", uid);
          }
        })();
      }
      return next;
    });
  }, []);

  const clear = useCallback(async () => {
    // 1) Sign out Supabase — hapus session token dari localStorage
    const supa = getSupabase();
    if (supa) {
      await supa.auth.signOut();
    }
    // 2) Hapus cache app-level
    if (typeof window !== "undefined") {
      localStorage.removeItem(KEY);
      localStorage.removeItem("edudoc.role");
      localStorage.removeItem("edudoc.current_user");
      // Clear semua sb-*-auth-token keys (kadang Supabase sisakan)
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("sb-") && k.includes("-auth-token")) {
          localStorage.removeItem(k);
        }
      });
    }
    // 3) Reset state lokal
    setUserState(defaultCurrentUser);
  }, []);

  return { user, setUser, clear, loaded };
}

export function setCurrentUserOnce(user: CurrentUser) {
  if (typeof window === "undefined") return;
  const prev = localStorage.getItem(KEY);
  const merged = prev ? { ...JSON.parse(prev), ...user } : { ...defaultCurrentUser, ...user };
  localStorage.setItem(KEY, JSON.stringify(merged));
}
