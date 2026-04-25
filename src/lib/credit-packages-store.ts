"use client";

import { logAudit } from "./audit-store";
import { getSupabase } from "./supabase";
import { useCallback, useEffect, useState } from "react";

const KEY = "edudoc.credit_packages";

export interface CreditPackage {
  id: string;
  points: number;
  price: number;
  bonus?: number;
  popular?: boolean;
  order: number;
}

export const DEFAULT_CREDIT_PACKAGES: CreditPackage[] = [
  { id: "cp_100", points: 100, price: 50_000, order: 1 },
  { id: "cp_250", points: 250, price: 100_000, order: 2 },
  { id: "cp_600", points: 600, price: 200_000, popular: true, order: 3 },
  { id: "cp_1200", points: 1200, price: 350_000, bonus: 200, order: 4 },
];

type DbRow = {
  id: string;
  points: number;
  price: number;
  bonus: number | null;
  popular: boolean;
  order: number;
  active: boolean;
};

const toPkg = (r: DbRow): CreditPackage => ({
  id: r.id,
  points: r.points,
  price: r.price,
  bonus: r.bonus ?? undefined,
  popular: r.popular || undefined,
  order: r.order,
});

const toDb = (p: CreditPackage) => ({
  id: p.id,
  points: p.points,
  price: p.price,
  bonus: p.bonus ?? 0,
  popular: !!p.popular,
  order: p.order,
  active: true,
});

function readLS(): CreditPackage[] {
  if (typeof window === "undefined") return DEFAULT_CREDIT_PACKAGES;
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_CREDIT_PACKAGES;
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return (p as CreditPackage[]).sort((a, b) => a.order - b.order);
  } catch {}
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
      setList(data && data.length ? (data as DbRow[]).map(toPkg) : DEFAULT_CREDIT_PACKAGES);
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
    const existing = readLS().some((x) => x.id === p.id);
    const isNew = !existing;
    setList((prev) =>
      (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p]).sort(
        (a, b) => a.order - b.order,
      ),
    );
    if (supa) {
      void supa
        .from("credit_packages")
        .upsert(toDb(p))
        .then(({ error }) => {
          if (error) console.warn("[packages] upsert error:", error.message);
        });
    } else {
      const next = (
        readLS().some((x) => x.id === p.id) ? readLS().map((x) => (x.id === p.id ? p : x)) : [...readLS(), p]
      ).sort((a, b) => a.order - b.order);
      writeLS(next);
    }
    logAudit({
      action: isNew ? "PACKAGE_CREATE" : "PACKAGE_UPDATE",
      target: `pkg:${p.id} ${p.points}pts/${p.price}`,
    });
  }, []);

  const remove = useCallback((id: string) => {
    const supa = getSupabase();
    setList((prev) => prev.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i + 1 })));
    if (supa) {
      void supa
        .from("credit_packages")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("[packages] delete error:", error.message);
        });
    } else {
      const next = readLS()
        .filter((p) => p.id !== id)
        .map((p, i) => ({ ...p, order: i + 1 }));
      writeLS(next);
    }
    logAudit({ action: "PACKAGE_DELETE", target: `pkg:${id}` });
  }, []);

  const reset = useCallback(() => {
    setList(DEFAULT_CREDIT_PACKAGES);
    const supa = getSupabase();
    if (!supa && typeof window !== "undefined") localStorage.removeItem(KEY);
  }, []);

  return { list, upsert, remove, reset, loaded };
}
