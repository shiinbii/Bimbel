"use client";

import { motion } from "framer-motion";
import { Eye, Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Toggle from "@/components/ui/Toggle";

const systemFeatures = [
  { key: "otp", label: "Login OTP", desc: "Izinkan login via Email/SMS/WA", initial: true },
  { key: "google", label: "Google Login", desc: "Integrasi OAuth Google", initial: false },
  { key: "video", label: "Video Quiz", desc: "Fitur quiz dengan video pengantar", initial: true },
  { key: "zoom", label: "Live Zoom Class", desc: "Sesi interaktif via zoom", initial: true },
  { key: "points", label: "Sistem Poin", desc: "Transaksi berbasis poin", initial: true },
  { key: "referral", label: "Referral Bonus", desc: "Bonus poin untuk ajak teman", initial: false },
];

export default function SystemSettingsSection() {
  const [features, setFeatures] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(systemFeatures.map((f) => [f.key, f.initial]))
  );

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Pengaturan Sistem</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Aktifkan atau nonaktifkan fitur platform.
          </p>
        </div>
        <Badge tone="gold" className="gap-1">
          <Sparkles className="w-3 h-3" /> Mock Only
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemFeatures.map((f, i) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-2xl p-5 border transition ${
              features[f.key]
                ? "border-indigo-500/40 bg-gradient-to-br from-indigo-500/10 to-transparent"
                : "border-[var(--color-border)] bg-[var(--color-bg-soft)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--color-text)]">{f.label}</p>
                <p className="mt-1 text-xs text-[var(--color-text-soft)]">{f.desc}</p>
              </div>
              <Toggle
                checked={features[f.key]}
                size="md"
                onChange={(v) => {
                  setFeatures((s) => ({ ...s, [f.key]: v }));
                  toast(`${f.label} ${v ? "diaktifkan" : "dinonaktifkan"}`);
                }}
              />
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-soft)]">
              <Eye className="w-3 h-3" />
              {features[f.key] ? "Aktif untuk semua user" : "Dimatikan"}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
