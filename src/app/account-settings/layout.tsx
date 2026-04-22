import EduDocShell from "@/components/layout/EduDocShell";
import RoleGuard from "@/components/layout/RoleGuard";

const ALL_ROLES = ["STUDENT", "TEACHER", "ADMIN", "SUPER_ADMIN"] as const;

export default function AccountSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowed={ALL_ROLES}>
      <EduDocShell>{children}</EduDocShell>
    </RoleGuard>
  );
}
