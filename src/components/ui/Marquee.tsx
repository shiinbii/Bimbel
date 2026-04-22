"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Props {
  title?: string;
  items: string[];
  speed?: number; // seconds per full loop
  reverse?: boolean;
}

export default function Marquee({
  title,
  items,
  speed = 30,
  reverse = false,
}: Props) {
  if (!items || items.length === 0) return null;

  // Duplicate array for seamless loop
  const doubled = [...items, ...items];

  return (
    <section className="relative overflow-hidden py-10 border-y border-[var(--color-border-soft)] bg-gradient-to-b from-transparent via-indigo-500/[0.03] to-transparent">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {title && (
          <p className="text-center text-xs uppercase tracking-[0.3em] text-[var(--color-text-soft)] mb-6">
            {title}
          </p>
        )}

        <div className="relative">
          {/* Gradient masks at edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-[var(--color-bg)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-[var(--color-bg)] to-transparent" />

          <motion.div
            className="flex items-center gap-4 whitespace-nowrap"
            initial={{ x: reverse ? "-50%" : "0%" }}
            animate={{ x: reverse ? "0%" : "-50%" }}
            transition={{
              ease: "linear",
              duration: speed,
              repeat: Infinity,
            }}
          >
            {doubled.map((item, i) => (
              <span
                key={`${item}_${i}`}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-soft)] text-sm text-[var(--color-text)] shrink-0 backdrop-blur-sm"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
