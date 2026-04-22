import EduDocShell from "@/components/layout/EduDocShell";
import RoleGuard from "@/components/layout/RoleGuard";
import { ROLE_GROUP } from "@/config/roles";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={ROLE_GROUP.teacher}>
      <EduDocShell>{children}</EduDocShell>
    </RoleGuard>
  );
}
