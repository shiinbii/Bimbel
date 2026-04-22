"use client";

import { useCallback, useEffect, useState } from "react";
import { logAudit } from "./audit-store";
import { getSupabase } from "./supabase";

const KEY = "edudoc.coin_pricing";

export interface CoinPricing {
  pricePerCoin: number;
  quickTopUps: number[];
}

export const defaultCoinPricing: CoinPricing = {
  pricePerCoin: 100,
  quickTopUps: [10, 50, 100, 500, 1000],
};

function readLS(): CoinPricing {
  if (typeof window === "undefined") return defaultCoinPricing;
  const raw = localStorage.getItem(KEY);
  if (!raw) return defaultCoinPricing;
  try {
    return { ...defaultCoinPricing, ...(JSON.parse(raw) as Partial<CoinPricing>) };
  } catch {
    return defaultCoinPricing;
  }
}

function writeLS(v: CoinPricing) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(v));
}

export function useCoinPricing() {
  const [pricing, setState] = useState<CoinPricing>(defaultCoinPricing);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setState(readLS());
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const { data } = await supa
        .from("coin_pricing")
        .select("payload")
        .eq("id", "default")
        .maybeSingle();
      if (cancelled) return;
      const payload = (data?.payload as Partial<CoinPricing>) ?? {};
      setState({ ...defaultCoinPricing, ...payload });
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`cprice_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coin_pricing" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const persist = (next: CoinPricing) => {
    writeLS(next);
    const supa = getSupabase();
    if (supa)
      void supa
        .from("coin_pricing")
        .upsert({ id: "default", payload: next, updated_at: new Date().toISOString() });
  };

  const update = useCallback((patch: Partial<CoinPricing>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
    logAudit({
      action: "COIN_PRICING_UPDATE",
      target: patch.pricePerCoin !== undefined ? `Rp${patch.pricePerCoin}/coin` : "pricing",
    });
  }, []);

  const reset = useCallback(() => {
    setState(defaultCoinPricing);
    persist(defaultCoinPricing);
  }, []);

  return { pricing, update, reset, loaded };
}

export function packageDiscount(
  packagePriceRp: number,
  packagePoints: number,
  pricePerCoin: number,
): number {
  if (pricePerCoin <= 0 || packagePoints <= 0) return 0;
  const base = packagePoints * pricePerCoin;
  if (base <= 0) return 0;
  const discount = 1 - packagePriceRp / base;
  return Math.max(0, Math.round(discount * 100));
}
