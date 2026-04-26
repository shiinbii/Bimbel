"use client";

import { Coins, DollarSign, Users, Video } from "lucide-react";

import CountUp from "@/components/ui/CountUp";
import StatCard from "@/components/ui/StatCard";
import { useAdminStats } from "@/lib/admin-stats";

export default function StatsSection() {
  const s = useAdminStats();

  const userTrend =
    s.newUsersThisMonth > 0
      ? `+${s.newUsersThisMonth} bulan ini`
      : s.loaded && s.source === "fallback"
        ? "Belum ada data"
        : "—";

  const txTrend =
    s.transactionsToday > 0
      ? `${s.transactionsTodaySuccess} sukses · ${s.transactionsTodayPending} pending`
      : s.loaded && s.source === "fallback"
        ? "Belum ada data"
        : "—";

  const revenueTrend =
    s.revenueGrowthPct !== 0
      ? `${s.revenueGrowthPct > 0 ? "+" : ""}${s.revenueGrowthPct}% MoM`
      : s.loaded && s.source === "fallback"
        ? "Belum ada data"
        : "—";

  const sessionTrend =
    s.liveSessions > 0
      ? `${s.liveSessions} live sekarang`
      : s.scheduledSessions > 0
        ? `${s.scheduledSessions} terjadwal`
        : "Tidak ada sesi aktif";

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Total User"
        value={<CountUp to={s.totalUsers} />}
        accent="primary"
        icon={<Users className="h-5 w-5 text-indigo-300" />}
        trend={userTrend}
      />
      <StatCard
        label="Transaksi Hari Ini"
        value={<CountUp to={s.transactionsToday} />}
        accent="gold"
        icon={<Coins className="h-5 w-5 text-amber-300" />}
        trend={txTrend}
        delay={0.1}
      />
      <StatCard
        label="Revenue Bulan Ini"
        value={<CountUp to={s.revenueThisMonth} prefix="Rp " />}
        accent="success"
        icon={<DollarSign className="h-5 w-5 text-emerald-300" />}
        trend={revenueTrend}
        delay={0.2}
      />
      <StatCard
        label="Sesi Aktif"
        value={<CountUp to={s.liveSessions + s.scheduledSessions} />}
        accent="info"
        icon={<Video className="h-5 w-5 text-sky-300" />}
        trend={sessionTrend}
        delay={0.3}
      />
    </div>
  );
}
