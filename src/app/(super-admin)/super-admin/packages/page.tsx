"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import PackagesSection from "@/components/admin/sections/PackagesSection";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperPackagesPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Paket Harga">
      <PackagesSection />
    </DashboardShell>
  );
}
