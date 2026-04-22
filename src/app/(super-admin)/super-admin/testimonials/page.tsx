"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import TestimonialsManager from "@/components/admin/TestimonialsManager";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperTestimonialsPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Moderasi Testimoni">
      <TestimonialsManager />
    </DashboardShell>
  );
}
