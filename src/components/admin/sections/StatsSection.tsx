"use client";

import { Coins, DollarSign, Users, Video } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import CountUp from "@/components/ui/CountUp";
import { mockStudents, mockTeachers } from "@/lib/mock-data";
import { useZoomSessions } from "@/lib/zoom-sessions-store";

export default function StatsSection() {
  const { list: zoomList } = useZoomSessions();
  const liveCount = zoomList.filter((z) => z.status === "LIVE").length;
  const totalMonth = 1250; // same seed as revenue chart

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total User"
        value={mockStudents.length + mockTeachers.length + 1420}
        accent="primary"
        icon={<Users className="w-5 h-5 text-indigo-300" />}
        trend="+248 bulan ini"
      />
      <StatCard
        label="Transaksi Hari Ini"
        value={<CountUp to={42} />}
        accent="gold"
        icon={<Coins className="w-5 h-5 text-amber-300" />}
        trend="24 sukses · 6 pending"
        delay={0.1}
      />
      <StatCard
        label="Revenue Bulan Ini"
        value={<CountUp to={totalMonth * 100_000} prefix="Rp " />}
        accent="success"
        icon={<DollarSign className="w-5 h-5 text-emerald-300" />}
        trend="+18% MoM"
        delay={0.2}
      />
      <StatCard
        label="Sesi Aktif"
        value={<CountUp to={liveCount + 12} />}
        accent="info"
        icon={<Video className="w-5 h-5 text-sky-300" />}
        trend={`${liveCount} live sekarang`}
        delay={0.3}
      />
    </div>
  );
}
