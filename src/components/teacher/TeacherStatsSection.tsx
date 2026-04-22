"use client";

import { FileText, Star, Users, Video } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { mockTests } from "@/lib/mock-data";

export default function TeacherStatsSection() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Siswa"
        value={468}
        accent="primary"
        icon={<Users className="w-5 h-5 text-indigo-300" />}
        trend="+24 minggu ini"
      />
      <StatCard
        label="Total Sesi"
        value={120}
        accent="info"
        icon={<Video className="w-5 h-5 text-sky-300" />}
        trend="15 live"
        delay={0.1}
      />
      <StatCard
        label="Rating Guru"
        value="4.9"
        accent="gold"
        icon={<Star className="w-5 h-5 text-amber-300" />}
        trend="1,204 review"
        delay={0.2}
      />
      <StatCard
        label="Soal Dibuat"
        value={mockTests.length}
        accent="success"
        icon={<FileText className="w-5 h-5 text-emerald-300" />}
        trend="+3 draft"
        delay={0.3}
      />
    </div>
  );
}
