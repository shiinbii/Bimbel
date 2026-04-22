import EduDocShell from "@/components/layout/EduDocShell";
import RoleGuard from "@/components/layout/RoleGuard";
import { ROLE_GROUP } from "@/config/roles";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={ROLE_GROUP.admin}>
      <EduDocShell>{children}</EduDocShell>
    </RoleGuard>
  );
}
