"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Calendar, Clock, Coins, Edit3, ExternalLink, GraduationCap,
  Link as LinkIcon, Plus, Save, Trash2, Users, Video,
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useZoomSessions } from "@/lib/zoom-sessions-store";
import { sleep } from "@/lib/utils";
import type { ZoomSession, ZoomStatus } from "@/lib/types";

function emptySession(): ZoomSession {
  const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  return {
    id: `z_${Date.now()}`,
    title: "",
    teacher: "",
    subject: "",
    scheduledAt: inTwoHours,
    duration: 60,
    cost: 100,
    maxParticipants: 80,
    currentParticipants: 0,
    status: "SCHEDULED",
    description: "",
    meetingUrl: "",
  };
}

export default function ZoomSessionsManager() {
  const { list, upsert, remove, reset } = useZoomSessions();
  const [editing, setEditing] = useState<ZoomSession | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif text-2xl text-[var(--color-text)]">Sesi Zoom</h3>
          <p className="text-sm text-[var(--color-text-soft)] mt-1">
            Admin menambahkan URL Zoom yang digunakan oleh guru & siswa. Popup
            konfirmasi akan muncul sebelum user dialihkan ke Zoom.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              toast.success("Sesi zoom dikembalikan ke default");
            }}
          >
            Reset
          </Button>
          <Button
            onClick={() => setEditing(emptySession())}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tambah Sesi Zoom
          </Button>
        </div>
      </div>

      <div className="mt-5 grid md:grid-cols-2 gap-3">
        {list.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              {s.status === "LIVE" ? (
                <Badge tone="live" dot>LIVE</Badge>
              ) : s.status === "ENDED" ? (
                <Badge tone="neutral">Selesai</Badge>
              ) : (
                <Badge tone="info">Terjadwal</Badge>
              )}
              <Badge tone="primary">{s.subject}</Badge>
            </div>
            <p className="font-serif text-lg text-[var(--color-text)] leading-tight">{s.title}</p>
            <p className="text-xs text-[var(--color-text-soft)] mt-1">
              {s.teacher} · {new Date(s.scheduledAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
            </p>

            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-black/20 px-2 py-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-[var(--color-text-soft)] shrink-0" />
              <p className="text-xs font-mono text-[var(--color-text)] truncate flex-1">
                {s.meetingUrl || "(belum ada URL)"}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-soft)]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> {s.duration} mnt
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3 h-3" /> {s.currentParticipants}/{s.maxParticipants}
              </span>
              <span className="text-amber-300 font-semibold">{s.cost} pts</span>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                full
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => setEditing({ ...s })}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(s.id)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="border-red-500/30 text-red-300 hover:bg-red-500/10"
              >
                Hapus
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <ZoomEditModal
        value={editing}
        onClose={() => setEditing(null)}
        onSave={async (s) => {
          await sleep(700);
          upsert(s);
          setEditing(null);
          toast.success("Sesi zoom disimpan");
        }}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Hapus Sesi Zoom?"
        description="Sesi dihapus permanen, tidak bisa dikembalikan."
        size="sm"
        align="center"
        icon={<Trash2 className="w-6 h-6" />}
      >
        <div className="flex items-center gap-2 pt-2">
          <Button full variant="ghost" onClick={() => setConfirmDelete(null)}>
            Batal
          </Button>
          <Button
            full
            variant="danger"
            onClick={() => {
              if (confirmDelete) remove(confirmDelete);
              setConfirmDelete(null);
              toast.success("Sesi zoom dihapus");
            }}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Hapus
          </Button>
        </div>
      </Modal>
    </Card>
  );
}

function ZoomEditModal({
  value,
  onClose,
  onSave,
}: {
  value: ZoomSession | null;
  onClose: () => void;
  onSave: (s: ZoomSession) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ZoomSession | null>(value);
  const [saving, setSaving] = useState(false);

  if (value && (!draft || draft.id !== value.id)) setDraft(value);
  if (!value && draft) setDraft(null);

  if (!draft) {
    return (
      <Modal open={false} onClose={onClose}>
        <div />
      </Modal>
    );
  }

  const set = <K extends keyof ZoomSession>(k: K, v: ZoomSession[K]) =>
    setDraft((p) => (p ? { ...p, [k]: v } : p));

  const localDatetime = draft.scheduledAt
    ? new Date(draft.scheduledAt).toISOString().slice(0, 16)
    : "";

  return (
    <Modal
      open={!!value}
      onClose={onClose}
      title={value?.title ? `Edit — ${value.title}` : "Tambah Sesi Zoom Baru"}
      description="Admin set link Zoom. Link dibuka via popup konfirmasi saat user klik 'Masuk Zoom'."
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Judul Sesi"
          placeholder="Pembahasan UTBK Matematika 2026"
          icon={<Video className="w-4 h-4" />}
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
        />

        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Nama Guru"
            placeholder="Ibu Anjani"
            icon={<GraduationCap className="w-4 h-4" />}
            value={draft.teacher}
            onChange={(e) => set("teacher", e.target.value)}
          />
          <Input
            label="Mata Pelajaran"
            placeholder="Matematika"
            value={draft.subject}
            onChange={(e) => set("subject", e.target.value)}
          />
        </div>

        <Input
          label="URL Zoom (dari Admin)"
          placeholder="https://zoom.us/j/XXXXXXXX?pwd=..."
          icon={<LinkIcon className="w-4 h-4" />}
          value={draft.meetingUrl}
          onChange={(e) => set("meetingUrl", e.target.value)}
          hint="Contoh: https://zoom.us/j/1234567890?pwd=abc · atau Google Meet / Teams"
        />

        {/* Jadwal on its own row — wider so value fits */}
        <Input
          label="Jadwal Mulai"
          type="datetime-local"
          icon={<Calendar className="w-4 h-4" />}
          value={localDatetime}
          onChange={(e) =>
            set(
              "scheduledAt",
              e.target.value ? new Date(e.target.value).toISOString() : draft.scheduledAt
            )
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Durasi (menit)"
            type="number"
            value={draft.duration}
            onChange={(e) => set("duration", Number(e.target.value) || 0)}
          />
          <Input
            label="Biaya (pts)"
            type="number"
            icon={<Coins className="w-4 h-4" />}
            value={draft.cost}
            onChange={(e) => set("cost", Number(e.target.value) || 0)}
          />
          <Input
            label="Max Peserta"
            type="number"
            value={draft.maxParticipants}
            onChange={(e) => set("maxParticipants", Number(e.target.value) || 0)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
            Status
          </label>
          <select
            value={draft.status}
            onChange={(e) => set("status", e.target.value as ZoomStatus)}
            className="mt-1.5 w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-indigo-500"
          >
            <option className="bg-[var(--color-bg)]">SCHEDULED</option>
            <option className="bg-[var(--color-bg)]">LIVE</option>
            <option className="bg-[var(--color-bg)]">ENDED</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
            Deskripsi
          </label>
          <textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="Deskripsi singkat sesi..."
            className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-mute)] outline-none focus:border-indigo-500 transition resize-y"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={async () => {
              if (!draft.title.trim() || !draft.teacher.trim() || !draft.meetingUrl.trim()) {
                toast.error("Judul, guru, dan URL Zoom wajib diisi");
                return;
              }
              setSaving(true);
              await onSave(draft);
              setSaving(false);
            }}
            loading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Simpan Sesi
          </Button>
        </div>
      </div>
    </Modal>
  );
}
