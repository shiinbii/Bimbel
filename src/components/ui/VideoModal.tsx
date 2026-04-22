"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Youtube } from "lucide-react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  embedUrl: string | null;
  title?: string;
}

export default function VideoModal({ open, onClose, embedUrl, title }: Props) {
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative z-10 w-full max-w-4xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-soft)]">
              <div className="flex items-center gap-2 text-[var(--color-text)]">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-300 flex items-center justify-center">
                  <Youtube className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title ?? "Demo EduDoc"}</p>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)]">
                    YouTube · Demo
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)] transition"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-black">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={title ?? "Demo video"}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-center p-6">
                  <div>
                    <Youtube className="w-12 h-12 mx-auto text-red-400/60 mb-3" />
                    <p className="text-[var(--color-text)] font-serif text-lg">
                      URL video belum valid
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text-soft)]">
                      Minta admin untuk mengatur ulang tautan YouTube demo di
                      panel Pengaturan Sistem.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
