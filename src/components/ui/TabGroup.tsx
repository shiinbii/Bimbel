"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface TabItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
}

interface Props {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  variant?: "pill" | "underline";
  full?: boolean;
}

export default function TabGroup({
  tabs,
  active,
  onChange,
  variant = "pill",
  full,
}: Props) {
  if (variant === "underline") {
    return (
      <div
        className={cn(
          "flex gap-1 border-b border-[var(--color-border)]",
          full && "w-full"
        )}
      >
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "text-[var(--color-text)]"
                  : "text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
              )}
            >
              <span className="flex items-center gap-2">
                {t.icon}
                {t.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-[var(--color-primary)]"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative inline-flex items-center p-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)]",
        full && "w-full"
      )}
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "relative z-10 flex-1 px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap",
              isActive ? "text-[var(--color-text)]" : "text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] shadow-[0_6px_20px_-8px_rgba(99,102,241,0.7)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center justify-center gap-2">
              {t.icon}
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
