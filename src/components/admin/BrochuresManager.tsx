"use client";

import { motion } from "framer-motion";
import {
  Eye, GraduationCap, Image as ImageIcon, Link as LinkIcon, Plus, RotateCcw,
  Save, Trash2, Upload, X,
} from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import BrochureSlider from "@/components/ui/BrochureSlider";
import { useBrochures, type Brochure } from "@/lib/brochures-store";
import { sleep } from "@/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function emptyBrochure(): Omit<Brochure, "id" | "order"> {
  return {
    image: "",
    title: "",
    subtitle: "",
  };
}

interface PickerProps {
  value: string;
  onChange: (v: string) => void;
}

function ImagePicker({ value, onChange }: PickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlMode, setUrlMode] = useState(false);

  const readFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG/PNG/WebP)");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Ukuran gambar maks 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      if (url) {
        onChange(url);
        toast.success("Gambar siap");
      }
    };
    reader.onerror = () => toast.error("Gagal membaca file");
    reader.readAsDataURL(file);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) {
          readFile(f);
          e.preventDefault();
          return;
        }
      }
    }
  };

  const applyUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u) && !u.startsWith("data:image/")) {
      toast.error("URL harus diawali http:// atau https://");
      return;
    }
    onChange(u);
    setUrlInput("");
    setUrlMode(false);
    toast.success("URL gambar dipakai");
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) readFile(f);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />

      <div
        onClick={() => fileRef.current?.click()}
        onPaste={onPaste}
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer?.files?.[0];
          if (f) readFile(f);
        }}
        className={`relative rounded-2xl border-2 border-dashed transition cursor-pointer overflow-hidden outline-none focus-visible:border-indigo-500 ${
          dragOver
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/50"
        }`}
      >
        {value ? (
          <div className="relative aspect-[2/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview brosur"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                toast.success("Gambar dihapus");
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 hover:bg-red-500/70 text-[var(--color-text)] flex items-center justify-center transition"
              aria-label="Hapus gambar"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition flex items-center justify-center">
              <span className="text-[var(--color-text)] text-sm flex items-center gap-2 font-medium">
                <Upload className="w-4 h-4" /> Klik untuk ganti gambar
              </span>
            </div>
          </div>
        ) : (
          <div className="aspect-[2/1] flex flex-col items-center justify-center gap-3 text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center border border-indigo-500/25">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-medium text-[var(--color-text)]">
                Drop gambar di sini
              </p>
              <p className="text-sm text-[var(--color-text-soft)] mt-0.5">
                atau klik untuk pilih file · paste gambar juga bisa
              </p>
              <p className="text-xs text-[var(--color-text-mute)] mt-1">
                JPG / PNG / WebP · rasio 2:1 · maks 5 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* URL alternative */}
      <div className="mt-2">
        {!urlMode ? (
          <button
            type="button"
            onClick={() => setUrlMode(true)}
            className="text-xs text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3" /> atau tempel URL gambar
          </button>
        ) : (
          <div className="flex gap-2 items-end">
            <Input
              label="URL Gambar"
              placeholder="https://.../brosur.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              icon={<LinkIcon className="w-4 h-4" />}
            />
            <Button onClick={applyUrl} size="sm">
              Pakai URL
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setUrlMode(false)}>
              Batal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrochuresManager() {
  const { list, add, update, remove, move, reset } = useBrochures();
  const [editing, setEditing] = useState<Brochure | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<Brochure, "id" | "order">>(
    emptyBrochure()
  );
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const startAdd = () => {
    setDraft(emptyBrochure());
    setAdding(true);
  };

  const submitAdd = async () => {
    if (!draft.image) {
      toast.error("Upload gambar brosur dulu");
      return;
    }
    if (!draft.title.trim()) {
      toast.error("Judul brosur wajib diisi");
      return;
    }
    setSaving(true);
    await sleep(600);
    add(draft);
    setSaving(false);
    setAdding(false);
    setDraft(emptyBrochure());
    toast.success("Brosur ditambahkan");
  };

  const submitEdit = async () => {
    if (!editing) return;
    if (!editing.image || !editing.title.trim()) {
      toast.error("Gambar dan judul wajib diisi");
      return;
    }
    setSaving(true);
    await sleep(600);
    update(editing.id, {
      image: editing.image,
      title: editing.title,
      subtitle: editing.subtitle,
    });
    setSaving(false);
    setEditing(null);
    toast.success("Brosur diperbarui");
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif text-2xl text-[var(--color-text)]">
            Slider Alumni Berprestasi
          </h3>
          <p className="text-sm text-[var(--color-text-soft)] mt-1">
            Brosur/gambar slide menampilkan siswa yang lolos setelah bimbel di
            EduDoc. Tampil otomatis di landing dengan auto-play.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setPreview(true)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            Preview Slider
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              toast.success("Brosur dikembalikan ke default");
            }}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
          <Button onClick={startAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Import Brosur
          </Button>
        </div>
      </div>

      <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] overflow-hidden"
          >
            <div className="aspect-[2/1] bg-black/40 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image}
                alt={b.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 flex gap-1">
                <Badge tone="gold" className="gap-1">
                  <GraduationCap className="w-3 h-3" /> #{b.order}
                </Badge>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                {b.title}
              </p>
              {b.subtitle && (
                <p className="text-xs text-[var(--color-text-soft)] truncate mt-0.5">
                  {b.subtitle}
                </p>
              )}
              <div className="mt-3 flex items-center gap-1">
                <button
                  onClick={() => move(b.id, -1)}
                  disabled={i === 0}
                  className="w-7 h-7 rounded-md bg-[var(--color-bg-soft)] hover:bg-[var(--color-bg-soft)] text-[var(--color-text-soft)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center text-xs"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(b.id, 1)}
                  disabled={i === list.length - 1}
                  className="w-7 h-7 rounded-md bg-[var(--color-bg-soft)] hover:bg-[var(--color-bg-soft)] text-[var(--color-text-soft)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center text-xs"
                >
                  ↓
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  full
                  onClick={() => setEditing({ ...b })}
                >
                  Edit
                </Button>
                <button
                  onClick={() => {
                    remove(b.id);
                    toast.success("Brosur dihapus");
                  }}
                  className="w-8 h-8 rounded-md border border-red-500/30 text-red-300 hover:bg-red-500/10 transition flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {list.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-soft)] p-8 text-center text-sm text-[var(--color-text-soft)]">
            Belum ada brosur. Klik &ldquo;Import Brosur&rdquo; untuk menambah.
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Import Brosur Alumni"
        description="Upload gambar brosur beserta keterangan siswa. Drop file, paste, atau tempel URL."
        size="md"
      >
        <div className="space-y-4">
          <ImagePicker
            value={draft.image}
            onChange={(v) => setDraft((d) => ({ ...d, image: v }))}
          />
          <Input
            label="Judul (Nama Alumni / Prestasi)"
            placeholder="Naomi Ardelia — Lolos Kedokteran UI"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <Input
            label="Subtitle (opsional)"
            placeholder="SMA Kanisius 2024 · Skor UTBK 712"
            value={draft.subtitle ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, subtitle: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Batal
            </Button>
            <Button
              onClick={submitAdd}
              loading={saving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Simpan Brosur
            </Button>
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit — ${editing.title}` : "Edit Brosur"}
        size="md"
      >
        {editing && (
          <div className="space-y-4">
            <ImagePicker
              value={editing.image}
              onChange={(v) => setEditing({ ...editing, image: v })}
            />
            <Input
              label="Judul"
              value={editing.title}
              onChange={(e) =>
                setEditing({ ...editing, title: e.target.value })
              }
            />
            <Input
              label="Subtitle"
              value={editing.subtitle ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, subtitle: e.target.value })
              }
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Batal
              </Button>
              <Button
                onClick={submitEdit}
                loading={saving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Simpan Perubahan
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* PREVIEW MODAL */}
      <Modal
        open={preview}
        onClose={() => setPreview(false)}
        title="Preview Slider"
        description="Ini adalah tampilan yang akan dilihat pengunjung di landing."
        size="xl"
      >
        <BrochureSlider brochures={list} />
      </Modal>
    </Card>
  );
}
