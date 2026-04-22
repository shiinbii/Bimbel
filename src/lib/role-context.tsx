"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Role } from "./types";
import { getSupabase } from "./supabase";

interface RoleCtx {
  role: Role;
  setRole: (role: Role) => void;
  loaded: boolean;
}

const Ctx = createContext<RoleCtx>({
  role: "STUDENT",
  setRole: () => {},
  loaded: false,
});

const KEY = "edudoc.role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("STUDENT");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(KEY) as Role | null;
    if (saved) setRoleState(saved);
    setLoaded(true);

    const supa = getSupabase();
    if (!supa) return;

    let cancelled = false;

    const syncFromSession = async () => {
      const { data: s } = await supa.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid) return; // tidak ada session → jangan override role lokal
      const { data } = await supa
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .maybeSingle();
      if (cancelled || !data) return;
      const serverRole = (data as { role: Role }).role;
      if (serverRole) {
        setRoleState(serverRole);
        localStorage.setItem(KEY, serverRole);
      }
    };

    syncFromSession();

    const { data: sub } = supa.auth.onAuthStateChange(() => {
      if (!cancelled) syncFromSession();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    if (typeof window !== "undefined") localStorage.setItem(KEY, r);
    // Note: kita TIDAK update profile.role dari FE — itu cuma boleh dari admin.
    // RoleSwitcher demo hanya ubah state lokal.
  }, []);

  return <Ctx.Provider value={{ role, setRole, loaded }}>{children}</Ctx.Provider>;
}

export const useRole = () => useContext(Ctx);
