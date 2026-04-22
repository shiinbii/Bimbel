"use client";

import { motion } from "framer-motion";
import { Crown, Edit3, Plus, RotateCcw, Save, Trash2, Video } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Toggle from "@/components/ui/Toggle";
import {
  useTierConfigs,
  type TierBadgeTone,
  type TierConfig,
} from "@/lib/tier-config-store";
import { sleep } from "@/lib/utils";

function emptyTier(): TierConfig {
  return {
    id: `tier_${Date.now()}`,
    name: "Tier Baru",
    minPoints: 0,
    maxQuizzes: 10,
    canAccessZoom: false,
    canRequestPrivateZoom: false,
    description: "Deskripsi tier",
    highlights: [],
    badgeTone: "neutral",
  };
}

const TONE_OPTIONS: TierBadgeTone[] = ["neutral", "info", "primary", "gold"];

export default function TiersManager() {
  const { list, upsert, remove, reset } = useTierConfigs();
  const [editing, setEditing] = useState<TierConfig | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h3 className="font-serif text-2xl text-[var(--color-text)]">Tier Siswa</h3>
          <p className="text-sm text-[var(--color-text-soft)] mt-1">
            Atur nama, threshold poin, dan fitur tiap tier. Siswa otomatis naik
            tier saat saldo poin mencapai minimum. Boleh tambah / hapus tier
            sesuai kebutuhan.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              toast.success("Tier dikembalikan ke default");
            }}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Default
          </Button>
          <Button
            onClick={() => setEditing(emptyTier())}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tambah Tier
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {list.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge tone={t.badgeTone}>{t.name}</Badge>
              {t.canRequestPrivateZoom && (
                <Crown className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
            <p className="font-mono text-[10px] text-[var(--color-text-mute)]">
              {t.id}
            </p>
            <p className="mt-2 font-serif text-2xl text-[var(--color-text)]">
              {t.minPoints === 0 ? "Gratis" : `${t.minPoints}+`}
              {t.minPoints > 0 && (
                <span className="text-xs text-[var(--color-text-soft)] font-sans ml-1">
                  pts
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-soft)] line-clamp-2 min-h-[2.2rem]">
              {t.description}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-text-soft)]">
              <span>{t.maxQuizzes === -1 ? "∞" : t.maxQuizzes} quiz</span>
              {t.canAccessZoom && (
                <span className="flex items-center gap-1 text-indigo-300">
                  <Video className="w-3 h-3" /> Zoom
                </span>
              )}
              {t.canRequestPrivateZoom && (
                <span className="flex items-center gap-1 text-amber-300">
                  <Crown className="w-3 h-3" /> 1-on-1
                </span>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                full
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => setEditing({ ...t })}
              >
                Edit
              </Button>
              <button
                onClick={() => setConfirmDelete(t.id)}
                disabled={list.length <= 1}
                className="w-10 h-9 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <TierEditModal
        value={editing}
        onClose={() => setEditing(null)}
        onSave={async (t) => {
          await sleep(500);
          upsert(t);
          setEditing(null);
          toast.success(`Tier ${t.name} disimpan`);
        }}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Hapus Tier?"
        description={
          list.length <= 1
            ? "Tidak bisa menghapus tier terakhir."
            : "Tier akan dihapus. User dengan tier ini akan pindah ke tier sesuai threshold poinnya."
        }
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
            disabled={list.length <= 1}
            onClick={() => {
              if (confirmDelete) remove(confirmDelete);
              setConfirmDelete(null);
              toast.success("Tier dihapus");
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

function TierEditModal({
  value,
  onClose,
  onSave,
}: {
  value: TierConfig | null;
  onClose: () => void;
  onSave: (t: TierConfig) => Promise<void>;
}) {
  const [draft, setDraft] = useState<TierConfig | null>(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (value) setDraft(value);
  }, [value]);

  if (!draft) {
    return (
      <Modal open={false} onClose={onClose}>
        <div />
      </Modal>
    );
  }

  const set = <K extends keyof TierConfig>(k: K, v: TierConfig[K]) =>
    setDraft((p) => (p ? { ...p, [k]: v } : p));

  const addHighlight = () =>
    set("highlights", [...draft.highlights, "Fitur baru"]);
  const removeHighlight = (i: number) =>
    set(
      "highlights",
      draft.highlights.filter((_, idx) => idx !== i)
    );
  const updateHighlight = (i: number, v: string) =>
    set(
      "highlights",
      draft.highlights.map((h, idx) => (idx === i ? v : h))
    );

  return (
    <Modal
      open={!!value}
      onClose={onClose}
      title={value?.name ? `Edit — ${value.name}` : "Tambah Tier"}
      description="Ubah nama, threshold poin, fitur, dan deskripsi tier."
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <Input
            label="Nama Tier"
            value={draft.name}
            placeholder="Student A / Bronze / Gold"
            onChange={(e) => set("name", e.target.value)}
          />
          <Input
            label="Min. Poin"
            type="number"
            min={0}
            value={draft.minPoints}
            onChange={(e) =>
              set("minPoints", Math.max(0, Number(e.target.value) || 0))
            }
            hint="Threshold poin untuk masuk tier ini"
          />
          <Input
            label="Maks. Quiz (−1 = ∞)"
            type="number"
            value={draft.maxQuizzes}
            onChange={(e) => set("maxQuizzes", Number(e.target.value) || 0)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
            Warna Badge
          </label>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {TONE_OPTIONS.map((tone) => {
              const sel = draft.badgeTone === tone;
              return (
                <button
                  key={tone}
                  type="button"
                  onClick={() => set("badgeTone", tone)}
                  className={`p-2 rounded-lg border text-xs transition ${
                    sel
                      ? "border-indigo-500/60 bg-indigo-500/10 ring-2 ring-indigo-500/25"
                      : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/40"
                  }`}
                >
                  <Badge tone={tone}>{tone}</Badge>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
            Deskripsi
          </label>
          <textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            placeholder="Akses dasar — soal & pre-test"
            className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-2 gap-3">
          <ToggleCard
            label="Akses Sesi Zoom Grup"
            desc="Bisa join kelas zoom live"
            active={draft.canAccessZoom}
            onChange={(v) => set("canAccessZoom", v)}
          />
          <ToggleCard
            label="Sesi Privat 1-on-1"
            desc="Bisa request zoom privat dengan guru pilihan"
            active={draft.canRequestPrivateZoom}
            onChange={(v) => set("canRequestPrivateZoom", v)}
          />
        </div>

        {/* Highlights */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
              Highlights ({draft.highlights.length})
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={addHighlight}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Tambah
            </Button>
          </div>
          <div className="space-y-2">
            {draft.highlights.map((h, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={h}
                  onChange={(e) => updateHighlight(i, e.target.value)}
                  className="flex-1"
                />
                <button
                  onClick={() => removeHighlight(i)}
                  className="w-10 h-12 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 flex items-center justify-center transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {draft.highlights.length === 0 && (
              <p className="text-xs text-[var(--color-text-soft)] text-center py-3 border border-dashed border-[var(--color-border-soft)] rounded-xl">
                Belum ada highlight.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-soft)]">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={async () => {
              if (!draft.name.trim()) {
                toast.error("Nama tier wajib diisi");
                return;
              }
              setSaving(true);
              await onSave(draft);
              setSaving(false);
            }}
            loading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Simpan Tier
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ToggleCard({
  label,
  desc,
  active,
  onChange,
}: {
  label: string;
  desc: string;
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!active)}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
        active
          ? "border-indigo-500/50 bg-indigo-500/10"
          : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/30"
      }`}
    >
      <Toggle checked={active} onChange={onChange} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--color-text)]">{label}</p>
        <p className="text-xs text-[var(--color-text-soft)]">{desc}</p>
      </div>
    </div>
  );
}
