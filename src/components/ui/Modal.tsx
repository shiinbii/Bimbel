"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  align?: "left" | "center";
  icon?: ReactNode;
}

const sizeClass = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  align = "left",
  icon,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const centered = align === "center";

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-[#04050f]/80 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className={`relative z-10 w-full ${sizeClass[size]} rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden`}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {(title || description || icon) && (
              <div
                className={
                  centered
                    ? "p-6 pb-2 flex flex-col items-center text-center"
                    : "p-6 pb-2 pr-14"
                }
              >
                {icon && centered && (
                  <div className="mb-3 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-indigo-700/10 border border-indigo-500/30 flex items-center justify-center text-indigo-200">
                    {icon}
                  </div>
                )}
                {title && (
                  <h3 className="text-2xl font-serif text-[var(--color-text)]">{title}</h3>
                )}
                {description && (
                  <p
                    className={`text-sm text-[var(--color-text-soft)] mt-1 ${
                      centered ? "max-w-sm" : ""
                    }`}
                  >
                    {description}
                  </p>
                )}
              </div>
            )}
            <div className={`p-6 pt-4 overflow-y-auto flex-1 ${centered ? "text-center" : ""}`}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
