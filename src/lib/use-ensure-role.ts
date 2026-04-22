"use client";

import { useEffect } from "react";
import type { Role } from "./types";
import { useRole } from "./role-context";

export function useEnsureRole(expected: Role) {
  const { role, setRole, loaded } = useRole();
  useEffect(() => {
    if (!loaded) return;
    if (role !== expected) setRole(expected);
  }, [role, expected, setRole, loaded]);
}
