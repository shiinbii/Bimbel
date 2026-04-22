"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import TeachersManager from "@/components/admin/TeachersManager";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperTeachersPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Profil Guru">
      <TeachersManager />
    </DashboardShell>
  );
}
