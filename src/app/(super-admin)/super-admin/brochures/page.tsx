"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import BrochuresManager from "@/components/admin/BrochuresManager";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperBrochuresPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Slider Alumni">
      <BrochuresManager />
    </DashboardShell>
  );
}
