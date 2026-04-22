"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: string;
  accent?: "primary" | "gold" | "success" | "info";
  delay?: number;
}

const accentMap = {
  primary: "from-indigo-500/15 to-indigo-500/0 border-indigo-500/25 text-indigo-300",
  gold: "from-amber-500/15 to-amber-500/0 border-amber-500/25 text-amber-300",
  success: "from-emerald-500/15 to-emerald-500/0 border-emerald-500/25 text-emerald-300",
  info: "from-sky-500/15 to-sky-500/0 border-sky-500/25 text-sky-300",
};

export default function StatCard({
  label,
  value,
  icon,
  trend,
  accent = "primary",
  delay = 0,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 border",
        "bg-gradient-to-br",
        accentMap[accent]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-soft)]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-serif text-[var(--color-text)]">{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-[var(--color-text-soft)]">{trend}</p>
          )}
        </div>
        {icon && (
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-bg-soft)] border border-[var(--color-border)]">
            {icon}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-[var(--color-bg-soft)] blur-3xl" />
    </motion.div>
  );
}
