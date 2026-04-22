"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "edudoc.landing_content";

export interface LandingStatItem {
  label: string;
  value: number;
  suffix?: string;
}

export interface LandingFeatureItem {
  title: string;
  desc: string;
}

export interface LandingContent {
  heroBadge: string;
  heroTitleLead: string;
  heroTitleAccent1: string;
  heroTitleConnector: string;
  heroTitleAccent2: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  stats: LandingStatItem[];
  marqueeTitle: string;
  marqueeItems: string[];
  featuresBadge: string;
  featuresTitleLead: string;
  featuresTitleAccent: string;
  featuresSubtitle: string;
  features: LandingFeatureItem[];
  pricingBadge: string;
  pricingTitleLead: string;
  pricingTitleAccent: string;
  pricingSubtitle: string;
  testimonialsBadge: string;
  testimonialsTitleLead: string;
  testimonialsTitleAccent: string;
  ctaBadge: string;
  ctaTitleLead: string;
  ctaTitleAccent: string;
  ctaDescription: string;
  ctaPrimaryButton: string;
  ctaSecondaryButton: string;
}

export const defaultLandingContent: LandingContent = {
  heroBadge: "Batch Baru Dibuka · April 2026",
  heroTitleLead: "Bimbel online yang",
  heroTitleAccent1: "terasa privat,",
  heroTitleConnector: "belajar yang",
  heroTitleAccent2: "terukur.",
  heroDescription:
    "EduDoc menghadirkan ekosistem belajar lengkap — quiz adaptif, sesi live zoom, dan sistem poin fleksibel — untuk persiapan ujian yang serius tanpa ribet.",
  heroPrimaryCta: "Mulai Belajar Gratis",
  heroSecondaryCta: "Tonton Demo 90 detik",
  stats: [
    { label: "Siswa aktif", value: 24850, suffix: "+" },
    { label: "Guru berpengalaman", value: 320 },
    { label: "Bank soal terverifikasi", value: 38400, suffix: "+" },
    { label: "Sesi live terselenggara", value: 6120 },
  ],
  marqueeTitle: "Dipercaya oleh 200+ sekolah & bimbel di Indonesia",
  marqueeItems: [
    "SMA Kanisius Jakarta",
    "SMA Negeri 1 Bandung",
    "SMA Negeri 3 Yogyakarta",
    "Bimbel Primagama",
    "Ganesha Operation",
    "SMA Taruna Bakti",
    "SMA Pradita Dirgantara",
    "Bimbel Sony Sugema",
    "SMA Labschool Kebayoran",
    "SMA Santa Ursula BSD",
    "Al Azhar Jakarta",
    "SMA Kolese Loyola Semarang",
  ],
  featuresBadge: "Fitur Unggulan",
  featuresTitleLead: "Semua yang kamu butuhkan untuk",
  featuresTitleAccent: "lolos ujian",
  featuresSubtitle:
    "Dari soal, sesi live, hingga pembahasan mendalam — semua dalam satu platform terintegrasi.",
  features: [
    {
      title: "Quiz Adaptif",
      desc: "Ribuan soal terkurasi dengan pembahasan detail untuk setiap tipe ujian — UTBK, UN, dan mandiri.",
    },
    {
      title: "Live Zoom Guru",
      desc: "Akses langsung ke guru top via sesi zoom interaktif dengan chat room dan waiting room.",
    },
    {
      title: "Sistem Poin Fleksibel",
      desc: "Bayar sekali, gunakan untuk apa saja. Poin bisa dipakai untuk quiz, sesi, atau bundle premium.",
    },
    {
      title: "Pembayaran Aman",
      desc: "Mendukung VA bank, GoPay, QRIS, dan kartu kredit. Transparan, tanpa biaya tersembunyi.",
    },
  ],
  pricingBadge: "Paket Poin",
  pricingTitleLead: "Bayar sekali,",
  pricingTitleAccent: "belajar selamanya",
  pricingSubtitle:
    "Pilih paket yang sesuai kebutuhan. Tanpa langganan. Tanpa biaya tersembunyi.",
  testimonialsBadge: "Kata Mereka",
  testimonialsTitleLead: "Didukung oleh ribuan",
  testimonialsTitleAccent: "siswa berprestasi",
  ctaBadge: "Slot Terbatas · Batch April 2026",
  ctaTitleLead: "Mulai perjalanan belajarmu",
  ctaTitleAccent: "hari ini",
  ctaDescription:
    "Gratis pre-test untuk user baru. Tidak perlu kartu kredit. Tidak ada auto-renewal.",
  ctaPrimaryButton: "Daftar Gratis Sekarang",
  ctaSecondaryButton: "Tonton Demo Video",
};

import { getSupabase } from "./supabase";

export function useLandingContent() {
  const [content, setState] = useState<LandingContent>(defaultLandingContent);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const { data } = await supa
        .from("landing_content")
        .select("payload")
        .eq("id", "default")
        .maybeSingle();
      if (cancelled) return;
      const payload = (data?.payload as Partial<LandingContent>) ?? {};
      setState({ ...defaultLandingContent, ...payload });
      setLoaded(true);
    };
    refresh();

    const ch = supa
      .channel(`lc_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "landing_content" },
        () => refresh()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supa.removeChannel(ch);
    };
  }, []);

  const persist = (next: LandingContent) => {
    const supa = getSupabase();
    if (supa)
      void supa
        .from("landing_content")
        .upsert({ id: "default", payload: next, updated_at: new Date().toISOString() });
  };

  const update = useCallback((patch: Partial<LandingContent>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  }, []);

  const replaceAll = useCallback((next: LandingContent) => {
    setState(next);
    persist(next);
  }, []);

  const reset = useCallback(() => {
    setState(defaultLandingContent);
    persist(defaultLandingContent);
  }, []);

  return { content, update, replaceAll, reset, loaded };
}
