"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen, Calendar, ChevronLeft, Clock, Coins, GraduationCap,
  History, Home, Menu, Package, Settings, ShieldCheck,
  Sparkles, Users, Video, X, FileText, Activity, Youtube,
  MessageSquareQuote, Palette, Star, Gift, Image as ImageIcon, Crown,
  Headset, Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useRole } from "@/lib/role-context";
import { useWallet } from "@/lib/points-store";
import {
  computeTier,
  useTierConfigs,
  type TierConfig,
} from "@/lib/tier-config-store";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

function buildStudentNav(tier: TierConfig): NavItem[] {
  const items: NavItem[] = [
    { href: "/student/dashboard", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
    { href: "/student/quiz", label: "Soal & Quiz", icon: <BookOpen className="w-4 h-4" /> },
  ];
  if (tier.canAccessZoom) {
    items.push({ href: "/student/zoom", label: "Sesi Zoom", icon: <Video className="w-4 h-4" /> });
  }
  if (tier.canRequestPrivateZoom) {
    items.push({ href: "/student/private-zoom", label: "Sesi Privat", icon: <Crown className="w-4 h-4" /> });
  }
  items.push(
    { href: "/student/quiz-history", label: "Riwayat Soal", icon: <FileText className="w-4 h-4" /> },
    { href: "/student/history", label: "Riwayat Poin", icon: <History className="w-4 h-4" /> },
    { href: "/profile", label: "Profil", icon: <Users className="w-4 h-4" /> }
  );
  return items;
}

const teacherNav: NavItem[] = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
  { href: "/teacher/tests", label: "Kelola Soal", icon: <FileText className="w-4 h-4" /> },
  { href: "/teacher/sessions", label: "Jadwal Sesi", icon: <Calendar className="w-4 h-4" /> },
  { href: "/teacher/private-zoom", label: "Sesi Privat 1-on-1", icon: <Crown className="w-4 h-4" /> },
  { href: "/teacher/students", label: "Siswa", icon: <GraduationCap className="w-4 h-4" /> },
  { href: "/profile", label: "Profil", icon: <Users className="w-4 h-4" /> },
  { href: "/account-settings", label: "Pengaturan", icon: <Settings className="w-4 h-4" /> },
];

const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
  { href: "/admin/users", label: "User", icon: <Users className="w-4 h-4" /> },
  { href: "/admin/transactions", label: "Transaksi", icon: <Coins className="w-4 h-4" /> },
  { href: "/admin/packages", label: "Paket Harga", icon: <Package className="w-4 h-4" /> },
  { href: "/admin/payments", label: "Pembayaran", icon: <Wallet className="w-4 h-4" /> },
  { href: "/admin/tiers", label: "Tier Siswa", icon: <Crown className="w-4 h-4" /> },
  { href: "/admin/points", label: "Poin Manual", icon: <Gift className="w-4 h-4" /> },
  { href: "/admin/tests", label: "Kelola Soal", icon: <FileText className="w-4 h-4" /> },
  { href: "/admin/zoom-sessions", label: "Sesi Zoom", icon: <Video className="w-4 h-4" /> },
  { href: "/admin/teachers", label: "Profil Guru", icon: <GraduationCap className="w-4 h-4" /> },
  { href: "/admin/testimonials", label: "Testimoni", icon: <MessageSquareQuote className="w-4 h-4" /> },
  { href: "/admin/brochures", label: "Slider Alumni", icon: <ImageIcon className="w-4 h-4" /> },
  { href: "/admin/landing-content", label: "Edit Landing", icon: <Palette className="w-4 h-4" /> },
  { href: "/admin/demo-video", label: "Video Demo", icon: <Youtube className="w-4 h-4" /> },
  { href: "/admin/helpdesk", label: "Helpdesk", icon: <Headset className="w-4 h-4" /> },
  { href: "/profile", label: "Profil", icon: <Users className="w-4 h-4" /> },
  { href: "/account-settings", label: "Pengaturan Akun", icon: <Settings className="w-4 h-4" /> },
];

const superNav: NavItem[] = [
  { href: "/super-admin/dashboard", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
  { href: "/super-admin/users", label: "User", icon: <Users className="w-4 h-4" /> },
  { href: "/super-admin/transactions", label: "Transaksi", icon: <Coins className="w-4 h-4" /> },
  { href: "/super-admin/packages", label: "Paket Harga", icon: <Package className="w-4 h-4" /> },
  { href: "/super-admin/payments", label: "Pembayaran", icon: <Wallet className="w-4 h-4" /> },
  { href: "/super-admin/tiers", label: "Tier Siswa", icon: <Crown className="w-4 h-4" /> },
  { href: "/super-admin/points", label: "Poin Manual", icon: <Gift className="w-4 h-4" /> },
  { href: "/super-admin/tests", label: "Kelola Soal", icon: <FileText className="w-4 h-4" /> },
  { href: "/super-admin/zoom-sessions", label: "Sesi Zoom", icon: <Video className="w-4 h-4" /> },
  { href: "/super-admin/teachers", label: "Profil Guru", icon: <GraduationCap className="w-4 h-4" /> },
  { href: "/super-admin/testimonials", label: "Testimoni", icon: <MessageSquareQuote className="w-4 h-4" /> },
  { href: "/super-admin/brochures", label: "Slider Alumni", icon: <ImageIcon className="w-4 h-4" /> },
  { href: "/super-admin/landing-content", label: "Edit Landing", icon: <Palette className="w-4 h-4" /> },
  { href: "/super-admin/demo-video", label: "Video Demo", icon: <Youtube className="w-4 h-4" /> },
  { href: "/super-admin/helpdesk", label: "Helpdesk", icon: <Headset className="w-4 h-4" /> },
  { href: "/super-admin/management", label: "Admin & Guru", icon: <ShieldCheck className="w-4 h-4" /> },
  { href: "/super-admin/audit", label: "Audit Log", icon: <Activity className="w-4 h-4" /> },
  { href: "/super-admin/settings", label: "Pengaturan Fitur", icon: <Settings className="w-4 h-4" /> },
  { href: "/profile", label: "Profil", icon: <Users className="w-4 h-4" /> },
  { href: "/account-settings", label: "Pengaturan Akun", icon: <Settings className="w-4 h-4" /> },
];

const navMap: Record<Exclude<Role, "STUDENT">, NavItem[]> = {
  TEACHER: teacherNav,
  ADMIN: adminNav,
  SUPER_ADMIN: superNav,
};

const roleLabel: Record<Role, string> = {
  STUDENT: "Portal Siswa",
  TEACHER: "Portal Guru",
  ADMIN: "Portal Admin",
  SUPER_ADMIN: "Super Admin",
};

export default function Sidebar() {
  const { role } = useRole();
  const { balance } = useWallet();
  const { list: tiers } = useTierConfigs();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const currentTier = computeTier(balance, tiers);
  const items =
    role === "STUDENT" ? buildStudentNav(currentTier) : navMap[role];
  const showUpgrade = role === "STUDENT" && balance === 0;

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        className="flex items-center gap-3 px-6 py-6 border-b border-[var(--color-border-soft)]"
      >
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(99,102,241,0.7)]">
          <Sparkles className="w-5 h-5 text-[var(--color-text)]" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
        </div>
        <div>
          <p className="font-serif text-xl text-[var(--color-text)] leading-none">EduDoc</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-soft)] mt-1">
            {roleLabel[role]}
          </p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {items.map((item) => {
          const [basePath, hash] = item.href.split("#");
          const isExact = !hash && pathname === basePath;
          const isActive = isExact;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition relative",
                isActive
                  ? "text-[var(--color-text)] bg-[var(--color-bg-soft)] border border-[var(--color-border)]"
                  : "text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)]"
              )}
            >
              <span
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition",
                  isActive
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-[var(--color-text)]"
                    : "bg-[var(--color-bg-soft)] text-[var(--color-text-soft)] group-hover:bg-[var(--color-bg-soft)]"
                )}
              >
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <motion.span
                  layoutId="side-active"
                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-amber-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {showUpgrade && (
        <div className="p-4 border-t border-[var(--color-border-soft)]">
          <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-transparent border border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-amber-300">
              <Clock className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Saldo Kosong</span>
            </div>
            <p className="mt-2 text-sm text-[var(--color-text)] font-medium">
              Isi ulang poin untuk belajar
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-soft)]">
              Akses quiz premium dan sesi zoom interaktif dengan membeli paket
              poin.
            </p>
            <Link
              href="/student/dashboard#packages"
              className="mt-3 w-full block text-center text-xs font-semibold py-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-[#1a1200] hover:brightness-110 transition"
            >
              Beli Poin Sekarang
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/80 backdrop-blur flex items-center justify-center text-[var(--color-text)]"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-screen w-72 border-r border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)]/60 backdrop-blur-xl z-30">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 22, stiffness: 220 }}
              className="fixed top-0 left-0 h-screen w-72 border-r border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] z-50 lg:hidden"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-[var(--color-bg-soft)] flex items-center justify-center text-[var(--color-text)]"
              >
                <X className="w-4 h-4" />
              </button>
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
