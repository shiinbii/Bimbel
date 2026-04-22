"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import StaffManagementSection from "@/components/admin/sections/StaffManagementSection";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperManagementPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Manajemen Admin & Guru">
      <StaffManagementSection />
    </DashboardShell>
  );
}
