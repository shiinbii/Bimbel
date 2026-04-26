"use client";

import { motion } from "framer-motion";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { type CreditPackage, useCreditPackages } from "@/lib/credit-packages-store";
import type { PackageCategory } from "@/lib/types";
import { formatIDR, sleep } from "@/lib/utils";

const CATEGORY_LABEL: Record<PackageCategory, string> = {
  TRY_OUT: "Try Out",
  CBT: "CBT",
  MATERI: "Materi (Mindmap/Video)",
  LIVE_CLASS: "Live Class / Private",
  TOKEN: "Token / Poin",
};

const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABEL) as PackageCategory[];

export default function PackagesSection() {
  const { list, upsert, remove } = useCreditPackages();
  const [modal, setModal] = useState<CreditPackage | "new" | null>(null);

  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Paket Harga</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Kelola katalog paket — Try Out, CBT, Materi, Live Class, dan Token poin. Semua paket tampil di Beli Credit
            modal.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModal("new")}>
          Tambah Paket
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card flex flex-col p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <Badge tone="primary" className="text-[10px]">
                {CATEGORY_LABEL[p.category]}
              </Badge>
              {p.popular && (
                <Badge tone="gold" className="text-[10px]">
                  Populer
                </Badge>
              )}
            </div>
            <p className="mt-2 line-clamp-1 font-serif text-xl text-[var(--color-text)]">{p.name}</p>
            <p className="line-clamp-2 min-h-[2rem] text-xs text-[var(--color-text-soft)]">{p.description}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-serif text-2xl text-[var(--color-text)]">{formatIDR(p.price)}</p>
              {p.originalPrice && p.originalPrice > p.price && (
                <p className="text-xs text-[var(--color-text-soft)] line-through">{formatIDR(p.originalPrice)}</p>
              )}
            </div>
            <p className="mt-1 text-sm text-amber-300">
              {p.points} pts{p.bonus ? ` + ${p.bonus} bonus` : ""}
              {p.durationDays ? ` · ${p.durationDays} hari` : ""}
            </p>
            {p.features && p.features.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-[var(--color-text-soft)]">
                {p.features.slice(0, 3).map((f, idx) => (
                  <li key={idx} className="line-clamp-1">
                    {f}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto flex gap-2 pt-3">
              <Button
                size="sm"
                variant="outline"
                full
                leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                onClick={() => setModal(p)}
              >
                Edit
              </Button>
              <button
                onClick={() => {
                  remove(p.id);
                  toast.success("Paket dihapus");
                }}
                className="flex h-9 w-10 items-center justify-center rounded-lg border border-red-500/40 text-red-300 transition hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <PackageEditModal
        value={modal}
        existingOrders={list.map((p) => p.order)}
        onClose={() => setModal(null)}
        onSave={async (p) => {
          await sleep(400);
          upsert(p);
          setModal(null);
          toast.success("Paket tersimpan");
        }}
      />
    </section>
  );
}

function PackageEditModal({
  value,
  existingOrders,
  onClose,
  onSave,
}: {
  value: CreditPackage | "new" | null;
  existingOrders: number[];
  onClose: () => void;
  onSave: (p: CreditPackage) => Promise<void>;
}) {
  const initial: CreditPackage =
    value === "new" || !value
      ? {
          id: `cp_${Date.now()}`,
          name: "",
          description: "",
          category: "TOKEN",
          points: 100,
          price: 50_000,
          bonus: 0,
          popular: false,
          order: (existingOrders.length ? Math.max(...existingOrders) : 0) + 1,
          features: [],
        }
      : value;

  const [draft, setDraft] = useState<CreditPackage>(initial);
  const [saving, setSaving] = useState(false);
  const [featuresText, setFeaturesText] = useState<string>((initial.features ?? []).join("\n"));

  useEffect(() => {
    setDraft(initial);
    setFeaturesText((initial.features ?? []).join("\n"));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof CreditPackage>(k: K, v: CreditPackage[K]) => setDraft((p) => ({ ...p, [k]: v }));

  return (
    <Modal open={!!value} onClose={onClose} title={value === "new" ? "Buat Paket Baru" : "Edit Paket"} size="md">
      <div className="space-y-4">
        <Input
          label="Nama paket"
          placeholder="cth. Paket Try Out Jawara"
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
        />

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-soft)]">Deskripsi singkat</label>
          <textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="1-2 kalimat menjelaskan apa yang didapat siswa"
            rows={2}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-soft)]">Kategori</label>
          <select
            value={draft.category}
            onChange={(e) => set("category", e.target.value as PackageCategory)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-indigo-500 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Harga (Rp)"
            type="number"
            value={draft.price}
            onChange={(e) => set("price", Number(e.target.value) || 0)}
          />
          <Input
            label="Harga coret (opsional)"
            type="number"
            placeholder="Untuk promo strikethrough"
            value={draft.originalPrice ?? ""}
            onChange={(e) => set("originalPrice", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Poin"
            type="number"
            value={draft.points}
            onChange={(e) => set("points", Number(e.target.value) || 0)}
          />
          <Input
            label="Bonus poin (opsional)"
            type="number"
            value={draft.bonus ?? 0}
            onChange={(e) => set("bonus", Number(e.target.value) || 0)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Durasi akses (hari, opsional)"
            type="number"
            placeholder="Kosongkan = tanpa batas"
            value={draft.durationDays ?? ""}
            onChange={(e) => set("durationDays", e.target.value ? Number(e.target.value) : undefined)}
          />
          <Input
            label="Urutan tampilan"
            type="number"
            value={draft.order}
            onChange={(e) => set("order", Number(e.target.value) || 1)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-soft)]">
            Fitur paket (1 baris = 1 fitur)
          </label>
          <textarea
            value={featuresText}
            onChange={(e) => {
              setFeaturesText(e.target.value);
              const feats = e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
              set("features", feats);
            }}
            rows={4}
            placeholder={"10x Try Out lengkap\nPembahasan video tiap soal\nRanking nasional realtime"}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-sm text-xs text-[var(--color-text)] focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text-soft)]">
          <input
            type="checkbox"
            checked={!!draft.popular}
            onChange={(e) => set("popular", e.target.checked)}
            className="accent-indigo-500"
          />
          Tandai sebagai &ldquo;Paling Populer&rdquo;
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={async () => {
              if (!draft.name.trim()) {
                toast.error("Nama paket wajib diisi");
                return;
              }
              if (draft.points <= 0) {
                toast.error("Poin harus lebih dari 0");
                return;
              }
              if (draft.price < 0) {
                toast.error("Harga tidak valid");
                return;
              }
              if (draft.originalPrice !== undefined && draft.originalPrice <= draft.price) {
                toast.error("Harga coret harus lebih besar dari harga jual");
                return;
              }
              setSaving(true);
              await onSave(draft);
              setSaving(false);
            }}
            loading={saving}
          >
            Simpan Paket
          </Button>
        </div>
      </div>
    </Modal>
  );
}
