"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import SystemSettingsSection from "@/components/admin/sections/SystemSettingsSection";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperSettingsPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Pengaturan Sistem">
      <SystemSettingsSection />
    </DashboardShell>
  );
}
