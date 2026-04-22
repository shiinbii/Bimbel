import type { Role } from "@/lib/types";
import type { MenuItem } from "@/types";

import { getAdminMenu } from "./admin";
import { studentMenu } from "./student";
import { teacherMenu } from "./teacher";

export interface RoleMenu {
  items: MenuItem[];
  bottomItems: MenuItem[];
}

export function getMenuForRole(role: Role): RoleMenu {
  switch (role) {
    case "TEACHER":
      return teacherMenu;
    case "ADMIN":
    case "SUPER_ADMIN":
      return getAdminMenu(role);
    case "STUDENT":
    default:
      return studentMenu;
  }
}
