"use client";

import { useCurrentUser } from "@/lib/current-user";
import { usePresenceHeartbeat } from "@/lib/helpdesk-store";
import { useRole } from "@/lib/role-context";

export default function HelpdeskPresence() {
  const { user } = useCurrentUser();
  const { role } = useRole();
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  usePresenceHeartbeat(
    isAdmin ? user.email : undefined,
    user.name || "Admin",
    role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
    isAdmin,
  );
  return null;
}
