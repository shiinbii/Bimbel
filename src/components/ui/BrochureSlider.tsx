"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Brochure } from "@/lib/brochures-store";

interface Props {
  brochures: Brochure[];
  autoplay?: boolean;
  interval?: number; // ms between auto slides
}

export default function BrochureSlider({
  brochures,
  autoplay = true,
  interval = 5500,
}: Props) {
  const [idx, setIdx] = useState(0);
  const n = brochures.length;

  // Single auto-advance timer. Depends on `idx` so it resets every time the
  // slide changes — manual navigation cancels the pending advance and starts
  // a fresh wait, preventing any slide from being skipped.
  useEffect(() => {
    if (!autoplay || n <= 1) return;
    const t = setTimeout(() => {
      setIdx((i) => (i + 1) % n);
    }, interval);
    return () => clearTimeout(t);
  }, [autoplay, interval, n, idx]);

  const goPrev = useCallback(() => {
    setIdx((i) => (i - 1 + n) % n);
  }, [n]);

  const goNext = useCallback(() => {
    setIdx((i) => (i + 1) % n);
  }, [n]);

  const goTo = useCallback(
    (target: number) => {
      setIdx(((target % n) + n) % n);
    },
    [n]
  );

  if (n === 0) return null;
  const current = brochures[idx];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 shadow-[0_20px_60px_-20px_rgba(99,102,241,0.35)]">
      <div className="relative aspect-[2/1] w-full bg-black/40">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.image}
              alt={current.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
              <motion.p
                key={`t_${current.id}`}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="font-serif text-3xl md:text-5xl text-[var(--color-text)] leading-tight"
              >
                {current.title}
              </motion.p>
              {current.subtitle && (
                <motion.p
                  key={`s_${current.id}`}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.5 }}
                  className="mt-2 text-[var(--color-text)]/85 text-sm md:text-base"
                >
                  {current.subtitle}
                </motion.p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next */}
      {n > 1 && (
        <>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <button
              type="button"
              onClick={goPrev}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center transition"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              type="button"
              onClick={goNext}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-[var(--color-border)] text-[var(--color-text)] flex items-center justify-center transition"
              aria-label="Berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* Counter badge (top-right) */}
      {n > 1 && (
        <div className="absolute top-3 right-3 text-[10px] uppercase tracking-widest text-[var(--color-text)] px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-[var(--color-border)]">
          {idx + 1} / {n}
        </div>
      )}

      {/* Progress dots */}
      {n > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {brochures.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx
                  ? "w-8 bg-white"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
