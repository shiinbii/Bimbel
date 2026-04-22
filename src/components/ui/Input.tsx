"use client";

import { Eye, EyeOff } from "lucide-react";
import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, icon, rightSlot, hint, className, id, type, ...rest },
  ref
) {
  const inputId = id || rest.name;
  const isPassword = type === "password";
  const [reveal, setReveal] = useState(false);
  const effectiveType = isPassword ? (reveal ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          "relative flex items-center rounded-xl border transition-colors",
          "bg-[var(--color-bg-soft)] border-[var(--color-border)]",
          "focus-within:border-[var(--color-primary)] focus-within:bg-[var(--color-bg-soft)]",
          "focus-within:ring-4 focus-within:ring-[var(--color-primary)]/15",
          error &&
            "border-red-500/60 focus-within:border-red-500 focus-within:ring-red-500/15"
        )}
      >
        {icon && (
          <span className="pl-3.5 text-[var(--color-text-soft)]">{icon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          className={cn(
            "flex-1 bg-transparent py-3 px-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-mute)] outline-none",
            icon && "pl-2.5",
            (rightSlot || isPassword) && "pr-2.5",
            className
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            tabIndex={-1}
            className="pr-3.5 text-[var(--color-text-soft)] hover:text-[var(--color-text)] transition"
            title={reveal ? "Sembunyikan" : "Tampilkan"}
            aria-label={reveal ? "Sembunyikan password" : "Tampilkan password"}
          >
            {reveal ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
        {rightSlot && !isPassword && (
          <span className="pr-3.5">{rightSlot}</span>
        )}
      </div>
      {hint && !error && (
        <p className="text-xs text-[var(--color-text-mute)]">{hint}</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});

export default Input;
