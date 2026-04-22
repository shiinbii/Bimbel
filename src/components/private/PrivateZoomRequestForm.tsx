"use client";

import { motion } from "framer-motion";
import { BookOpen, Calendar, Check, Crown, MessageCircle, Send, Star, Users } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useTeacherProfiles, type TeacherProfile } from "@/lib/teachers-store";
import { usePrivateZoom } from "@/lib/private-zoom-store";
import { pushNotification } from "@/lib/notifications-store";
import { sleep } from "@/lib/utils";

interface Props {
  studentEmail: string;
  studentName: string;
  onDone?: () => void;
}

export default function PrivateZoomRequestForm({
  studentEmail,
  studentName,
  onDone,
}: Props) {
  const { list: teachers } = useTeacherProfiles();
  const { create } = usePrivateZoom();
  const [selected, setSelected] = useState<TeacherProfile | null>(null);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [successOpen, setSuccessOpen] = useState(false);

  const subjects = Array.from(new Set(teachers.map((t) => t.subject)));
  const activeTeachers = teachers.filter((t) => t.status === "ACTIVE");
  const filtered =
    subjectFilter === "ALL"
      ? activeTeachers
      : activeTeachers.filter((t) => t.subject === subjectFilter);

  const submit = async () => {
    if (!selected) {
      toast.error("Pilih guru terlebih dahulu");
      return;
    }
    if (!topic.trim()) {
      toast.error("Isi topik sesi yang diinginkan");
      return;
    }
    setSubmitting(true);
    await sleep(1200);

    const req = create({
      studentEmail,
      studentName,
      teacherId: selected.id,
      teacherName: selected.name,
      subject: selected.subject,
      topic: topic.trim(),
      notes: notes.trim() || undefined,
    });

    // Notify the teacher in-web
    pushNotification({
      kind: "PRIVATE_ZOOM_REQUEST",
      targetEmail: selected.email,
      title: "Permintaan Sesi Privat Baru",
      body: `${studentName} memintamu mengajar: ${topic.slice(0, 80)}`,
      link: "/teacher/private-zoom",
    });

    // Simulate WA & Email notifications
    toast.success(
      `Notifikasi dikirim ke ${selected.name} via WhatsApp, Email, dan dashboard`,
      { icon: "📬", duration: 4000 }
    );

    setSubmitting(false);
    setSuccessOpen(true);
    setTopic("");
    setNotes("");
    setSelected(null);
    if (onDone) onDone();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
        <div className="flex items-center gap-2 text-amber-300 mb-2">
          <Crown className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest font-semibold">
            Fitur Premium
          </span>
        </div>
        <h3 className="font-serif text-2xl text-[var(--color-text)]">
          Request Sesi Zoom Privat 1-on-1
        </h3>
        <p className="mt-1 text-sm text-[var(--color-text-soft)]">
          Pilih guru, tentukan topik, guru akan menjadwalkan & konfirmasi via
          WhatsApp + Email + notifikasi dashboard.
        </p>
      </div>

      {/* Teacher picker */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <p className="font-serif text-lg text-[var(--color-text)]">1. Pilih Guru</p>
            <p className="text-xs text-[var(--color-text-soft)]">
              {activeTeachers.length} guru aktif tersedia
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-1">
            <button
              onClick={() => setSubjectFilter("ALL")}
              className={`text-xs px-3 h-8 rounded-lg transition ${
                subjectFilter === "ALL"
                  ? "bg-indigo-500/30 text-[var(--color-text)]"
                  : "text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
              }`}
            >
              Semua Mapel
            </button>
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSubjectFilter(s)}
                className={`text-xs px-3 h-8 rounded-lg transition whitespace-nowrap ${
                  subjectFilter === s
                    ? "bg-indigo-500/30 text-[var(--color-text)]"
                    : "text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((t) => {
            const isSelected = selected?.id === t.id;
            return (
              <motion.button
                key={t.id}
                type="button"
                whileHover={{ y: -2 }}
                onClick={() => setSelected(t)}
                className={`text-left p-4 rounded-xl border transition ${
                  isSelected
                    ? "border-indigo-500/60 bg-indigo-500/10 ring-2 ring-indigo-500/25"
                    : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/40"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={t.name} src={t.photo} size={44} ring />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                      {t.name}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)]">
                      {t.subject}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[var(--color-text)]" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-soft)]">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {t.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {t.students}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {t.sessions} sesi
                  </span>
                </div>
              </motion.button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-sm text-[var(--color-text-soft)] py-6 border border-dashed border-[var(--color-border)] rounded-xl">
              Tidak ada guru aktif untuk mata pelajaran ini.
            </div>
          )}
        </div>
      </Card>

      {/* Request details */}
      <Card className="p-5 space-y-3">
        <div>
          <p className="font-serif text-lg text-[var(--color-text)]">2. Detail Permintaan</p>
          <p className="text-xs text-[var(--color-text-soft)]">
            Guru akan melihat topik ini sebelum menjadwalkan sesi.
          </p>
        </div>
        <Input
          label="Topik / Materi yang ingin dipelajari"
          placeholder="Contoh: Pembahasan soal UTBK Matematika — fungsi komposisi"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          icon={<MessageCircle className="w-4 h-4" />}
        />
        <div>
          <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
            Catatan Tambahan (opsional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Preferensi waktu / level kesulitan / soal spesifik yang ingin dibahas..."
            className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-mute)] outline-none focus:border-indigo-500 transition resize-none"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--color-border-soft)] flex-wrap">
          <p className="text-xs text-[var(--color-text-soft)]">
            {selected ? (
              <>
                Akan dikirim ke:{" "}
                <strong className="text-[var(--color-text)]">{selected.name}</strong> (
                {selected.subject})
              </>
            ) : (
              "Pilih guru di atas terlebih dahulu"
            )}
          </p>
          <Button
            variant="gold"
            onClick={submit}
            loading={submitting}
            disabled={!selected || !topic.trim()}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Kirim Permintaan
          </Button>
        </div>
      </Card>

      {/* SUCCESS MODAL */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Permintaan Terkirim"
        description="Guru akan merespon dengan jadwal yang tersedia."
        size="md"
        align="center"
        icon={<Check className="w-6 h-6" />}
      >
        <div className="space-y-4 text-left">
          <StepCard
            step={1}
            title="Guru Menerima Notifikasi"
            desc="Notifikasi dikirim via dashboard, WhatsApp, dan email. Guru akan menentukan tanggal & waktu sesuai ketersediaannya."
          />
          <StepCard
            step={2}
            title="Kamu Terima Notifikasi Jadwal"
            desc="Konfirmasi kesediaan dari halaman Permintaan Saya. Jika tidak bisa, kamu dapat chat guru untuk re-schedule."
          />
          <Button full size="lg" onClick={() => setSuccessOpen(false)}>
            Mengerti
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function StepCard({
  step,
  title,
  desc,
}: {
  step: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-3">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-[var(--color-text)] flex items-center justify-center font-serif text-sm shrink-0">
        {step}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--color-text-soft)] leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}
