"use client";

import { motion } from "framer-motion";
import { BookOpen, Star, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import RadarChart from "@/components/ui/RadarChart";
import type { TeacherProfile } from "@/lib/teachers-store";
import { statLabels, overallScore } from "@/lib/teachers-store";

export default function TeacherProfileCard({
  t,
  index = 0,
  compact = false,
}: {
  t: TeacherProfile;
  index?: number;
  compact?: boolean;
}) {
  const statEntries = (Object.keys(t.stats) as (keyof typeof t.stats)[]).map(
    (k) => ({ key: k, label: statLabels[k], value: t.stats[k] })
  );
  const overall = overallScore(t.stats);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="card p-5 flex flex-col relative overflow-hidden"
    >
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="flex items-start gap-4 relative">
        <Avatar name={t.name} src={t.photo} size={compact ? 56 : 72} ring />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-serif text-xl text-[var(--color-text)] leading-tight">
                {t.name}
              </h3>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-soft)] mt-1">
                {t.subject}
              </p>
            </div>
            <div
              className="font-serif text-3xl leading-none text-gradient-gold shrink-0"
              title="Overall score"
            >
              {overall.toFixed(1)}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-[var(--color-text-soft)] flex-wrap">
            <span className="flex items-center gap-1 text-amber-300">
              <Star className="w-3 h-3 fill-amber-400" /> {t.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {t.students} siswa
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> {t.sessions} sesi
            </span>
            <Badge
              tone={t.status === "ACTIVE" ? "success" : "neutral"}
              className="text-[9px]"
            >
              {t.status}
            </Badge>
          </div>
        </div>
      </div>

      {!compact && (
        <p className="mt-4 text-sm text-[var(--color-text-soft)] leading-relaxed">
          {t.description}
        </p>
      )}

      <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-3 items-center">
        <div className="space-y-1.5">
          {statEntries.map((s) => (
            <div key={s.key} className="flex items-center gap-3 text-xs">
              <span className="w-28 text-[var(--color-text-soft)] uppercase tracking-widest text-[10px]">
                {s.label}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-soft)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(s.value / 10) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-amber-400"
                />
              </div>
              <span className="w-10 text-right font-mono text-[var(--color-text)]">
                {(Math.round(s.value * 10) / 10).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <RadarChart stats={statEntries} size={200} />
        </div>
      </div>
    </motion.div>
  );
}
