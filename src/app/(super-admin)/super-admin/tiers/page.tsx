"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import TiersManager from "@/components/admin/TiersManager";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperTiersPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Tier Siswa">
      <TiersManager />
    </DashboardShell>
  );
}
