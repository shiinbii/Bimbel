"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  onComplete?: (v: string) => void;
  mask?: boolean;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  disabled,
  onComplete,
  mask = true,
}: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [focused, setFocused] = useState<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === length && !firedRef.current) {
      firedRef.current = true;
      onComplete?.(digits);
    }
    if (digits.length < length) {
      firedRef.current = false;
    }
  }, [value, length, onComplete]);

  const set = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 1);
    const arr = (value + "").padEnd(length, " ").split("");
    arr[i] = digits || " ";
    const next = arr.join("").trimEnd();
    onChange(next);
    if (digits && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!value[i] && i > 0) refs.current[i - 1]?.focus();
      else set(i, "");
    } else if (e.key === "Delete") {
      // Clear current cell and shift subsequent digits left (delete-forward feel)
      const digits = value.split("");
      digits[i] = "";
      const shifted = digits.join("").replace(/^\s+|\s+$/g, "");
      onChange(shifted);
      // keep focus at i (now showing what used to be i+1)
      refs.current[i]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < length - 1)
      refs.current[i + 1]?.focus();
  };

  // Paste handler usable from any cell: takes entire clipboard, keeps digits,
  // fills boxes, focuses last filled position (or next).
  const handlePaste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!t) return;
    e.preventDefault();
    onChange(t);
    const focusIdx = Math.min(t.length, length - 1);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-2 justify-between">
      {Array.from({ length }).map((_, i) => {
        const raw = value[i] ?? "";
        const isActive = focused === i;
        return (
          <motion.div
            key={i}
            animate={{ scale: isActive || raw ? 1.03 : 1 }}
            className={cn(
              "relative flex-1 max-w-[54px] aspect-square rounded-xl border overflow-hidden",
              "bg-[var(--color-bg-soft)]",
              raw
                ? "border-indigo-500/60 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
                : isActive
                ? "border-indigo-500/40"
                : "border-[var(--color-border)]"
            )}
          >
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={raw}
              onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => handleKey(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => {
                setFocused(i);
                // Select the cell's content so paste replaces cleanly
                e.currentTarget.select();
              }}
              onBlur={() => setFocused(null)}
              onClick={(e) => e.currentTarget.select()}
              disabled={disabled}
              className={cn(
                "absolute inset-0 w-full h-full bg-transparent text-center outline-none",
                mask ? "text-transparent caret-indigo-400" : "text-[var(--color-text)] font-serif text-2xl"
              )}
              style={{
                textShadow: mask ? "none" : undefined,
                WebkitTextFillColor: mask ? "transparent" : undefined,
              }}
            />
            {mask && raw && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-3xl text-[var(--color-text)] leading-none">
                •
              </span>
            )}
            {isActive && !raw && (
              <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-indigo-400 animate-pulse" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
