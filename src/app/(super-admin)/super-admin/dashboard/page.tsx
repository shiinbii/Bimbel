"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import Badge from "@/components/ui/Badge";
import StatsSection from "@/components/admin/sections/StatsSection";
import RevenueChartSection from "@/components/admin/sections/RevenueChartSection";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperAdminDashboard() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Super Admin">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] p-6 md:p-8 mb-8"
        style={{
          background:
            "radial-gradient(700px 250px at 90% 0%, rgba(245,158,11,0.2), transparent 60%), linear-gradient(140deg, rgba(99,102,241,0.12), rgba(245,158,11,0.04)), var(--color-bg)",
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-amber-300 text-xs uppercase tracking-[0.25em]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Super Admin Panel
            </span>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl text-[var(--color-text)]">
              Kendali penuh <span className="italic text-gradient-gold">platform EduDoc</span>
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-soft)] max-w-xl">
              Akses semua fitur admin plus manajemen tim, audit log, dan
              pengaturan sistem tingkat lanjut.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="gold" dot>Full Access</Badge>
            <Badge tone="live" dot>2 session aktif</Badge>
          </div>
        </div>
      </motion.div>

      <StatsSection />
      <div className="mt-8">
        <RevenueChartSection />
      </div>
    </DashboardShell>
  );
}
