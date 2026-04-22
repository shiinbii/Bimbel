"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import TestsManager from "@/components/admin/TestsManager";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperTestsPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Kelola Soal">
      <TestsManager />
    </DashboardShell>
  );
}
