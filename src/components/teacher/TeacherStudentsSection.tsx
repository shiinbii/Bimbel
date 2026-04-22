"use client";

import { motion } from "framer-motion";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { mockStudents } from "@/lib/mock-data";

export default function TeacherStudentsSection() {
  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Siswa Saya</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Ringkasan performa seluruh siswa yang mengikuti kelasmu.
          </p>
        </div>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-[var(--color-text-soft)] border-b border-[var(--color-border-soft)]">
              <tr>
                <th className="px-5 py-4">Nama</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Quiz Selesai</th>
                <th className="px-5 py-4">Poin</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockStudents.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--color-border)]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size={32} />
                      <span className="text-[var(--color-text)]">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text-soft)]">{s.email}</td>
                  <td className="px-5 py-4 text-[var(--color-text)]">{s.completedTests}</td>
                  <td className="px-5 py-4 text-amber-300 font-semibold">
                    {s.points} pts
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={s.status === "ACTIVE" ? "success" : "neutral"}>
                      {s.status}
                    </Badge>
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
