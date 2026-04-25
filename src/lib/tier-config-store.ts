"use client";

import { getSupabase } from "./supabase";
import { useCallback, useEffect, useState } from "react";

const KEY = "edudoc.tier_configs";

export type TierBadgeTone = "neutral" | "info" | "primary" | "gold";

export interface TierConfig {
  id: string;
  name: string;
  minPoints: number;
  maxQuizzes: number;
  canAccessZoom: boolean;
  canRequestPrivateZoom: boolean;
  description: string;
  highlights: string[];
  badgeTone: TierBadgeTone;
  /** Harga tier (Rp). 0 = gratis (Starter auto-assigned). */
  price: number;
  /** Harga promo opsional. Kalau diisi & < price → tampil coret-coret. */
  discountPrice?: number;
  /** Poin yang langsung user dapat saat beli tier ini (sekali). */
  bonusPoints: number;
}

export const DEFAULT_TIERS: TierConfig[] = [
  {
    id: "tier_a",
    name: "Starter",
    minPoints: 0,
    maxQuizzes: 10,
    canAccessZoom: false,
    canRequestPrivateZoom: false,
    description: "Akses dasar — soal & pre-test gratis.",
    highlights: ["Maksimal 10 quiz aktif", "Tidak termasuk sesi zoom live", "Cocok untuk mencoba platform"],
    badgeTone: "neutral",
    price: 0,
    bonusPoints: 0,
  },
  {
    id: "tier_b",
    name: "Basic",
    minPoints: 250,
    maxQuizzes: 30,
    canAccessZoom: false,
    canRequestPrivateZoom: false,
    description: "Akses soal lebih banyak.",
    highlights: ["Maksimal 30 quiz aktif", "Pembahasan lengkap per soal", "Tidak termasuk sesi zoom live"],
    badgeTone: "info",
    price: 50_000,
    bonusPoints: 250,
  },
  {
    id: "tier_c",
    name: "Popular",
    minPoints: 600,
    maxQuizzes: 80,
    canAccessZoom: true,
    canRequestPrivateZoom: false,
    description: "Akses soal + sesi zoom live grup.",
    highlights: ["Maksimal 80 quiz aktif", "Akses sesi zoom live grup", "Prioritas waiting room"],
    badgeTone: "primary",
    price: 150_000,
    bonusPoints: 600,
  },
  {
    id: "tier_d",
    name: "Premium",
    minPoints: 1200,
    maxQuizzes: -1,
    canAccessZoom: true,
    canRequestPrivateZoom: true,
    description: "Semua fitur + sesi privat 1-on-1.",
    highlights: [
      "Akses quiz tanpa batas",
      "Sesi zoom live grup",
      "Request sesi privat 1-on-1 dengan guru pilihan",
      "Notifikasi WA & email",
    ],
    badgeTone: "gold",
    price: 350_000,
    bonusPoints: 1200,
  },
];

type DbRow = {
  id: string;
  name: string;
  min_points: number;
  max_quizzes: number;
  can_access_zoom: boolean;
  can_request_private_zoom: boolean;
  description: string;
  highlights: string[];
  badge_tone: TierBadgeTone;
  price: number | null;
  discount_price: number | null;
  bonus_points: number | null;
};

const toConfig = (r: DbRow): TierConfig => ({
  id: r.id,
  name: r.name,
  minPoints: r.min_points,
  maxQuizzes: r.max_quizzes,
  canAccessZoom: r.can_access_zoom,
  canRequestPrivateZoom: r.can_request_private_zoom,
  description: r.description,
  highlights: Array.isArray(r.highlights) ? r.highlights : [],
  badgeTone: r.badge_tone,
  price: r.price ?? 0,
  discountPrice: r.discount_price ?? undefined,
  bonusPoints: r.bonus_points ?? 0,
});

const toDbPatch = (c: TierConfig) => ({
  id: c.id,
  name: c.name,
  min_points: c.minPoints,
  max_quizzes: c.maxQuizzes,
  can_access_zoom: c.canAccessZoom,
  can_request_private_zoom: c.canRequestPrivateZoom,
  description: c.description,
  highlights: c.highlights,
  badge_tone: c.badgeTone,
  price: c.price,
  discount_price: c.discountPrice ?? null,
  bonus_points: c.bonusPoints,
});

function readLS(): TierConfig[] {
  if (typeof window === "undefined") return DEFAULT_TIERS;
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_TIERS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0)
      return (parsed as TierConfig[]).slice().sort((a, b) => a.minPoints - b.minPoints);
  } catch {}
  return DEFAULT_TIERS;
}

function writeLS(list: TierConfig[]) {
  if (typeof window === "undefined") return;
  const s = JSON.stringify(list);
  localStorage.setItem(KEY, s);
  queueMicrotask(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: s }));
  });
}

export function computeTier(points: number, tiers: TierConfig[] = DEFAULT_TIERS): TierConfig {
  if (tiers.length === 0) return DEFAULT_TIERS[0];
  const sorted = tiers.slice().sort((a, b) => a.minPoints - b.minPoints);
  let cur = sorted[0];
  for (const t of sorted) {
    if (points >= t.minPoints) cur = t;
  }
  return cur;
}

export function nextTier(current: TierConfig, tiers: TierConfig[]): TierConfig | null {
  const sorted = tiers.slice().sort((a, b) => a.minPoints - b.minPoints);
  const idx = sorted.findIndex((t) => t.id === current.id);
  if (idx === -1 || idx === sorted.length - 1) return null;
  return sorted[idx + 1];
}

export function useTierConfigs() {
  const [list, setList] = useState<TierConfig[]>(DEFAULT_TIERS);
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
    (async () => {
      const { data, error } = await supa.from("tier_configs").select("*").order("min_points", { ascending: true });
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setList(DEFAULT_TIERS);
      } else {
        setList((data as DbRow[]).map(toConfig));
      }
      setLoaded(true);
    })();

    const ch = supa
      .channel(`tier_configs_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tier_configs" }, async () => {
        const { data } = await supa.from("tier_configs").select("*").order("min_points", { ascending: true });
        if (!cancelled && data) setList((data as DbRow[]).map(toConfig));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const upsert = useCallback((t: TierConfig) => {
    const supa = getSupabase();
    if (!supa) {
      setList((prev) => {
        const exists = prev.some((x) => x.id === t.id);
        const next = (exists ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t])
          .slice()
          .sort((a, b) => a.minPoints - b.minPoints);
        writeLS(next);
        return next;
      });
      return;
    }
    // optimistic
    setList((prev) => {
      const exists = prev.some((x) => x.id === t.id);
      return (exists ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t])
        .slice()
        .sort((a, b) => a.minPoints - b.minPoints);
    });
    void supa.from("tier_configs").upsert(toDbPatch(t));
  }, []);

  const remove = useCallback((id: string) => {
    const supa = getSupabase();
    setList((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((t) => t.id !== id);
      if (!supa) writeLS(next);
      return next;
    });
    if (supa) void supa.from("tier_configs").delete().eq("id", id);
  }, []);

  const replaceAll = useCallback((next: TierConfig[]) => {
    const supa = getSupabase();
    const sorted = next.slice().sort((a, b) => a.minPoints - b.minPoints);
    setList(sorted);
    if (!supa) {
      writeLS(sorted);
      return;
    }
    void (async () => {
      // naive: upsert all
      for (const t of sorted) {
        await supa.from("tier_configs").upsert(toDbPatch(t));
      }
    })();
  }, []);

  const reset = useCallback(() => {
    setList(DEFAULT_TIERS);
    const supa = getSupabase();
    if (!supa) {
      if (typeof window !== "undefined") localStorage.removeItem(KEY);
      return;
    }
    void (async () => {
      for (const t of DEFAULT_TIERS) {
        await supa.from("tier_configs").upsert(toDbPatch(t));
      }
    })();
  }, []);

  return { list, upsert, remove, replaceAll, reset, loaded };
}

export function readTierConfigsOnce(): TierConfig[] {
  return readLS();
}
