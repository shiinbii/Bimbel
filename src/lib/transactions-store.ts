"use client";

import { mockTransactions } from "./mock-data";
import { getSupabase } from "./supabase";
import type { Transaction, TxStatus } from "./types";
import { useEffect, useRef, useState } from "react";

export async function insertTransaction(tx: {
  userName: string;
  userEmail?: string | null;
  userId?: string | null;
  packageName: string;
  amount: number;
  points: number;
  method: string;
  status: TxStatus;
  /** Diisi kalau transaksi pembelian tier (Basic/Popular/Premium). */
  tierId?: string | null;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supa = getSupabase();
  if (!supa) return { ok: false, error: "Supabase tidak terkonfigurasi" };
  const id = `TX${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const { error } = await supa.from("transactions").insert({
    id,
    user_id: tx.userId ?? null,
    user_name: tx.userName,
    user_email: tx.userEmail ?? null,
    package_name: tx.packageName,
    amount: tx.amount,
    points: tx.points,
    method: tx.method,
    status: tx.status,
    tier_id: tx.tierId ?? null,
  });
  if (error) {
    console.warn("[transactions] insert error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true, id };
}

type DbRow = {
  id: string;
  user_name: string;
  user_email: string | null;
  package_name: string;
  amount: number;
  points: number;
  method: string;
  status: TxStatus;
  created_at: string;
};

const toTx = (r: DbRow): Transaction => ({
  id: r.id,
  user: r.user_name,
  userEmail: r.user_email,
  package: r.package_name,
  amount: r.amount,
  points: r.points,
  method: r.method,
  status: r.status,
  createdAt: r.created_at,
});

/**
 * Hook: tier_id yang user saat ini sudah pernah beli (status=SUCCESS).
 * Dipakai untuk:
 *  - cek "1 tier hanya boleh dibeli 1x" → button disable + badge "Aktif"
 *  - cek "user belum punya tier berbayar" → block top-up coin manual
 *
 * Return:
 *   purchased   = Set<string> tier_id yg sudah dibeli
 *   hasAnyPaid  = boolean — true kalau user punya minimal 1 tier berbayar
 *   loaded      = sudah selesai fetch
 */
export function useUserPurchasedTiers() {
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setLoaded(true);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const uid = userIdRef.current;
      if (!uid) {
        if (!cancelled) {
          setPurchased(new Set());
          setLoaded(true);
        }
        return;
      }
      const { data, error } = await supa
        .from("transactions")
        .select("tier_id")
        .eq("user_id", uid)
        .eq("status", "SUCCESS")
        .not("tier_id", "is", null);
      if (cancelled) return;
      if (error) {
        console.warn("[transactions] purchased tiers fetch error:", error.message);
        setPurchased(new Set());
      } else {
        const ids = (data as { tier_id: string | null }[]).map((r) => r.tier_id).filter((v): v is string => !!v);
        setPurchased(new Set(ids));
      }
      setLoaded(true);
    };

    const bootstrap = async () => {
      const { data: s } = await supa.auth.getSession();
      userIdRef.current = s.session?.user.id ?? null;
      await refresh();
    };

    bootstrap();

    const ch = supa
      .channel(`tx_purchased_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => refresh())
      .subscribe();

    const { data: authSub } = supa.auth.onAuthStateChange(async (_ev, sess) => {
      const newUid = sess?.user.id ?? null;
      if (newUid !== userIdRef.current) {
        userIdRef.current = newUid;
        await refresh();
      }
    });

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
      supa.removeChannel(ch);
    };
  }, []);

  return { purchased, hasAnyPaid: purchased.size > 0, loaded };
}

export function useTransactions() {
  const [list, setList] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [source, setSource] = useState<"db" | "mock">("mock");

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setList(mockTransactions);
      setSource("mock");
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const { data, error } = await supa
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (cancelled) return;
      if (error) {
        console.warn("[transactions] select error:", error.message);
        setList([]);
        setSource("db");
        setLoaded(true);
        return;
      }
      const rows = ((data as DbRow[]) ?? []).map(toTx);
      setList(rows);
      setSource("db");
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`tx_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => refresh())
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  return { list, loaded, source };
}
