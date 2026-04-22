import type { Role } from "@/lib/types";

export const ROLE_LANDING: Record<Role, string> = {
  STUDENT: "/student/dashboard",
  TEACHER: "/teacher/dashboard",
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Portal Siswa",
  TEACHER: "Portal Guru",
  ADMIN: "Portal Admin",
  SUPER_ADMIN: "Super Admin",
};

export const ROLE_GROUP: Record<"student" | "teacher" | "admin", readonly Role[]> = {
  student: ["STUDENT"],
  teacher: ["TEACHER"],
  admin: ["ADMIN", "SUPER_ADMIN"],
};

export function landingPathFor(role: Role): string {
  return ROLE_LANDING[role];
}

export function isSuperAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN";
}
