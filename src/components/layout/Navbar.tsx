"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import PointBadge from "@/components/ui/PointBadge";
import { mockUser } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { useCurrentUser } from "@/lib/current-user";
import { useWallet } from "@/lib/points-store";
import ProfileMenu from "./ProfileMenu";
import ThemeToggle from "./ThemeToggle";
import NotificationsBell from "./NotificationsBell";

const roleTitle: Record<string, string> = {
  STUDENT: "Selamat Belajar",
  TEACHER: "Siap Mengajar",
  ADMIN: "Pantau Platform",
  SUPER_ADMIN: "Super Admin Area",
};

export default function Navbar({ subtitle }: { subtitle?: string }) {
  const { role } = useRole();
  const { user } = useCurrentUser();
  const { balance } = useWallet();
  const displayName = user.name || mockUser.name;
  const firstName = displayName.split(" ")[0];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-20 backdrop-blur-xl bg-[var(--color-bg)]/70 border-b border-[var(--color-border-soft)]"
    >
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="pl-12 lg:pl-0">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-soft)]">
            {roleTitle[role]}
          </p>
          <h1 className="font-serif text-2xl text-[var(--color-text)] mt-0.5">
            {subtitle ?? `Halo, ${firstName}`}
          </h1>
        </div>

        <div className="hidden md:flex flex-1 max-w-md">
          <div className="flex w-full items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3.5 focus-within:border-[var(--color-primary)] transition">
            <Search className="w-4 h-4 text-[var(--color-text-soft)]" />
            <input
              placeholder="Cari soal, sesi, guru..."
              className="flex-1 h-10 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-mute)]"
            />
            <kbd className="hidden lg:inline-flex text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-mute)]">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {role === "STUDENT" && (
            <PointBadge points={balance} size="sm" />
          )}
          <NotificationsBell />
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </motion.header>
  );
}
