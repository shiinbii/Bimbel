"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import TransactionsSection from "@/components/admin/sections/TransactionsSection";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperTransactionsPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Transaksi">
      <TransactionsSection />
    </DashboardShell>
  );
}
