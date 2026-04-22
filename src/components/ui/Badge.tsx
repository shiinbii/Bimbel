import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "primary"
  | "gold"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "live";

interface Props {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}

const toneClass: Record<Tone, string> = {
  primary: "bg-indigo-500/12 text-indigo-300 border-indigo-500/30",
  gold: "bg-amber-500/12 text-amber-300 border-amber-500/30",
  success: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30",
  danger: "bg-red-500/12 text-red-300 border-red-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  info: "bg-sky-500/12 text-sky-300 border-sky-500/30",
  neutral: "bg-[var(--color-bg-soft)] text-slate-300 border-[var(--color-border)]",
  live: "bg-red-500/20 text-red-200 border-red-500/50 live-pulse",
};

export default function Badge({ children, tone = "neutral", className, dot }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest border",
        toneClass[tone],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "inline-block w-1.5 h-1.5 rounded-full",
            tone === "live" ? "bg-red-400" : "bg-current"
          )}
        />
      )}
      {children}
    </span>
  );
}
