"use client";

import { getSupabase } from "./supabase";
import { useEffect, useState } from "react";

export interface AdminStats {
  totalUsers: number;
  newUsersThisMonth: number;
  transactionsToday: number;
  transactionsTodaySuccess: number;
  transactionsTodayPending: number;
  revenueThisMonth: number;
  revenueGrowthPct: number;
  liveSessions: number;
  scheduledSessions: number;
  loaded: boolean;
  /** "db" jika data berasal dari Supabase, "fallback" jika query gagal/tabel kosong. */
  source: "db" | "fallback";
}

const FALLBACK: AdminStats = {
  totalUsers: 0,
  newUsersThisMonth: 0,
  transactionsToday: 0,
  transactionsTodaySuccess: 0,
  transactionsTodayPending: 0,
  revenueThisMonth: 0,
  revenueGrowthPct: 0,
  liveSessions: 0,
  scheduledSessions: 0,
  loaded: false,
  source: "fallback",
};

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function startOfThisMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}
function startOfLastMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString();
}

export function useAdminStats(): AdminStats {
  const [stats, setStats] = useState<AdminStats>(FALLBACK);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setStats({ ...FALLBACK, loaded: true });
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      const todayIso = startOfTodayIso();
      const monthStart = startOfThisMonthIso();
      const lastMonthStart = startOfLastMonthIso();

      const [
        usersTotal,
        usersNewMonth,
        txToday,
        txTodaySuccess,
        txTodayPending,
        revenueMonthRes,
        revenueLastMonthRes,
        sessionsLive,
        sessionsScheduled,
      ] = await Promise.all([
        supa.from("profiles").select("id", { count: "exact", head: true }),
        supa.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
        supa.from("transactions").select("id", { count: "exact", head: true }).gte("created_at", todayIso),
        supa
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayIso)
          .eq("status", "SUCCESS"),
        supa
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayIso)
          .eq("status", "PENDING"),
        supa.from("transactions").select("amount").gte("created_at", monthStart).eq("status", "SUCCESS"),
        supa
          .from("transactions")
          .select("amount")
          .gte("created_at", lastMonthStart)
          .lt("created_at", monthStart)
          .eq("status", "SUCCESS"),
        supa.from("zoom_sessions").select("id", { count: "exact", head: true }).eq("status", "LIVE"),
        supa.from("zoom_sessions").select("id", { count: "exact", head: true }).eq("status", "SCHEDULED"),
      ]);

      if (cancelled) return;

      const sumAmount = (rows: { amount: number | string | null }[] | null | undefined): number =>
        (rows ?? []).reduce((acc, r) => acc + Number(r?.amount ?? 0), 0);

      const revenueMonth = sumAmount(revenueMonthRes.data ?? null);
      const revenueLastMonth = sumAmount(revenueLastMonthRes.data ?? null);
      const growth =
        revenueLastMonth > 0 ? Math.round(((revenueMonth - revenueLastMonth) / revenueLastMonth) * 100) : 0;

      // Kalau semua query error (mis. tabel belum ada), tandai sebagai fallback
      // — UI bisa tampilkan placeholder/mock.
      const allFailed = usersTotal.error && txToday.error && sessionsLive.error;

      setStats({
        totalUsers: usersTotal.count ?? 0,
        newUsersThisMonth: usersNewMonth.count ?? 0,
        transactionsToday: txToday.count ?? 0,
        transactionsTodaySuccess: txTodaySuccess.count ?? 0,
        transactionsTodayPending: txTodayPending.count ?? 0,
        revenueThisMonth: revenueMonth,
        revenueGrowthPct: growth,
        liveSessions: sessionsLive.count ?? 0,
        scheduledSessions: sessionsScheduled.count ?? 0,
        loaded: true,
        source: allFailed ? "fallback" : "db",
      });
    };

    refresh();

    // Realtime: refresh saat ada perubahan di tabel terkait
    const ch = supa
      .channel(`adm_stats_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "zoom_sessions" }, () => refresh())
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  return stats;
}
