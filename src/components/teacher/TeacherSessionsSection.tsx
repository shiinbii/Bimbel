"use client";

import { motion } from "framer-motion";
import { Lock, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useZoomSessions } from "@/lib/zoom-sessions-store";
import { formatDate } from "@/lib/utils";

export default function TeacherSessionsSection() {
  const { list } = useZoomSessions();

  return (
    <section>
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Jadwal Sesi Zoom</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Daftar sesi Zoom yang dikelola admin — guru menggunakan URL yang
            sudah disediakan.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
          <Lock className="w-3.5 h-3.5" />
          Hanya admin yang dapat menambah sesi Zoom
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {s.status === "LIVE" ? (
                  <Badge tone="live" dot>LIVE</Badge>
                ) : s.status === "ENDED" ? (
                  <Badge tone="neutral">Selesai</Badge>
                ) : (
                  <Badge tone="info">Terjadwal</Badge>
                )}
                <Badge tone="primary">{s.subject}</Badge>
              </div>
              <p className="font-serif text-lg text-[var(--color-text)]">{s.title}</p>
              <p className="text-xs text-[var(--color-text-soft)] mt-1">
                {formatDate(s.scheduledAt)} · {s.duration} menit
              </p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[var(--color-text-soft)]" />
                  <span className="text-xs text-[var(--color-text)]">
                    {s.currentParticipants}/{s.maxParticipants}
                  </span>
                </div>
                <span className="text-xs text-amber-300 font-semibold">
                  {s.cost} pts
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" full>
                  Detail
                </Button>
                <Button size="sm" full>
                  Mulai Sesi
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
