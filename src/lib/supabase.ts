"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client singleton. Returns `null` when env vars are missing so
 * downstream stores can fall back to localStorage during the migration.
 *
 * Env vars (set in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      // Bypass navigator.locks API — it leaks "lock stolen" errors under
      // React Strict Mode double-mount and Turbopack HMR in dev.
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return _client;
}

export const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
