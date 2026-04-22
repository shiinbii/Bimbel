"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import AuditLogSection from "@/components/admin/sections/AuditLogSection";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperAuditPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Audit Log">
      <AuditLogSection />
    </DashboardShell>
  );
}
