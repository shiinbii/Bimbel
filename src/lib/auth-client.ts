"use client";

import { IDLE_COOKIE_NAME } from "./idle-config";
import { getSupabase } from "./supabase";
import type { Role } from "./types";

export interface ProfileRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  role: Role;
  tier: string;
  created_at: string;
  last_login_at: string | null;
  deactivated: boolean;
  deactivation_reason: string | null;
  deactivated_at: string | null;
}

export interface SignUpMeta {
  name: string;
  role?: Role;
  tier?: string;
  phone?: string;
  avatar_url?: string;
}

export async function signInEmail(email: string, password: string) {
  const supa = getSupabase();
  if (!supa) return { ok: false as const, error: "Supabase belum dikonfigurasi" };
  const res = await supa.auth.signInWithPassword({ email, password });
  if (res.error) return { ok: false as const, error: res.error.message };
  return { ok: true as const };
}

export async function signOutCurrent() {
  const supa = getSupabase();
  if (!supa) return;
  await supa.auth.signOut();
  if (typeof document !== "undefined") {
    document.cookie = `${IDLE_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
}

export async function getMyProfile(): Promise<ProfileRow | null> {
  const supa = getSupabase();
  if (!supa) return null;
  const { data: s } = await supa.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return null;
  const { data, error } = await supa.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (error || !data) return null;
  return data as ProfileRow;
}

export async function updateMyProfile(
  patch: Partial<Pick<ProfileRow, "name" | "phone" | "avatar_url" | "tier" | "role">>,
): Promise<{ ok: boolean; error?: string }> {
  const supa = getSupabase();
  if (!supa) return { ok: false, error: "Supabase belum dikonfigurasi" };
  const { data: s } = await supa.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return { ok: false, error: "Belum login" };
  const { error } = await supa.from("profiles").update(patch).eq("id", uid);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function touchLastLogin() {
  const supa = getSupabase();
  if (!supa) return;
  const { data: s } = await supa.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return;
  await supa.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", uid);
}
