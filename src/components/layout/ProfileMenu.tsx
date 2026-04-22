"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Home, LogOut, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useRole } from "@/lib/role-context";
import { useCurrentUser } from "@/lib/current-user";
import { mockUser } from "@/lib/mock-data";
import { sleep } from "@/lib/utils";

export default function ProfileMenu() {
  const router = useRouter();
  const { role, setRole } = useRole();
  const { user, clear } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const displayName = user.name || mockUser.name;
  const displayEmail = user.email || mockUser.email;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const doLogout = async () => {
    setLoggingOut(true);
    // Clear Supabase session + localStorage cache — WAIT until done
    await clear();
    setRole("STUDENT");
    setLoggingOut(false);
    setConfirm(false);
    setOpen(false);
    toast.success("Berhasil keluar dari EduDoc");
    // Pakai window.location.replace supaya halaman reload penuh — pastikan
    // semua state React di-reset dan tidak ada cache stale
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    } else {
      router.push("/login");
    }
  };

  const profileHref = "/profile";
  const settingsHref = "/account-settings";

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-3 pl-3 pr-2 py-1 rounded-xl border transition ${
          open
            ? "border-indigo-500/50 bg-[var(--color-bg-soft)]"
            : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-bg-soft)]"
        }`}
      >
        <Avatar name={displayName} src={user.avatar} size={36} ring />
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-[var(--color-text)] leading-none">
            {displayName}
          </p>
          <p className="text-xs text-[var(--color-text-soft)] mt-1">
            {role.replace("_", " ")}
          </p>
        </div>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          className="w-3 h-3 text-[var(--color-text-soft)] hidden sm:block"
          viewBox="0 0 10 6"
          fill="currentColor"
        >
          <path d="M0 0l5 6 5-6z" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="absolute right-0 mt-2 w-72 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 backdrop-blur-xl shadow-2xl z-40 overflow-hidden"
          >
            <div className="p-4 border-b border-[var(--color-border-soft)] bg-gradient-to-br from-indigo-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <Avatar name={displayName} src={user.avatar} size={48} ring />
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--color-text)] font-semibold truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-[var(--color-text-soft)] truncate">
                    {displayEmail}
                  </p>
                  <span className="inline-block mt-1 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                    {role.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2">
              <Link
                href={profileHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] transition"
              >
                <UserIcon className="w-4 h-4" /> Lihat Profil
              </Link>
              <Link
                href={settingsHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] transition"
              >
                <Settings className="w-4 h-4" /> Pengaturan Akun
              </Link>
            </div>

            <div className="p-2 border-t border-[var(--color-border-soft)]">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setConfirm(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Keluar dari EduDoc?"
        description="Sesi login kamu akan dihapus dari perangkat ini."
        size="sm"
        align="center"
        icon={<LogOut className="w-6 h-6" />}
      >
        <div className="flex items-center gap-2 pt-2">
          <Button full variant="ghost" onClick={() => setConfirm(false)}>
            Batal
          </Button>
          <Button
            full
            variant="danger"
            onClick={doLogout}
            loading={loggingOut}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Ya, Keluar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
