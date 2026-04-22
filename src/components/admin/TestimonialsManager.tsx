"use client";

import { motion } from "framer-motion";
import { Plus, RotateCcw, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import SubmitTestimonialModal from "@/components/testimonial/SubmitTestimonialModal";
import { useTestimonials } from "@/lib/testimonials-store";

export default function TestimonialsManager() {
  const { list, remove, reset } = useTestimonials();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const target = list.find((t) => t.id === confirmId);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif text-2xl text-[var(--color-text)]">Kelola Testimoni</h3>
          <p className="text-sm text-[var(--color-text-soft)] mt-1">
            Total {list.length} testimoni. Admin & Super Admin bisa menghapus
            testimoni yang melanggar pedoman.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              toast.success("Testimoni dikembalikan ke default");
            }}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tambah Testimoni
          </Button>
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-3">
        {list.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={t.name} src={t.avatar} size={40} ring />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                    {t.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-soft)] truncate">
                    {t.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setConfirmId(t.id)}
                  className="w-8 h-8 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 transition flex items-center justify-center"
                  title="Hapus testimoni"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.round(t.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-[var(--color-text)]/15"
                  }`}
                />
              ))}
              <span className="ml-1 text-xs text-[var(--color-text)]">{t.rating}</span>
              {t.id.startsWith("ts_") && (
                <Badge tone="success" className="ml-2 text-[9px]">
                  Baru
                </Badge>
              )}
            </div>

            <p className="mt-3 text-sm text-[var(--color-text)] leading-relaxed line-clamp-4">
              &ldquo;{t.message}&rdquo;
            </p>
          </motion.div>
        ))}
      </div>

      {list.length === 0 && (
        <div className="mt-8 text-center text-[var(--color-text-soft)]">
          Belum ada testimoni. Tambahkan satu untuk mulai.
        </div>
      )}

      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Hapus Testimoni?"
        description={
          target
            ? `Testimoni dari "${target.name}" akan dihapus permanen dari landing page.`
            : undefined
        }
        size="sm"
      >
        <div className="flex items-center gap-2 pt-2">
          <Button full variant="ghost" onClick={() => setConfirmId(null)}>
            Batal
          </Button>
          <Button
            full
            variant="danger"
            onClick={() => {
              if (confirmId) {
                remove(confirmId);
                toast.success("Testimoni dihapus");
              }
              setConfirmId(null);
            }}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Hapus
          </Button>
        </div>
      </Modal>

      <SubmitTestimonialModal open={addOpen} onClose={() => setAddOpen(false)} />
    </Card>
  );
}
