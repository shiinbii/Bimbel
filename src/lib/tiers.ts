"use client";

export type Tier = "STARTER" | "BASIC" | "POPULAR" | "PREMIUM";

export interface TierFeatures {
  label: string;
  badgeTone: "neutral" | "info" | "primary" | "gold";
  maxQuizzes: number;
  canAccessZoom: boolean;
  canRequestPrivateZoom: boolean;
  description: string;
  highlights: string[];
}

export const TIER_MAP: Record<Tier, TierFeatures> = {
  STARTER: {
    label: "Starter",
    badgeTone: "neutral",
    maxQuizzes: 10,
    canAccessZoom: false,
    canRequestPrivateZoom: false,
    description: "Akses dasar — soal & pre-test gratis.",
    highlights: [
      "Maksimal 10 quiz aktif",
      "Tidak termasuk sesi zoom live",
      "Cocok untuk mencoba platform",
    ],
  },
  BASIC: {
    label: "Basic",
    badgeTone: "info",
    maxQuizzes: 30,
    canAccessZoom: false,
    canRequestPrivateZoom: false,
    description: "Akses soal lebih banyak.",
    highlights: [
      "Maksimal 30 quiz aktif",
      "Pembahasan lengkap per soal",
      "Tidak termasuk sesi zoom live",
    ],
  },
  POPULAR: {
    label: "Popular",
    badgeTone: "primary",
    maxQuizzes: 80,
    canAccessZoom: true,
    canRequestPrivateZoom: false,
    description: "Akses soal + sesi zoom live grup.",
    highlights: [
      "Maksimal 80 quiz aktif",
      "Akses sesi zoom live grup",
      "Prioritas waiting room",
    ],
  },
  PREMIUM: {
    label: "Premium",
    badgeTone: "gold",
    maxQuizzes: Infinity,
    canAccessZoom: true,
    canRequestPrivateZoom: true,
    description: "Semua fitur + sesi privat 1-on-1 dengan guru pilihan.",
    highlights: [
      "Akses quiz tanpa batas",
      "Sesi zoom live grup",
      "Request sesi privat 1-on-1 dengan guru pilihan",
      "Notifikasi WA & email",
    ],
  },
};

export function tierFromPackageName(name: string): Tier {
  const n = name.toLowerCase();
  if (n.includes("premium")) return "PREMIUM";
  if (n.includes("pro") || n.includes("popular")) return "POPULAR";
  if (n.includes("basic")) return "BASIC";
  return "STARTER";
}

/** Higher tier wins when user already has a higher tier. */
const ORDER: Record<Tier, number> = {
  STARTER: 0,
  BASIC: 1,
  POPULAR: 2,
  PREMIUM: 3,
};

export function maxTier(a: Tier, b: Tier): Tier {
  return ORDER[a] >= ORDER[b] ? a : b;
}

export function getTierFeatures(tier: Tier): TierFeatures {
  return TIER_MAP[tier];
}
