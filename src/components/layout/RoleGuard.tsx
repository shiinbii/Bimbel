"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { landingPathFor } from "@/config/roles";
import { getMyProfile } from "@/lib/auth-client";
import type { Role } from "@/lib/types";

export default function RoleGuard({
  allowed,
  children,
}: {
  allowed: readonly Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const allowedKey = allowed.join(",");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const profile = await getMyProfile();
      if (cancelled) return;
      if (!profile) {
        router.replace("/login");
        return;
      }
      if (!allowed.includes(profile.role)) {
        router.replace(landingPathFor(profile.role));
        return;
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedKey, router]);

  if (!checked) return null;
  return <>{children}</>;
}
