"use client";

import { logAudit } from "./audit-store";
import { mockUser } from "./mock-data";
import { getSupabase } from "./supabase";
import { maybeReactivateOnCredit, updateUserByEmail } from "./users-store";
import { useCallback, useEffect, useRef, useState } from "react";

const GRANTS_KEY = "edudoc.point_grants";
const SETTINGS_KEY = "edudoc.point_settings";
const HISTORY_KEY = "edudoc.point_history";

export type GrantSource = "INITIAL" | "PURCHASE" | "ADMIN_GRANT" | "BONUS" | "REFUND";
export type HistoryKind = "GRANT" | "SPEND" | "EXPIRE";

export interface PointGrant {
  id: string;
  points: number;
  remaining: number;
  grantedAt: string;
  expiresAt: string;
  source: GrantSource;
  note?: string;
}

export interface PointHistoryEntry {
  id: string;
  kind: HistoryKind;
  points: number;
  balanceAfter: number;
  at: string;
  note?: string;
}

export interface PointSettings {
  defaultValidityDays: number;
  warningDays: number;
}

export const defaultSettings: PointSettings = {
  defaultValidityDays: 365,
  warningDays: 30,
};

const DEFAULT_INITIAL_BALANCE = mockUser.points;

function nowISO() {
  return new Date().toISOString();
}
function plusDays(days: number, fromISO: string = nowISO()) {
  const d = new Date(fromISO);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/* ─────────── localStorage helpers (fallback) ─────────── */

function readGrantsLS(): PointGrant[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(GRANTS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as PointGrant[];
    } catch {}
  }
  const seed: PointGrant[] = [
    {
      id: "grant_initial",
      points: DEFAULT_INITIAL_BALANCE,
      remaining: DEFAULT_INITIAL_BALANCE,
      grantedAt: nowISO(),
      expiresAt: plusDays(defaultSettings.defaultValidityDays),
      source: "INITIAL",
      note: "Saldo awal demo",
    },
  ];
  localStorage.setItem(GRANTS_KEY, JSON.stringify(seed));
  return seed;
}

function writeGrantsLS(list: PointGrant[]) {
  if (typeof window !== "undefined") localStorage.setItem(GRANTS_KEY, JSON.stringify(list));
}

function readHistoryLS(): PointHistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PointHistoryEntry[];
  } catch {}
  return [];
}

function writeHistoryLS(list: PointHistoryEntry[]) {
  if (typeof window !== "undefined") localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 200)));
}

function readSettings(): PointSettings {
  if (typeof window === "undefined") return defaultSettings;
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) {
    try {
      return { ...defaultSettings, ...(JSON.parse(raw) as PointSettings) };
    } catch {}
  }
  return defaultSettings;
}

function writeSettings(s: PointSettings) {
  if (typeof window !== "undefined") localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function applyExpiryLS(grants: PointGrant[]): {
  grants: PointGrant[];
  expired: number;
} {
  const now = Date.now();
  let expired = 0;
  const next: PointGrant[] = grants.map((g) => {
    if (new Date(g.expiresAt).getTime() <= now && g.remaining > 0) {
      expired += g.remaining;
      return { ...g, remaining: 0 };
    }
    return g;
  });
  return { grants: next, expired };
}

export function sumBalance(grants: PointGrant[]): number {
  return grants.reduce((acc, g) => acc + Math.max(0, g.remaining), 0);
}

/* ─────────── mappers DB row → UI ─────────── */

type DbGrant = {
  id: string;
  user_id: string;
  points: number;
  remaining: number;
  source: GrantSource;
  note: string | null;
  granted_at: string;
  expires_at: string;
};
type DbHist = {
  id: string;
  user_id: string;
  kind: HistoryKind;
  points: number;
  balance_after: number;
  note: string | null;
  at: string;
};

const toGrant = (r: DbGrant): PointGrant => ({
  id: r.id,
  points: r.points,
  remaining: r.remaining,
  grantedAt: r.granted_at,
  expiresAt: r.expires_at,
  source: r.source,
  note: r.note ?? undefined,
});
const toHist = (r: DbHist): PointHistoryEntry => ({
  id: r.id,
  kind: r.kind,
  points: r.points,
  balanceAfter: r.balance_after,
  at: r.at,
  note: r.note ?? undefined,
});

/* ─────────── Public API ─────────── */

export function useWallet() {
  const [grants, setGrants] = useState<PointGrant[]>([]);
  const [history, setHistory] = useState<PointHistoryEntry[]>([]);
  const [settings, setSettingsState] = useState<PointSettings>(defaultSettings);
  const userIdRef = useRef<string | null>(null);

  // Hydrate settings (always LS)
  useEffect(() => {
    setSettingsState(readSettings());
  }, []);

  useEffect(() => {
    const supa = getSupabase();

    // ─── LocalStorage mode ───
    if (!supa) {
      setGrants(readGrantsLS());
      setHistory(readHistoryLS());
      const onStorage = (e: StorageEvent) => {
        if (e.key === GRANTS_KEY) setGrants(readGrantsLS());
        if (e.key === HISTORY_KEY) setHistory(readHistoryLS());
        if (e.key === SETTINGS_KEY) setSettingsState(readSettings());
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }

    // ─── Supabase mode ───
    let cancelled = false;
    let channels: ReturnType<typeof supa.channel>[] = [];

    const hydrate = async (uid: string) => {
      const [{ data: g }, { data: h }] = await Promise.all([
        supa.from("point_grants").select("*").eq("user_id", uid).order("expires_at", { ascending: true }),
        supa.from("point_history").select("*").eq("user_id", uid).order("at", { ascending: false }).limit(200),
      ]);
      if (cancelled) return;
      setGrants(((g as DbGrant[]) ?? []).map(toGrant));
      setHistory(((h as DbHist[]) ?? []).map(toHist));
    };

    const refreshAll = () => {
      const uid = userIdRef.current;
      if (uid) hydrate(uid);
    };

    const bootstrap = async () => {
      const { data: s } = await supa.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid) {
        // Not logged in — show nothing / fall back to LS demo
        if (!cancelled) {
          setGrants(readGrantsLS());
          setHistory(readHistoryLS());
        }
        return;
      }
      userIdRef.current = uid;
      await hydrate(uid);

      channels.push(
        supa
          .channel(`pg_${Math.random().toString(36).slice(2)}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "point_grants",
              filter: `user_id=eq.${uid}`,
            },
            refreshAll,
          )
          .subscribe(),
      );
      channels.push(
        supa
          .channel(`ph_${Math.random().toString(36).slice(2)}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "point_history",
              filter: `user_id=eq.${uid}`,
            },
            refreshAll,
          )
          .subscribe(),
      );
    };

    bootstrap();

    const { data: authSub } = supa.auth.onAuthStateChange(async (_ev, sess) => {
      const newUid = sess?.user.id ?? null;
      if (newUid !== userIdRef.current) {
        channels.forEach((c) => supa.removeChannel(c));
        channels = [];
        userIdRef.current = newUid;
        if (newUid) {
          await hydrate(newUid);
          channels.push(
            supa
              .channel(`pg_${Math.random().toString(36).slice(2)}`)
              .on(
                "postgres_changes",
                {
                  event: "*",
                  schema: "public",
                  table: "point_grants",
                  filter: `user_id=eq.${newUid}`,
                },
                refreshAll,
              )
              .subscribe(),
          );
          channels.push(
            supa
              .channel(`ph_${Math.random().toString(36).slice(2)}`)
              .on(
                "postgres_changes",
                {
                  event: "*",
                  schema: "public",
                  table: "point_history",
                  filter: `user_id=eq.${newUid}`,
                },
                refreshAll,
              )
              .subscribe(),
          );
        } else {
          setGrants([]);
          setHistory([]);
        }
      }
    });

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
      channels.forEach((c) => supa.removeChannel(c));
    };
  }, []);

  const balance = sumBalance(grants);
  const nextExpiring = [...grants]
    .filter((g) => g.remaining > 0)
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())[0];

  const grantTo = useCallback(
    async (
      targetUserId: string,
      points: number,
      validityDays?: number,
      source: GrantSource = "ADMIN_GRANT",
      note?: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      if (points <= 0) return { ok: false, error: "Poin harus > 0" };
      const days = validityDays ?? readSettings().defaultValidityDays;
      const supa = getSupabase();
      if (!supa) return { ok: false, error: "Supabase tidak terkonfigurasi" };
      const { error } = await supa.rpc("apply_point_grant", {
        p_user_id: targetUserId,
        p_points: points,
        p_source: source,
        p_note: note ?? null,
        p_validity_days: days,
      });
      if (error) {
        console.warn("[points] grantTo rpc error", error.message);
        return { ok: false, error: error.message };
      }
      logAudit({
        action: "POINT_GRANT",
        target: `user:${targetUserId} +${points}pts (${source})`,
      });
      return { ok: true };
    },
    [],
  );

  const grant = useCallback(
    async (points: number, validityDays?: number, source: GrantSource = "ADMIN_GRANT", note?: string) => {
      if (points <= 0) return;
      const days = validityDays ?? readSettings().defaultValidityDays;
      const supa = getSupabase();

      if (supa && userIdRef.current) {
        const { error } = await supa.rpc("apply_point_grant", {
          p_user_id: userIdRef.current,
          p_points: points,
          p_source: source,
          p_note: note ?? null,
          p_validity_days: days,
        });
        if (error) {
          console.warn("[points] grant rpc error", error.message);
        }
        return;
      }

      // ─── LS path ───
      const freshExpiry = plusDays(days);
      const g: PointGrant = {
        id: `grant_${Date.now()}`,
        points,
        remaining: points,
        grantedAt: nowISO(),
        expiresAt: freshExpiry,
        source,
        note,
      };
      const existing = readGrantsLS().map((og) => (og.remaining > 0 ? { ...og, expiresAt: freshExpiry } : og));
      const list = [g, ...existing];
      writeGrantsLS(list);
      const hist = readHistoryLS();
      hist.unshift({
        id: `h_${Date.now()}`,
        kind: "GRANT",
        points,
        balanceAfter: sumBalance(list),
        at: nowISO(),
        note:
          note ??
          (source === "ADMIN_GRANT"
            ? "Hadiah dari admin"
            : source === "PURCHASE"
              ? "Pembelian paket poin"
              : "Kredit poin"),
      });
      writeHistoryLS(hist);
      setGrants(list);
      setHistory(hist);

      try {
        const email =
          typeof window !== "undefined" ? JSON.parse(localStorage.getItem("edudoc.current_user") ?? "{}")?.email : null;
        if (email) {
          maybeReactivateOnCredit(email, sumBalance(list));
          updateUserByEmail(email, { points: sumBalance(list) });
        }
      } catch {}
    },
    [],
  );

  const spend = useCallback(
    (amount: number, note?: string): boolean => {
      if (amount <= 0) return true;
      const supa = getSupabase();

      if (supa && userIdRef.current) {
        // Local check (optimistic) — real deduction happens server-side
        if (balance < amount) return false;
        void supa
          .rpc("spend_points", {
            p_user_id: userIdRef.current,
            p_amount: amount,
            p_note: note ?? null,
          })
          .then(({ error }) => {
            if (error) console.warn("[points] spend rpc error", error.message);
          });
        return true;
      }

      // ─── LS path ───
      const { grants: curGrants } = applyExpiryLS(readGrantsLS());
      const available = sumBalance(curGrants);
      if (available < amount) {
        writeGrantsLS(curGrants);
        setGrants(curGrants);
        return false;
      }
      const sorted = [...curGrants].sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
      let remaining = amount;
      for (const g of sorted) {
        if (remaining <= 0) break;
        if (g.remaining <= 0) continue;
        const take = Math.min(g.remaining, remaining);
        g.remaining -= take;
        remaining -= take;
      }
      const next = curGrants.map((g) => sorted.find((s) => s.id === g.id) ?? g);
      writeGrantsLS(next);
      const hist = readHistoryLS();
      hist.unshift({
        id: `h_${Date.now()}`,
        kind: "SPEND",
        points: amount,
        balanceAfter: sumBalance(next),
        at: nowISO(),
        note: note ?? "Pengeluaran poin",
      });
      writeHistoryLS(hist);
      setGrants(next);
      setHistory(hist);
      return true;
    },
    [balance],
  );

  const updateSettings = useCallback((patch: Partial<PointSettings>) => {
    const next = { ...readSettings(), ...patch };
    writeSettings(next);
    setSettingsState(next);
  }, []);

  const clearAll = useCallback(() => {
    const supa = getSupabase();
    if (supa && userIdRef.current) {
      void (async () => {
        await supa.from("point_grants").delete().eq("user_id", userIdRef.current);
        await supa.from("point_history").delete().eq("user_id", userIdRef.current);
      })();
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(GRANTS_KEY);
      localStorage.removeItem(HISTORY_KEY);
    }
    setGrants([]);
    setHistory([]);
  }, []);

  return {
    balance,
    grants,
    history,
    settings,
    nextExpiring,
    grant,
    grantTo,
    spend,
    updateSettings,
    clearAll,
  };
}

export function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
