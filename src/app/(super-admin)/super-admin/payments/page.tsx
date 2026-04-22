"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import PaymentSettingsSection from "@/components/admin/sections/PaymentSettingsSection";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperAdminPaymentsPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Pengaturan Pembayaran">
      <PaymentSettingsSection />
    </DashboardShell>
  );
}
