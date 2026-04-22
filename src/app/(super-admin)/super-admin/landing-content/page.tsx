"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import LandingContentEditor from "@/components/admin/LandingContentEditor";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperLandingContentPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Edit Konten Landing">
      <LandingContentEditor />
    </DashboardShell>
  );
}
