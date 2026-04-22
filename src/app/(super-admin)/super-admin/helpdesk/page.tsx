"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import HelpdeskConsoleSection from "@/components/admin/sections/HelpdeskConsoleSection";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperAdminHelpdeskPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Helpdesk">
      <HelpdeskConsoleSection />
    </DashboardShell>
  );
}
