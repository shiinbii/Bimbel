"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

interface Props extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  full?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.6)] hover:shadow-[0_14px_40px_-10px_rgba(99,102,241,0.8)]",
  outline:
    "border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-soft)]",
  ghost:
    "text-[var(--color-text-soft)] hover:text-white hover:bg-[var(--color-bg-soft)]",
  danger:
    "bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_10px_30px_-10px_rgba(239,68,68,0.5)]",
  gold:
    "bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 text-[#1a1200] shadow-[0_10px_30px_-10px_rgba(245,158,11,0.7)]",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  leftIcon,
  rightIcon,
  disabled,
  full,
  className,
  ...rest
}: Props) {
  return (
    <motion.button
      whileHover={disabled || loading ? undefined : { scale: 1.02 }}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-tight transition-all outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        full && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="-ml-1 flex items-center">{leftIcon}</span>
      )}
      {children}
      {rightIcon && !loading && (
        <span className="-mr-1 flex items-center">{rightIcon}</span>
      )}
    </motion.button>
  );
}
