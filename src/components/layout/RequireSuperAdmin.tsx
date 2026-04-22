"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { isSuperAdmin } from "@/config/roles";
import { getMyProfile } from "@/lib/auth-client";

export default function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const profile = await getMyProfile();
      if (cancelled) return;
      if (!profile || !isSuperAdmin(profile.role)) {
        router.replace("/admin/dashboard");
        return;
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!checked) return null;
  return <>{children}</>;
}
