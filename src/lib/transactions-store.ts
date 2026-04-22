"use client";

import { useEffect, useState } from "react";
import { mockTransactions } from "./mock-data";
import { getSupabase } from "./supabase";
import type { Transaction, TxStatus } from "./types";

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
  package: r.package_name,
  amount: r.amount,
  points: r.points,
  method: r.method,
  status: r.status,
  createdAt: r.created_at,
});

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
      if (error || !data) {
        setList(mockTransactions);
        setSource("mock");
        setLoaded(true);
        return;
      }
      const rows = (data as DbRow[]).map(toTx);
      setList(rows.length > 0 ? rows : mockTransactions);
      setSource(rows.length > 0 ? "db" : "mock");
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`tx_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  return { list, loaded, source };
}
