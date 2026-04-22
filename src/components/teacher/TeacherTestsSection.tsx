"use client";

import { motion } from "framer-motion";
import { Eye, Info, Lock } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { mockTests } from "@/lib/mock-data";

export default function TeacherTestsSection() {
  return (
    <section>
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Bank Soal</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Daftar soal yang tersedia untuk mata pelajaran kamu.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
          <Lock className="w-3.5 h-3.5" />
          Hanya admin yang dapat membuat/import soal
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-3 text-xs text-[var(--color-text-soft)] flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-indigo-300 mt-0.5 shrink-0" />
        <span>
          Bank soal dikelola pusat oleh admin untuk menjaga kualitas & konsistensi.
          Jika kamu butuh soal baru, hubungi admin untuk import/penambahan.
        </span>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-[var(--color-text-soft)] border-b border-[var(--color-border-soft)]">
              <tr>
                <th className="px-5 py-4">Judul</th>
                <th className="px-5 py-4">Mapel</th>
                <th className="px-5 py-4">Tipe</th>
                <th className="px-5 py-4">Durasi</th>
                <th className="px-5 py-4">Biaya</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {mockTests.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-soft)] transition"
                >
                  <td className="px-5 py-4">
                    <p className="text-[var(--color-text)] font-medium">{t.title}</p>
                    <p className="text-xs text-[var(--color-text-soft)]">
                      {t.totalQuestions} soal
                    </p>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text-soft)]">{t.subject}</td>
                  <td className="px-5 py-4">
                    <Badge
                      tone={
                        t.type === "EXAM"
                          ? "primary"
                          : t.type === "VIDEO_QUIZ"
                          ? "gold"
                          : "info"
                      }
                    >
                      {t.type.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text-soft)]">
                    {t.duration} mnt
                  </td>
                  <td className="px-5 py-4 text-amber-300 font-semibold">
                    {t.cost === 0 ? "Gratis" : `${t.cost} pts`}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="w-8 h-8 rounded-lg bg-[var(--color-bg-soft)] hover:bg-[var(--color-bg-soft)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-soft)] hover:text-[var(--color-text)] transition">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
