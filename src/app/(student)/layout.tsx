"use client";

import { useSearchParams } from "next/navigation";

import EduDocShell from "@/components/layout/EduDocShell";
import RoleGuard from "@/components/layout/RoleGuard";
import { ROLE_GROUP } from "@/config/roles";
import type { Role } from "@/lib/types";

const PREVIEW_ALLOWED: Role[] = [...ROLE_GROUP.student, "ADMIN", "SUPER_ADMIN"];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const allowed = isPreview ? PREVIEW_ALLOWED : ROLE_GROUP.student;

  return (
    <RoleGuard allowed={allowed}>
      <EduDocShell>{children}</EduDocShell>
    </RoleGuard>
  );
}
