import type { Role } from "@/lib/types";
import type { MenuItem } from "@/types";

const baseItems: MenuItem[] = [
  { id: "admin-dashboard", icon: "NiHome", label: "Dashboard", href: "/admin/dashboard" },
  { id: "admin-users", icon: "NiUsers", label: "User", href: "/admin/users" },
  { id: "admin-transactions", icon: "NiCoin", label: "Transaksi", href: "/admin/transactions" },
  { id: "admin-packages", icon: "NiBag", label: "Paket Harga", href: "/admin/packages" },
  { id: "admin-coin-pricing", icon: "NiCoin", label: "Point Pricing", href: "/admin/coin-pricing" },
  { id: "admin-payments", icon: "NiWallet", label: "Pembayaran", href: "/admin/payments" },
  { id: "admin-tiers", icon: "NiCrown", label: "Tier Siswa", href: "/admin/tiers" },
  { id: "admin-points", icon: "NiStars", label: "Poin Manual", href: "/admin/points" },
  { id: "admin-tests", icon: "NiDocumentCheck", label: "Kelola Soal", href: "/admin/tests" },
  { id: "admin-zoom-sessions", icon: "NiCamera", label: "Sesi Zoom", href: "/admin/zoom-sessions" },
  { id: "admin-teachers", icon: "NiGraduation", label: "Profil Guru", href: "/admin/teachers" },
  { id: "admin-testimonials", icon: "NiMessages", label: "Testimoni", href: "/admin/testimonials" },
  { id: "admin-brochures", icon: "NiDocumentImage", label: "Slider Alumni", href: "/admin/brochures" },
  { id: "admin-landing-content", icon: "NiPalette", label: "Edit Landing", href: "/admin/landing-content" },
  { id: "admin-demo-video", icon: "NiPlay", label: "Video Demo", href: "/admin/demo-video" },
  { id: "admin-helpdesk", icon: "NiHeadset", label: "Helpdesk", href: "/admin/helpdesk" },
];

const superAdminExtras: MenuItem[] = [
  { id: "admin-management", icon: "NiShieldCheck", label: "Admin & Guru", href: "/admin/management" },
  { id: "admin-audit", icon: "NiPulse", label: "Audit Log", href: "/admin/audit" },
  { id: "admin-feature-settings", icon: "NiSettings", label: "Pengaturan Fitur", href: "/admin/feature-settings" },
];

const bottomItems: MenuItem[] = [
  { id: "admin-profile", icon: "NiUser", label: "Profil", href: "/profile" },
  { id: "admin-settings", icon: "NiSettings", label: "Pengaturan Akun", href: "/account-settings" },
];

export function getAdminMenu(role: Role): { items: MenuItem[]; bottomItems: MenuItem[] } {
  const items = role === "SUPER_ADMIN" ? [...baseItems, ...superAdminExtras] : baseItems;
  return { items, bottomItems };
}
