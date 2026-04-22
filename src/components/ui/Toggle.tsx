"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";
type Color = "indigo" | "emerald" | "gold" | "danger";

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  size?: Size;
  color?: Color;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

const SIZE_MAP: Record<
  Size,
  { container: string; knob: string; xOff: number; xOn: number }
> = {
  // container w-9 (36px), knob w-4 (16px), pad 2 → xOn = 36-16-2 = 18
  sm: { container: "w-9 h-5", knob: "w-4 h-4", xOff: 2, xOn: 18 },
  // container w-11 (44px), knob w-5 (20px), pad 2 → xOn = 44-20-2 = 22
  md: { container: "w-11 h-6", knob: "w-5 h-5", xOff: 2, xOn: 22 },
  // container w-14 (56px), knob w-7 (28px), pad 2 → xOn = 56-28-2 = 26
  lg: { container: "w-14 h-8", knob: "w-7 h-7", xOff: 2, xOn: 26 },
};

const ON_COLOR: Record<Color, string> = {
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  gold: "bg-amber-500",
  danger: "bg-red-500",
};

export default function Toggle({
  checked,
  onChange,
  size = "md",
  color = "indigo",
  disabled,
  className,
  ariaLabel,
}: Props) {
  const dims = SIZE_MAP[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      disabled={disabled}
      className={cn(
        "relative rounded-full transition-colors shrink-0 outline-none",
        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] focus-visible:ring-[var(--color-primary)]",
        dims.container,
        checked ? ON_COLOR[color] : "bg-[var(--color-bg-soft)] border border-[var(--color-border)]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <motion.span
        aria-hidden
        animate={{ x: checked ? dims.xOn : dims.xOff }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 left-0 rounded-full bg-white shadow-md",
          dims.knob
        )}
      />
    </button>
  );
}
