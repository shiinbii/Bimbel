"use client";

import { motion } from "framer-motion";
import { Edit3, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";
import AvatarUpload from "@/components/ui/AvatarUpload";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import RadarChart from "@/components/ui/RadarChart";
import {
  overallScore, statLabels, useTeacherProfiles,
  type TeacherProfile, type TeacherStats,
} from "@/lib/teachers-store";
import { sleep } from "@/lib/utils";

const emptyStats: TeacherStats = {
  penjelasan: 8,
  interaktif: 8,
  penguasaan: 8,
  ketepatan: 8,
  motivasi: 8,
  kesabaran: 8,
};

function newTeacher(): TeacherProfile {
  return {
    id: `t_${Date.now()}`,
    name: "",
    email: "",
    subject: "",
    rating: 4.8,
    students: 0,
    sessions: 0,
    status: "ACTIVE",
    description: "",
    stats: { ...emptyStats },
  };
}

export default function TeachersManager() {
  const { list, upsert, remove } = useTeacherProfiles();
  const [editing, setEditing] = useState<TeacherProfile | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif text-2xl text-[var(--color-text)]">Profil Guru</h3>
          <p className="text-sm text-[var(--color-text-soft)] mt-1">
            Tambah profil guru lengkap dengan foto, deskripsi, dan{" "}
            <span className="text-amber-300">chart stat FIFA-style</span> untuk
            ditampilkan di landing.
          </p>
        </div>
        <Button
          onClick={() => setEditing(newTeacher())}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Tambah Guru
        </Button>
      </div>

      <div className="mt-5 grid md:grid-cols-2 gap-3">
        {list.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4"
          >
            <div className="flex items-start gap-3">
              <Avatar name={t.name} src={t.photo} size={48} ring />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-semibold text-[var(--color-text)] truncate">{t.name}</p>
                  <span className="font-serif text-xl text-gradient-gold">
                    {overallScore(t.stats)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs">
                  <span className="text-[var(--color-text-soft)]">
                    {t.subject}
                  </span>
                  <Badge tone={t.status === "ACTIVE" ? "success" : "neutral"}>
                    {t.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-soft)] line-clamp-2">
                  {t.description}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={() => setEditing({ ...t })}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmId(t.id)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <TeacherEditModal
        value={editing}
        onClose={() => setEditing(null)}
        onSave={async (t) => {
          await sleep(800);
          upsert(t);
          setEditing(null);
          toast.success("Profil guru disimpan");
        }}
      />

      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Hapus Guru?"
        description="Profil guru akan dihapus dari landing dan direktori internal."
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
              if (confirmId) remove(confirmId);
              setConfirmId(null);
              toast.success("Profil guru dihapus");
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

function TeacherEditModal({
  value,
  onClose,
  onSave,
}: {
  value: TeacherProfile | null;
  onClose: () => void;
  onSave: (t: TeacherProfile) => Promise<void>;
}) {
  const [draft, setDraft] = useState<TeacherProfile | null>(value);
  const [saving, setSaving] = useState(false);

  // Sync when modal opens with different value
  if (value && (!draft || draft.id !== value.id)) {
    setDraft(value);
  }
  if (!value && draft) {
    setDraft(null);
  }

  if (!draft) {
    return (
      <Modal open={false} onClose={onClose}>
        <div />
      </Modal>
    );
  }

  const set = <K extends keyof TeacherProfile>(k: K, v: TeacherProfile[K]) =>
    setDraft((p) => (p ? { ...p, [k]: v } : p));

  const setStat = (k: keyof TeacherStats, v: number) =>
    setDraft((p) =>
      p
        ? {
            ...p,
            stats: {
              ...p.stats,
              [k]: Math.max(0, Math.min(10, Math.round(v * 10) / 10)),
            },
          }
        : p
    );

  const STAT_KEYS: (keyof TeacherStats)[] = [
    "penjelasan",
    "interaktif",
    "penguasaan",
    "ketepatan",
    "motivasi",
    "kesabaran",
  ];
  const chartStats = STAT_KEYS.map((k) => ({
    key: k,
    label: statLabels[k],
    value: draft.stats[k] ?? 0,
  }));

  return (
    <Modal
      open={!!value}
      onClose={onClose}
      title={value?.name ? `Edit — ${value.name}` : "Tambah Guru Baru"}
      description="Stat 0-10 (FIFA-style). Overall dihitung otomatis."
      size="xl"
    >
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
        {/* LEFT: form fields */}
        <div className="space-y-3">
          <AvatarUpload
            value={draft.photo}
            onChange={(v) => set("photo", v)}
            name={draft.name || "Guru"}
            label="Foto Guru"
            description="Foto ditampilkan di landing page. Maks 2MB."
            size={72}
          />
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Input
              label="Nama"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
            />
            <Input
              label="Mata Pelajaran"
              value={draft.subject}
              onChange={(e) => set("subject", e.target.value)}
            />
            <Input
              label="Email"
              value={draft.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <div>
              <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
                Status
              </label>
              <select
                value={draft.status}
                onChange={(e) =>
                  set("status", e.target.value as TeacherProfile["status"])
                }
                className="mt-1.5 w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-indigo-500"
              >
                <option className="bg-[var(--color-bg)]">ACTIVE</option>
                <option className="bg-[var(--color-bg)]">INACTIVE</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <Input
              label="Rating"
              type="number"
              step={0.1}
              min={0}
              max={5}
              value={draft.rating}
              onChange={(e) => set("rating", Number(e.target.value) || 0)}
            />
            <Input
              label="Siswa"
              type="number"
              value={draft.students}
              onChange={(e) => set("students", Number(e.target.value) || 0)}
            />
            <Input
              label="Sesi"
              type="number"
              value={draft.sessions}
              onChange={(e) => set("sessions", Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
              Deskripsi Guru
            </label>
            <textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Latar belakang, spesialisasi, dan gaya mengajar..."
              className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-mute)] outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>
        </div>

        {/* RIGHT: stats + preview */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-transparent p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] uppercase tracking-widest text-indigo-200">
                Preview Chart (FIFA)
              </p>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)]">
                  Overall
                </p>
                <p className="font-serif text-3xl leading-none text-gradient-gold">
                  {overallScore(draft.stats).toFixed(1)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <RadarChart stats={chartStats} size={200} />
            </div>
          </div>

          <div className="space-y-1.5">
            {STAT_KEYS.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-28 text-[10px] uppercase tracking-widest text-[var(--color-text-soft)]">
                  {statLabels[k]}
                </span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.1}
                  value={draft.stats[k] ?? 0}
                  onChange={(e) => setStat(k, Number(e.target.value))}
                  className="flex-1 accent-indigo-500"
                />
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={draft.stats[k] ?? 0}
                  onChange={(e) => setStat(k, Number(e.target.value))}
                  className="no-spin w-14 h-8 rounded-md bg-[var(--color-bg-soft)] border border-[var(--color-border)] text-sm font-mono text-[var(--color-text)] text-center outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-[var(--color-border)] sticky bottom-0 bg-[var(--color-bg-elevated)]">
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button
          onClick={async () => {
            if (!draft.name.trim() || !draft.subject.trim()) {
              toast.error("Nama dan mata pelajaran wajib diisi");
              return;
            }
            setSaving(true);
            await onSave(draft);
            setSaving(false);
          }}
          loading={saving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Simpan Profil
        </Button>
      </div>
    </Modal>
  );
}
