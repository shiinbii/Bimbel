"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import PointsManager from "@/components/admin/PointsManager";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperPointsPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Grant Poin Manual">
      <PointsManager />
    </DashboardShell>
  );
}
