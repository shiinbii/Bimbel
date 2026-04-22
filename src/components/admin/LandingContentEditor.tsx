"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import {
  defaultLandingContent,
  LandingContent,
  LandingFeatureItem,
  LandingStatItem,
  useLandingContent,
} from "@/lib/landing-content";
import { sleep } from "@/lib/utils";

export default function LandingContentEditor() {
  const { content, replaceAll, reset, loaded } = useLandingContent();
  const [draft, setDraft] = useState<LandingContent>(content);
  const [saving, setSaving] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);

  // Track first content load sync
  useEffect(() => {
    if (loaded) setDraft(content);
  }, [loaded, content]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(content);

  const set = <K extends keyof LandingContent>(k: K, v: LandingContent[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  /* ---------- Stats ---------- */
  const addStat = () => {
    setDraft((p) => ({
      ...p,
      stats: [...p.stats, { label: "Statistik baru", value: 0, suffix: "" }],
    }));
    const newIndex = draft.stats.length;
    flash(`stat_${newIndex}`);
    toast.success(`Statistik #${newIndex + 1} ditambahkan`);
  };
  const setStat = (i: number, v: Partial<LandingStatItem>) =>
    setDraft((p) => ({
      ...p,
      stats: p.stats.map((s, idx) => (idx === i ? { ...s, ...v } : s)),
    }));
  const removeStat = (i: number) => {
    setDraft((p) => ({ ...p, stats: p.stats.filter((_, idx) => idx !== i) }));
    toast.success(`Statistik #${i + 1} dihapus`);
  };

  /* ---------- Features ---------- */
  const addFeature = () => {
    setDraft((p) => ({
      ...p,
      features: [
        ...p.features,
        { title: "Fitur baru", desc: "Deskripsi fitur" },
      ],
    }));
    const newIndex = draft.features.length;
    flash(`feat_${newIndex}`);
    toast.success(`Fitur #${newIndex + 1} ditambahkan`);
  };
  const setFeature = (i: number, v: Partial<LandingFeatureItem>) =>
    setDraft((p) => ({
      ...p,
      features: p.features.map((f, idx) => (idx === i ? { ...f, ...v } : f)),
    }));
  const removeFeature = (i: number) => {
    setDraft((p) => ({
      ...p,
      features: p.features.filter((_, idx) => idx !== i),
    }));
    toast.success(`Fitur #${i + 1} dihapus`);
  };

  /* ---------- Marquee ---------- */
  const addMarquee = () => {
    setDraft((p) => ({
      ...p,
      marqueeItems: [...p.marqueeItems, "Item baru"],
    }));
    const newIndex = draft.marqueeItems.length;
    flash(`marq_${newIndex}`);
    toast.success(`Item marquee #${newIndex + 1} ditambahkan`);
  };
  const setMarquee = (i: number, v: string) =>
    setDraft((p) => ({
      ...p,
      marqueeItems: p.marqueeItems.map((x, idx) => (idx === i ? v : x)),
    }));
  const removeMarquee = (i: number) => {
    setDraft((p) => ({
      ...p,
      marqueeItems: p.marqueeItems.filter((_, idx) => idx !== i),
    }));
    toast.success(`Item marquee #${i + 1} dihapus`);
  };

  /* ---------- Flash-highlight helper ---------- */
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (id: string) => {
    setFlashId(id);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 2200);
    // Scroll the newly added element into view on next tick
    setTimeout(() => {
      const el = document.getElementById(`le-${id}`);
      if (el)
        el.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
    }, 60);
  };

  const save = async () => {
    setSaving(true);
    await sleep(700);
    replaceAll(draft);
    setSaving(false);
    toast.success("Konten landing tersimpan");
  };

  const onReset = () => {
    reset();
    setDraft(defaultLandingContent);
    toast.success("Konten dikembalikan ke default");
  };

  return (
    <Card className="p-5 space-y-8">
      <div className="flex items-start justify-between gap-3 flex-wrap sticky top-[68px] bg-[var(--color-bg-elevated)]/85 backdrop-blur-md -mx-5 px-5 py-3 z-10 border-b border-[var(--color-border-soft)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-2xl text-[var(--color-text)]">
              Editor Konten Landing
            </h3>
            {dirty && (
              <Badge tone="warning" className="gap-1">
                <AlertCircle className="w-3 h-3" /> Belum Disimpan
              </Badge>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-soft)] mt-1">
            Ubah teks di landing. Klik <strong>Simpan</strong> agar perubahan
            muncul di halaman publik.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Default
          </Button>
          <Button
            onClick={save}
            loading={saving}
            disabled={!dirty}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {/* HERO */}
      <Section title="Hero" desc="Bagian teratas halaman utama.">
        <Input
          label="Hero Badge"
          value={draft.heroBadge}
          onChange={(e) => set("heroBadge", e.target.value)}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Judul Bagian 1 (normal)"
            value={draft.heroTitleLead}
            onChange={(e) => set("heroTitleLead", e.target.value)}
          />
          <Input
            label="Judul Bagian 2 (italic emas)"
            value={draft.heroTitleAccent1}
            onChange={(e) => set("heroTitleAccent1", e.target.value)}
          />
          <Input
            label="Judul Bagian 3 (normal)"
            value={draft.heroTitleConnector}
            onChange={(e) => set("heroTitleConnector", e.target.value)}
          />
          <Input
            label="Judul Bagian 4 (italic ungu)"
            value={draft.heroTitleAccent2}
            onChange={(e) => set("heroTitleAccent2", e.target.value)}
          />
        </div>
        <TextArea
          label="Deskripsi Hero"
          value={draft.heroDescription}
          onChange={(v) => set("heroDescription", v)}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Teks Tombol Primer"
            value={draft.heroPrimaryCta}
            onChange={(e) => set("heroPrimaryCta", e.target.value)}
          />
          <Input
            label="Teks Tombol Sekunder"
            value={draft.heroSecondaryCta}
            onChange={(e) => set("heroSecondaryCta", e.target.value)}
          />
        </div>
      </Section>

      {/* STATS */}
      <Section
        title={`Statistik (${draft.stats.length})`}
        desc="Angka yang tampil setelah hero."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={addStat}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Tambah Statistik
          </Button>
        }
      >
        <AnimatePresence initial={false}>
          {draft.stats.map((s, i) => {
            const id = `stat_${i}`;
            const isNew = flashId === id;
            return (
              <motion.div
                key={i}
                id={`le-${id}`}
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className={`rounded-xl border p-3 grid grid-cols-[auto_1fr_120px_110px_auto] gap-2 items-end transition ${
                  isNew
                    ? "border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                    : "border-[var(--color-border-soft)] bg-[var(--color-bg-soft)]"
                }`}
              >
                <span className="font-mono text-xs text-[var(--color-text-soft)] w-8 text-right pb-3.5">
                  #{i + 1}
                </span>
                <Input
                  label="Label"
                  value={s.label}
                  onChange={(e) => setStat(i, { label: e.target.value })}
                />
                <Input
                  label="Nilai"
                  type="number"
                  value={s.value}
                  onChange={(e) =>
                    setStat(i, { value: Number(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Suffix"
                  placeholder="+"
                  value={s.suffix ?? ""}
                  onChange={(e) => setStat(i, { suffix: e.target.value })}
                />
                <DeleteButton onClick={() => removeStat(i)} label="Hapus" />
              </motion.div>
            );
          })}
        </AnimatePresence>
        {draft.stats.length === 0 && <EmptyMsg />}
      </Section>

      {/* MARQUEE */}
      <Section
        title={`Banner Bergerak — Marquee (${draft.marqueeItems.length})`}
        desc="Teks yang bergulir di landing — misal daftar sekolah, mitra, atau pencapaian."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={addMarquee}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Tambah Item
          </Button>
        }
      >
        <Input
          label="Judul Banner"
          value={draft.marqueeTitle}
          onChange={(e) => set("marqueeTitle", e.target.value)}
        />
        <AnimatePresence initial={false}>
          {draft.marqueeItems.map((item, i) => {
            const id = `marq_${i}`;
            const isNew = flashId === id;
            return (
              <motion.div
                key={i}
                id={`le-${id}`}
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                  isNew
                    ? "border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                    : "border-transparent bg-transparent"
                }`}
              >
                <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)] w-8 text-right font-mono">
                  #{i + 1}
                </span>
                <Input
                  value={item}
                  placeholder="Misal: SMA Kanisius Jakarta"
                  onChange={(e) => setMarquee(i, e.target.value)}
                  className="flex-1"
                />
                <DeleteButton onClick={() => removeMarquee(i)} />
              </motion.div>
            );
          })}
        </AnimatePresence>
        {draft.marqueeItems.length === 0 && <EmptyMsg />}
      </Section>

      {/* FEATURES */}
      <Section
        title={`Fitur Unggulan (${draft.features.length})`}
        desc="Daftar fitur yang ditampilkan di section Fitur."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={addFeature}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Tambah Fitur
          </Button>
        }
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Badge"
            value={draft.featuresBadge}
            onChange={(e) => set("featuresBadge", e.target.value)}
          />
          <Input
            label="Judul (Lead)"
            value={draft.featuresTitleLead}
            onChange={(e) => set("featuresTitleLead", e.target.value)}
          />
          <Input
            label="Judul (Accent Emas)"
            value={draft.featuresTitleAccent}
            onChange={(e) => set("featuresTitleAccent", e.target.value)}
          />
        </div>
        <TextArea
          label="Subtitle"
          value={draft.featuresSubtitle}
          onChange={(v) => set("featuresSubtitle", v)}
        />

        <AnimatePresence initial={false}>
          {draft.features.map((f, i) => {
            const id = `feat_${i}`;
            const isNew = flashId === id;
            return (
              <motion.div
                key={i}
                id={`le-${id}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className={`rounded-xl border p-3 transition ${
                  isNew
                    ? "border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                    : "border-[var(--color-border-soft)] bg-[var(--color-bg-soft)]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge tone="primary">Fitur #{i + 1}</Badge>
                  <DeleteButton
                    onClick={() => removeFeature(i)}
                    label="Hapus Fitur"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    label="Judul Fitur"
                    value={f.title}
                    onChange={(e) => setFeature(i, { title: e.target.value })}
                  />
                  <TextArea
                    label="Deskripsi"
                    value={f.desc}
                    onChange={(v) => setFeature(i, { desc: v })}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {draft.features.length === 0 && <EmptyMsg />}
      </Section>

      {/* PRICING */}
      <Section title="Section Paket Harga" desc="Judul dan subtitle area paket.">
        <div className="grid sm:grid-cols-3 gap-3">
          <Input
            label="Badge"
            value={draft.pricingBadge}
            onChange={(e) => set("pricingBadge", e.target.value)}
          />
          <Input
            label="Judul (Lead)"
            value={draft.pricingTitleLead}
            onChange={(e) => set("pricingTitleLead", e.target.value)}
          />
          <Input
            label="Judul (Accent)"
            value={draft.pricingTitleAccent}
            onChange={(e) => set("pricingTitleAccent", e.target.value)}
          />
        </div>
        <TextArea
          label="Subtitle"
          value={draft.pricingSubtitle}
          onChange={(v) => set("pricingSubtitle", v)}
        />
      </Section>

      {/* TESTIMONIALS */}
      <Section title="Section Testimoni" desc="Copy untuk section testimoni.">
        <div className="grid sm:grid-cols-3 gap-3">
          <Input
            label="Badge"
            value={draft.testimonialsBadge}
            onChange={(e) => set("testimonialsBadge", e.target.value)}
          />
          <Input
            label="Judul (Lead)"
            value={draft.testimonialsTitleLead}
            onChange={(e) => set("testimonialsTitleLead", e.target.value)}
          />
          <Input
            label="Judul (Accent)"
            value={draft.testimonialsTitleAccent}
            onChange={(e) => set("testimonialsTitleAccent", e.target.value)}
          />
        </div>
      </Section>

      {/* CTA */}
      <Section
        title="CTA Bawah"
        desc="Block panggilan untuk registrasi di akhir halaman."
      >
        <Input
          label="Badge"
          value={draft.ctaBadge}
          onChange={(e) => set("ctaBadge", e.target.value)}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Judul (Lead)"
            value={draft.ctaTitleLead}
            onChange={(e) => set("ctaTitleLead", e.target.value)}
          />
          <Input
            label="Judul (Accent Emas)"
            value={draft.ctaTitleAccent}
            onChange={(e) => set("ctaTitleAccent", e.target.value)}
          />
        </div>
        <TextArea
          label="Deskripsi CTA"
          value={draft.ctaDescription}
          onChange={(v) => set("ctaDescription", v)}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Teks Tombol Primer"
            value={draft.ctaPrimaryButton}
            onChange={(e) => set("ctaPrimaryButton", e.target.value)}
          />
          <Input
            label="Teks Tombol Sekunder"
            value={draft.ctaSecondaryButton}
            onChange={(e) => set("ctaSecondaryButton", e.target.value)}
          />
        </div>
      </Section>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-soft)]">
        <Button
          variant="outline"
          onClick={onReset}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Reset Default
        </Button>
        <Button
          onClick={save}
          loading={saving}
          disabled={!dirty}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Simpan Perubahan
        </Button>
      </div>
    </Card>
  );
}

function Section({
  title,
  desc,
  action,
  children,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border-soft)]">
        <div>
          <p className="font-serif text-lg text-[var(--color-text)]">{title}</p>
          {desc && (
            <p className="text-xs text-[var(--color-text-soft)] mt-0.5">{desc}</p>
          )}
        </div>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-mute)] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition resize-y"
      />
    </div>
  );
}

function DeleteButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center gap-1.5 h-10 px-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 active:scale-95 transition shrink-0"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {label && <span className="text-xs font-medium">{label}</span>}
    </button>
  );
}

function EmptyMsg() {
  return (
    <p className="text-xs text-[var(--color-text-soft)] text-center py-3 border border-dashed border-[var(--color-border-soft)] rounded-xl">
      Belum ada item. Klik tombol &ldquo;Tambah&rdquo; di atas.
    </p>
  );
}
