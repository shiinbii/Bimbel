"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import DemoVideoSetting from "@/components/admin/DemoVideoSetting";
import { useEnsureRole } from "@/lib/use-ensure-role";

export default function SuperDemoVideoPage() {
  useEnsureRole("SUPER_ADMIN");
  return (
    <DashboardShell title="Video Demo Landing">
      <DemoVideoSetting />
    </DashboardShell>
  );
}
