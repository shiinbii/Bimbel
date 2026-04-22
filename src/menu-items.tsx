"use client";

import { useMemo } from "react";

import { getMenuForRole } from "@/config/menu/get-menu";
import { studentMenu } from "@/config/menu/student";
import { useRole } from "@/lib/role-context";
import type { MenuItem } from "@/types";

export function useMenuItems(): { leftMenuItems: MenuItem[]; leftMenuBottomItems: MenuItem[] } {
  const { role } = useRole();
  return useMemo(() => {
    const menu = getMenuForRole(role);
    return { leftMenuItems: menu.items, leftMenuBottomItems: menu.bottomItems };
  }, [role]);
}

export const leftMenuItems: MenuItem[] = studentMenu.items;
export const leftMenuBottomItems: MenuItem[] = studentMenu.bottomItems;
