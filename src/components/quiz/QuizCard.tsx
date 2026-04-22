"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, FileText, Play, Video as VideoIcon } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { Test } from "@/lib/types";
import { cn } from "@/lib/utils";

const typeMeta: Record<Test["type"], { label: string; tone: "primary" | "gold" | "info" }> = {
  PRE_TEST: { label: "Pre-Test", tone: "info" },
  EXAM: { label: "Ujian", tone: "primary" },
  VIDEO_QUIZ: { label: "Video Quiz", tone: "gold" },
};

export default function QuizCard({ test, index = 0 }: { test: Test; index?: number }) {
  const meta = typeMeta[test.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/student/quiz/${test.id}`}
        className={cn(
          "group block card card-hover p-5 h-full relative overflow-hidden"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            {test.requireVideo && (
              <Badge tone="gold" className="gap-1">
                <VideoIcon className="w-3 h-3" /> Tonton Video Dulu
              </Badge>
            )}
          </div>
          {test.cost === 0 ? (
            <Badge tone="success">Gratis</Badge>
          ) : (
            <div className="flex items-center gap-1 text-amber-300 text-sm font-semibold">
              <span className="text-[10px] uppercase text-[var(--color-text-soft)]">biaya</span>
              {test.cost} pts
            </div>
          )}
        </div>

        <h3 className="mt-4 font-serif text-xl text-[var(--color-text)] leading-tight group-hover:text-indigo-200 transition">
          {test.title}
        </h3>
        <p className="text-xs uppercase tracking-widest text-[var(--color-text-soft)] mt-1">
          {test.subject}
        </p>
        <p className="mt-3 text-sm text-[var(--color-text-soft)] line-clamp-2">
          {test.description}
        </p>

        <div className="mt-5 pt-4 border-t border-[var(--color-border-soft)] flex items-center justify-between text-xs text-[var(--color-text-soft)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> {test.totalQuestions} soal
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {test.duration} mnt
            </span>
          </div>
          <span className="flex items-center gap-1 text-indigo-300 font-medium group-hover:gap-2 transition-all">
            Mulai <Play className="w-3 h-3" />
          </span>
        </div>

        <div className="pointer-events-none absolute -right-20 -top-20 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition" />
      </Link>
    </motion.div>
  );
}
