"use client";

import { motion } from "framer-motion";
import { Clock, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { ZoomSession } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

export default function WaitingRoomInfo({
  session,
  participants,
}: {
  session: ZoomSession;
  participants: { name: string; isTeacher?: boolean }[];
}) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(session.scheduledAt).getTime() - Date.now();
      if (session.status === "LIVE") {
        setCountdown("Sudah LIVE");
        return;
      }
      if (session.status === "ENDED") {
        setCountdown("Sesi telah berakhir");
        return;
      }
      if (diff <= 0) {
        setCountdown("Segera dimulai...");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setCountdown(
        (days ? `${days}h ` : "") +
          `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [session.scheduledAt, session.status]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6 card relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          {session.status === "LIVE" ? (
            <Badge tone="live" dot>LIVE SEKARANG</Badge>
          ) : session.status === "ENDED" ? (
            <Badge tone="neutral">Selesai</Badge>
          ) : (
            <Badge tone="info">Terjadwal</Badge>
          )}
          <Badge tone="primary">{session.subject}</Badge>
        </div>
        <h2 className="font-serif text-3xl text-[var(--color-text)]">{session.title}</h2>
        <p className="mt-2 text-sm text-[var(--color-text-soft)]">{session.description}</p>

        <div className="mt-6 flex items-center gap-4 pt-5 border-t border-[var(--color-border-soft)]">
          <Avatar name={session.teacher} size={44} ring />
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">{session.teacher}</p>
            <p className="text-xs text-[var(--color-text-soft)]">Guru {session.subject}</p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 to-transparent"
      >
        <div className="flex items-center gap-2 text-indigo-200">
          <Clock className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Sesi dimulai dalam</span>
        </div>
        <p className="mt-2 font-serif text-5xl text-[var(--color-text)] tabular-nums">{countdown}</p>
        <p className="mt-1 text-xs text-[var(--color-text-soft)]">
          Durasi {session.duration} menit · maks {session.maxParticipants} peserta
        </p>
      </motion.div>

      <div className="rounded-2xl p-5 card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[var(--color-text)]">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">Peserta Online</span>
          </div>
          <span className="text-xs text-[var(--color-text-soft)]">
            {participants.length}/{session.maxParticipants}
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {participants.slice(0, 12).map((p) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[var(--color-bg-soft)] border border-[var(--color-border)]"
            >
              <Avatar name={p.name} size={22} />
              <span className="text-xs text-[var(--color-text)]">{p.name.split(" ")[0]}</span>
              {p.isTeacher && (
                <span className="text-[9px] uppercase tracking-widest px-1 py-0.5 rounded bg-indigo-500/30 text-indigo-200">
                  guru
                </span>
              )}
            </motion.div>
          ))}
          {participants.length > 12 && (
            <span className="px-2.5 py-1.5 rounded-full bg-[var(--color-bg-soft)] text-xs text-[var(--color-text-soft)]">
              +{participants.length - 12}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
