"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import ZoomSessionsManager from "@/components/admin/ZoomSessionsManager";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperZoomSessionsPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Kelola Sesi Zoom">
      <ZoomSessionsManager />
    </DashboardShell>
  );
}
