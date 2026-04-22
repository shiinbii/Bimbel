"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import UsersSection from "@/components/admin/sections/UsersSection";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperUsersPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Kelola User">
      <UsersSection canManage={true} />
    </DashboardShell>
  );
}
