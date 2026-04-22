"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

interface Props {
  variant?: "icon" | "switch";
  size?: "sm" | "md";
}

export default function ThemeToggle({ variant = "icon", size = "md" }: Props) {
  const { theme, toggle, loaded } = useTheme();
  const isDark = theme === "dark";

  if (!loaded) {
    return (
      <div
        className={
          size === "sm"
            ? "w-8 h-8 rounded-lg bg-[var(--color-bg-soft)] border border-[var(--color-border)]"
            : "w-10 h-10 rounded-xl bg-[var(--color-bg-soft)] border border-[var(--color-border)]"
        }
      />
    );
  }

  if (variant === "switch") {
    return (
      <button
        type="button"
        onClick={toggle}
        title={isDark ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
        className="relative flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-0.5 h-8"
      >
        <span
          className={`flex items-center gap-1.5 px-2.5 h-full rounded-full text-[11px] font-medium transition ${
            !isDark
              ? "bg-gradient-to-br from-amber-400 to-amber-600 text-[#1a1200] shadow-sm"
              : "text-[var(--color-text-soft)]"
          }`}
        >
          <Sun className="w-3 h-3" />
          Light
        </span>
        <span
          className={`flex items-center gap-1.5 px-2.5 h-full rounded-full text-[11px] font-medium transition ${
            isDark
              ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-[var(--color-text)] shadow-sm"
              : "text-[var(--color-text-soft)]"
          }`}
        >
          <Moon className="w-3 h-3" />
          Dark
        </span>
      </button>
    );
  }

  const dim = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  return (
    <motion.button
      type="button"
      onClick={toggle}
      title={isDark ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
      whileTap={{ scale: 0.9 }}
      className={`${dim} rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] flex items-center justify-center text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:border-indigo-500/40 transition overflow-hidden relative`}
      aria-label="Toggle tema"
    >
      <motion.span
        key={theme}
        initial={{ y: -18, opacity: 0, rotate: -90 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        exit={{ y: 18, opacity: 0, rotate: 90 }}
        transition={{ type: "spring", damping: 20, stiffness: 260 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-indigo-300" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </motion.span>
    </motion.button>
  );
}
