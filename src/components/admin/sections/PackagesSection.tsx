"use client";

import { motion } from "framer-motion";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { formatIDR, sleep } from "@/lib/utils";
import {
  useCreditPackages,
  type CreditPackage,
} from "@/lib/credit-packages-store";

export default function PackagesSection() {
  const { list, upsert, remove } = useCreditPackages();
  const [modal, setModal] = useState<CreditPackage | "new" | null>(null);

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Paket Harga</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Kelola paket credit yang dijual ke siswa. Paket ini tampil di Beli
            Credit modal.
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setModal("new")}>
          Tambah Paket
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {list.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-4 flex flex-col"
          >
            {p.popular && (
              <Badge tone="gold" className="self-start mb-2">
                Populer
              </Badge>
            )}
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-soft)]">
              Urutan #{p.order}
            </p>
            <p className="mt-1 font-serif text-2xl text-[var(--color-text)]">{formatIDR(p.price)}</p>
            <p className="text-amber-300 text-sm mt-1">
              {p.points} pts{p.bonus ? ` + ${p.bonus} bonus` : ""}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                full
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                onClick={() => setModal(p)}
              >
                Edit
              </Button>
              <button
                onClick={() => {
                  remove(p.id);
                  toast.success("Paket dihapus");
                }}
                className="w-10 h-9 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 flex items-center justify-center transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
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
          points: 100,
          price: 50_000,
          bonus: 0,
          popular: false,
          order: (existingOrders.length ? Math.max(...existingOrders) : 0) + 1,
        }
      : value;

  const [draft, setDraft] = useState<CreditPackage>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(initial);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof CreditPackage>(k: K, v: CreditPackage[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  return (
    <Modal
      open={!!value}
      onClose={onClose}
      title={value === "new" ? "Buat Paket Credit Baru" : "Edit Paket Credit"}
      size="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Harga (Rp)"
            type="number"
            value={draft.price}
            onChange={(e) => set("price", Number(e.target.value) || 0)}
          />
          <Input
            label="Poin"
            type="number"
            value={draft.points}
            onChange={(e) => set("points", Number(e.target.value) || 0)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Bonus Poin (opsional)"
            type="number"
            value={draft.bonus ?? 0}
            onChange={(e) => set("bonus", Number(e.target.value) || 0)}
          />
          <Input
            label="Urutan tampilan"
            type="number"
            value={draft.order}
            onChange={(e) => set("order", Number(e.target.value) || 1)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-soft)] cursor-pointer">
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
              if (draft.points <= 0) {
                toast.error("Poin harus lebih dari 0");
                return;
              }
              if (draft.price < 0) {
                toast.error("Harga tidak valid");
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
