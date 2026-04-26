"use client";

import { getSupabase } from "./supabase";
import type { PackageCategory } from "./types";
import { useCallback, useEffect, useState } from "react";

const KEY = "edudoc.credit_packages";

export interface CreditPackage {
  id: string;
  name: string;
  description: string;
  category: PackageCategory;
  points: number;
  price: number;
  /** Harga sebelum diskon (untuk strikethrough). Opsional. */
  originalPrice?: number;
  bonus?: number;
  popular?: boolean;
  order: number;
  /** Bullet list fitur paket. */
  features?: string[];
  /** Durasi akses dalam hari. 0 / undefined = tanpa batas. */
  durationDays?: number;
}

export const DEFAULT_CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "cp_token",
    name: "Token Satuan",
    description: "Top-up poin sesuai kebutuhan, tanpa kadaluarsa.",
    category: "TOKEN",
    points: 100,
    price: 50_000,
    order: 1,
    features: ["100 poin instan", "Berlaku selamanya", "Bisa untuk semua jenis akses"],
  },
  {
    id: "cp_tryout",
    name: "Paket Try Out",
    description: "Latihan ujian terjadwal lengkap dengan pembahasan.",
    category: "TRY_OUT",
    points: 250,
    price: 249_000,
    originalPrice: 400_000,
    order: 2,
    durationDays: 30,
    features: ["10x Try Out lengkap", "Pembahasan video tiap soal", "Ranking nasional realtime"],
  },
  {
    id: "cp_cbt",
    name: "CBT Reguler",
    description: "Akses bank soal CBT unlimited dengan retry.",
    category: "CBT",
    points: 600,
    price: 1_000_000,
    popular: true,
    order: 3,
    durationDays: 90,
    features: ["Bank soal 5000+ unlimited", "Retry tanpa batas", "Statistik kemampuan per topik"],
  },
  {
    id: "cp_materi",
    name: "Mindmap & Video",
    description: "Materi visual + video pembahasan terstruktur.",
    category: "MATERI",
    points: 800,
    price: 1_500_000,
    order: 4,
    durationDays: 90,
    features: ["200+ video materi", "Mindmap downloadable", "Catatan rangkuman PDF"],
  },
  {
    id: "cp_live",
    name: "Live Class Private",
    description: "Sesi tatap muka online dengan tutor expert.",
    category: "LIVE_CLASS",
    points: 1200,
    price: 2_500_000,
    bonus: 200,
    order: 5,
    durationDays: 30,
    features: ["8x sesi Zoom 1-on-1", "Tutor pilihan sendiri", "Bonus 200 poin akses materi"],
  },
];

type DbRow = {
  id: string;
  name: string | null;
  description: string | null;
  category: string | null;
  points: number;
  price: number;
  original_price: number | null;
  bonus: number | null;
  popular: boolean;
  order: number;
  features: string[] | null;
  duration_days: number | null;
  active: boolean;
};

const toPkg = (r: DbRow): CreditPackage => ({
  id: r.id,
  name: r.name ?? "Paket",
  description: r.description ?? "",
  category: (r.category as PackageCategory) ?? "TOKEN",
  points: r.points,
  price: r.price,
  originalPrice: r.original_price ?? undefined,
  bonus: r.bonus ?? undefined,
  popular: r.popular || undefined,
  order: r.order,
  features: r.features ?? undefined,
  durationDays: r.duration_days ?? undefined,
});

const toDb = (p: CreditPackage) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  category: p.category,
  points: p.points,
  price: p.price,
  original_price: p.originalPrice ?? null,
  bonus: p.bonus ?? 0,
  popular: !!p.popular,
  order: p.order,
  features: p.features ?? [],
  duration_days: p.durationDays ?? null,
  active: true,
});

function readLS(): CreditPackage[] {
  if (typeof window === "undefined") return DEFAULT_CREDIT_PACKAGES;
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_CREDIT_PACKAGES;
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return (p as CreditPackage[]).sort((a, b) => a.order - b.order);
  } catch {
    // ignore parse error, fallback to defaults
  }
  return DEFAULT_CREDIT_PACKAGES;
}
function writeLS(list: CreditPackage[]) {
  if (typeof window === "undefined") return;
  const s = JSON.stringify(list);
  localStorage.setItem(KEY, s);
  queueMicrotask(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: s }));
  });
}

export function useCreditPackages() {
  const [list, setList] = useState<CreditPackage[]>(DEFAULT_CREDIT_PACKAGES);
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
    const refresh = async () => {
      const { data } = await supa
        .from("credit_packages")
        .select("*")
        .eq("active", true)
        .order("order", { ascending: true });
      if (cancelled) return;
      // Kalau DB punya rows tapi semuanya belum punya field baru (name == null),
      // schema belum di-migrasi → fallback ke DEFAULT (5 paket baru) supaya UI
      // tetap menampilkan katalog yang relevan, bukan "Paket"/"Token" generik.
      const rows = (data ?? []) as DbRow[];
      const hasNewSchema = rows.some((r) => r.name != null && r.name !== "");
      setList(rows.length && hasNewSchema ? rows.map(toPkg) : DEFAULT_CREDIT_PACKAGES);
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`cp_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "credit_packages" }, () => refresh())
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const upsert = useCallback((p: CreditPackage) => {
    const supa = getSupabase();
    setList((prev) =>
      (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p]).sort(
        (a, b) => a.order - b.order,
      ),
    );
    if (supa) void supa.from("credit_packages").upsert(toDb(p));
    else {
      const next = (
        readLS().some((x) => x.id === p.id) ? readLS().map((x) => (x.id === p.id ? p : x)) : [...readLS(), p]
      ).sort((a, b) => a.order - b.order);
      writeLS(next);
    }
  }, []);

  const remove = useCallback((id: string) => {
    const supa = getSupabase();
    setList((prev) => prev.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i + 1 })));
    if (supa) void supa.from("credit_packages").delete().eq("id", id);
    else {
      const next = readLS()
        .filter((p) => p.id !== id)
        .map((p, i) => ({ ...p, order: i + 1 }));
      writeLS(next);
    }
  }, []);

  const reset = useCallback(() => {
    setList(DEFAULT_CREDIT_PACKAGES);
    const supa = getSupabase();
    if (!supa && typeof window !== "undefined") localStorage.removeItem(KEY);
  }, []);

  return { list, upsert, remove, reset, loaded };
}
