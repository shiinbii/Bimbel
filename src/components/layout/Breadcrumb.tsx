"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Breadcrumbs, Typography } from "@mui/material";

import NiHome from "@/icons/nexture/ni-home";

const SEGMENT_LABELS: Record<string, string> = {
  student: "Siswa",
  teacher: "Guru",
  admin: "Admin",
  "super-admin": "Super Admin",
  dashboard: "Dashboard",
  quiz: "Soal & Quiz",
  zoom: "Sesi Zoom",
  "private-zoom": "Sesi Privat",
  "quiz-history": "Riwayat Soal",
  history: "Riwayat Poin",
  tests: "Kelola Soal",
  sessions: "Jadwal Sesi",
  students: "Siswa",
  users: "User",
  transactions: "Transaksi",
  packages: "Paket Harga",
  payments: "Pembayaran",
  tiers: "Tier Siswa",
  points: "Poin Manual",
  "zoom-sessions": "Sesi Zoom",
  teachers: "Profil Guru",
  testimonials: "Testimoni",
  brochures: "Slider Alumni",
  "landing-content": "Edit Landing",
  "demo-video": "Video Demo",
  helpdesk: "Helpdesk",
  management: "Admin & Guru",
  audit: "Audit Log",
  settings: "Pengaturan",
  profile: "Profil",
  "account-settings": "Pengaturan Akun",
};

function humanise(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ??
    segment
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <Breadcrumbs aria-label="breadcrumb" className="mb-4 text-sm" separator="/">
      <Link href="/" className="text-text-secondary hover:text-primary flex items-center gap-1">
        <NiHome size={14} />
        <span>Beranda</span>
      </Link>
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = "/" + segments.slice(0, index + 1).join("/");
        const label = humanise(segment);
        if (isLast) {
          return (
            <Typography key={href} component="span" className="text-text-primary font-medium">
              {label}
            </Typography>
          );
        }
        return (
          <Link key={href} href={href} className="text-text-secondary hover:text-primary">
            {label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
