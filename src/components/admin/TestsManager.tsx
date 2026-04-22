"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import {
  BookOpen, Check, Clock, Coins, Edit3, FileSpreadsheet, FileText,
  FileType2, Plus, Save, Trash2, Upload, Video, X,
} from "lucide-react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Toggle from "@/components/ui/Toggle";
import { useTestsStore, type ManagedTest } from "@/lib/tests-store";
import { estimateCombinations } from "@/lib/quiz-shuffle";
import { sleep } from "@/lib/utils";
import type { Question, TestType } from "@/lib/types";

type FileKind = "pdf" | "word" | "excel" | "unknown";

const ACCEPTED_MIME =
  ".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

function detectKind(file: File): FileKind {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    file.type.includes("word")
  )
    return "word";
  if (
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    file.type.includes("sheet") ||
    file.type.includes("excel")
  )
    return "excel";
  return "unknown";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function inferSubject(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("mat")) return "Matematika";
  if (lower.includes("fis")) return "Fisika";
  if (lower.includes("kim")) return "Kimia";
  if (lower.includes("bio")) return "Biologi";
  if (lower.includes("sej") || lower.includes("histo")) return "Sejarah";
  if (lower.includes("ing") || lower.includes("eng")) return "Bahasa Inggris";
  return "Umum";
}

function titleFromFilename(name: string): string {
  return name
    .replace(/\.(pdf|docx?|xlsx?)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function kindMeta(kind: FileKind) {
  switch (kind) {
    case "pdf":
      return { label: "PDF", tone: "danger" as const, icon: <FileText className="w-3.5 h-3.5" /> };
    case "word":
      return { label: "Word", tone: "info" as const, icon: <FileType2 className="w-3.5 h-3.5" /> };
    case "excel":
      return { label: "Excel", tone: "success" as const, icon: <FileSpreadsheet className="w-3.5 h-3.5" /> };
    default:
      return { label: "Tidak dikenal", tone: "neutral" as const, icon: <FileText className="w-3.5 h-3.5" /> };
  }
}

function genMockQuestions(seedName: string, count: number): Question[] {
  const slug = seedName.replace(/[^a-z0-9]+/gi, "").slice(0, 8).toLowerCase() || "imp";
  return Array.from({ length: count }).map((_, i) => ({
    id: `${slug}_q${i + 1}`,
    text: `(Hasil parsing: ${seedName.slice(0, 40)} · Soal #${i + 1}) Pilih jawaban yang paling tepat berdasarkan materi.`,
    options: [
      { key: "A", text: `Opsi A untuk soal #${i + 1}` },
      { key: "B", text: `Opsi B untuk soal #${i + 1}` },
      { key: "C", text: `Opsi C untuk soal #${i + 1}` },
      { key: "D", text: `Opsi D untuk soal #${i + 1}` },
    ],
    correct: (["A", "B", "C", "D"] as const)[i % 4],
    explanation: `Pembahasan otomatis untuk soal #${i + 1} (import dari ${seedName}). Admin dapat mengedit manual.`,
  }));
}

function emptyTest(): ManagedTest {
  return {
    id: `t_${Date.now()}`,
    title: "",
    subject: "",
    type: "EXAM",
    duration: 30,
    cost: 0,
    totalQuestions: 10,
    requireVideo: false,
    passingScore: 70,
    description: "",
    questions: [],
    active: true,
    questionsPerAttempt: 10,
    shuffleQuestions: true,
    shuffleOptions: true,
  };
}

interface ImportJob {
  id: string;
  file: File;
  kind: FileKind;
  status: "pending" | "parsing" | "success" | "error";
  progress: number;
  detectedQuestions?: number;
  error?: string;
}

export default function TestsManager() {
  const { list, upsert, toggleActive, remove, importMany } = useTestsStore();
  const [editing, setEditing] = useState<ManagedTest | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importModal, setImportModal] = useState(false);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const accepted: ImportJob[] = [];
    for (const f of arr) {
      const kind = detectKind(f);
      if (kind === "unknown") {
        toast.error(`${f.name} ditolak — gunakan PDF / Word / Excel`);
        continue;
      }
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name} > 15 MB`);
        continue;
      }
      accepted.push({
        id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file: f,
        kind,
        status: "pending",
        progress: 0,
      });
    }
    if (accepted.length > 0) {
      setJobs((prev) => [...prev, ...accepted]);
    }
  };

  const removeJob = (id: string) =>
    setJobs((prev) => prev.filter((j) => j.id !== id));

  const runImport = async () => {
    if (jobs.length === 0) {
      toast.error("Tambahkan file terlebih dahulu");
      return;
    }
    setImporting(true);
    const imported: ManagedTest[] = [];

    for (let idx = 0; idx < jobs.length; idx++) {
      const j = jobs[idx];
      // mark parsing + simulate progress
      setJobs((prev) =>
        prev.map((x) => (x.id === j.id ? { ...x, status: "parsing", progress: 0 } : x))
      );
      for (let p = 10; p <= 90; p += 20) {
        await sleep(150);
        setJobs((prev) =>
          prev.map((x) => (x.id === j.id ? { ...x, progress: p } : x))
        );
      }

      const title = titleFromFilename(j.file.name) || "Soal Import";
      const subject = inferSubject(j.file.name);
      // excel/word tends to have more questions; pdf less — just mock heuristics
      const qCount =
        j.kind === "excel" ? 20 : j.kind === "word" ? 15 : 10;
      const questions = genMockQuestions(title, qCount);

      imported.push({
        id: `t_imp_${Date.now()}_${idx}`,
        title,
        subject,
        type: "EXAM",
        duration: Math.max(20, qCount * 2),
        cost: 0,
        totalQuestions: qCount,
        requireVideo: false,
        passingScore: 70,
        description: `Diimpor dari ${j.kind.toUpperCase()}: ${j.file.name} (${formatSize(j.file.size)}).`,
        questions,
        active: true,
        questionsPerAttempt: qCount,
        shuffleQuestions: true,
        shuffleOptions: true,
      });

      setJobs((prev) =>
        prev.map((x) =>
          x.id === j.id
            ? { ...x, status: "success", progress: 100, detectedQuestions: qCount }
            : x
        )
      );
      await sleep(250);
    }

    if (imported.length > 0) {
      importMany(imported);
      const total = imported.reduce((a, t) => a + t.totalQuestions, 0);
      toast.success(
        `${imported.length} file diimpor · ${total} soal dibuat (demo parsing)`
      );
    }
    setImporting(false);
    await sleep(600);
    setImportModal(false);
    setJobs([]);
  };

  const closeImport = () => {
    if (importing) return;
    setImportModal(false);
    setJobs([]);
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-serif text-2xl text-[var(--color-text)]">Bank Soal</h3>
          <p className="text-sm text-[var(--color-text-soft)] mt-1">
            Buat soal baru, import dari PDF / Word / Excel, dan atur ketersediaan
            tiap soal.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportModal(true)}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Import Soal
          </Button>
          <Button
            onClick={() => setEditing(emptyTest())}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Buat Soal Baru
          </Button>
        </div>
      </div>

      <div className="mt-5 grid md:grid-cols-2 gap-3">
        {list.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`rounded-xl border p-4 ${
              t.active
                ? "border-[var(--color-border)] bg-[var(--color-bg-soft)]"
                : "border-[var(--color-border)] bg-white/[0.01] opacity-70"
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  tone={
                    t.type === "EXAM"
                      ? "primary"
                      : t.type === "VIDEO_QUIZ"
                      ? "gold"
                      : "info"
                  }
                >
                  {t.type.replace("_", " ")}
                </Badge>
                <Badge tone="neutral">{t.subject}</Badge>
                {!t.active && <Badge tone="danger">Nonaktif</Badge>}
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)]">
                  {t.active ? "Tersedia" : "Dimatikan"}
                </span>
                <Toggle
                  size="sm"
                  color="emerald"
                  checked={t.active}
                  onChange={() => {
                    toggleActive(t.id);
                    toast.success(
                      t.active ? "Soal dinonaktifkan" : "Soal diaktifkan"
                    );
                  }}
                  ariaLabel="Toggle soal aktif"
                />
              </div>
            </div>

            <p className="mt-3 font-serif text-lg text-[var(--color-text)] leading-tight">
              {t.title || "(Tanpa judul)"}
            </p>
            <p className="text-xs text-[var(--color-text-soft)] mt-1 line-clamp-2">
              {t.description || "—"}
            </p>

            <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-text-soft)] flex-wrap">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" /> {t.totalQuestions} soal
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {t.duration} mnt
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <Coins className="w-3 h-3" /> {t.cost === 0 ? "Gratis" : `${t.cost} pts`}
              </span>
              {t.requireVideo && (
                <span className="flex items-center gap-1 text-amber-300">
                  <Video className="w-3 h-3" /> Video
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(t.id)}
                className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Hapus
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <TestEditModal
        value={editing}
        onClose={() => setEditing(null)}
        onSave={async (t) => {
          await sleep(700);
          upsert(t);
          setEditing(null);
          toast.success("Soal tersimpan");
        }}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Hapus Soal?"
        description="Soal akan dihapus permanen, tidak bisa dikembalikan."
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
              if (confirmDelete) {
                remove(confirmDelete);
                toast.success("Soal dihapus");
              }
              setConfirmDelete(null);
            }}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Hapus
          </Button>
        </div>
      </Modal>

      {/* IMPORT MODAL — PDF / Word / Excel */}
      <Modal
        open={importModal}
        onClose={closeImport}
        title="Import Soal"
        description="Unggah file PDF, Word (.doc/.docx), atau Excel (.xls/.xlsx). Sistem akan membuat draft soal yang bisa kamu edit manual."
        size="lg"
      >
        <div className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_MIME}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
            }}
            className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
              dragOver
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/50"
            }`}
          >
            <div className="flex justify-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 flex items-center justify-center">
                <FileType2 className="w-5 h-5" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>
            <p className="font-serif text-xl text-[var(--color-text)]">
              Drag & drop file ke sini
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              atau klik untuk memilih file · PDF / Word / Excel · maks 15 MB per file
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--color-text-mute)]">
              <span>.pdf</span>·<span>.doc/.docx</span>·<span>.xls/.xlsx</span>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {jobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-[var(--color-text-soft)]">
                    {jobs.length} file dipilih
                  </p>
                  {!importing && (
                    <button
                      onClick={() => setJobs([])}
                      className="text-xs text-red-300 hover:text-red-200"
                    >
                      Bersihkan semua
                    </button>
                  )}
                </div>

                {jobs.map((j) => {
                  const meta = kindMeta(j.kind);
                  return (
                    <div
                      key={j.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)]"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          j.kind === "pdf"
                            ? "bg-red-500/15 text-red-300 border border-red-500/25"
                            : j.kind === "word"
                            ? "bg-sky-500/15 text-sky-300 border border-sky-500/25"
                            : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                        }`}
                      >
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-[var(--color-text)] truncate">
                            {j.file.name}
                          </p>
                          <Badge tone={meta.tone} className="text-[9px]">
                            {meta.label}
                          </Badge>
                          {j.status === "success" && (
                            <Badge tone="success" className="text-[9px] gap-1">
                              <Check className="w-2.5 h-2.5" />
                              {j.detectedQuestions} soal
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--color-text-soft)]">
                          <span>{formatSize(j.file.size)}</span>
                          {j.status === "parsing" && (
                            <span>· sedang parsing...</span>
                          )}
                          {j.status === "success" && <span>· selesai</span>}
                          {j.status === "error" && (
                            <span className="text-red-300">· {j.error}</span>
                          )}
                        </div>
                        {(j.status === "parsing" || j.status === "success") && (
                          <div className="mt-2 h-1 rounded-full bg-[var(--color-bg-soft)] overflow-hidden">
                            <motion.div
                              animate={{ width: `${j.progress}%` }}
                              transition={{ duration: 0.3 }}
                              className={`h-full rounded-full ${
                                j.status === "success"
                                  ? "bg-emerald-400"
                                  : "bg-indigo-400"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                      {!importing && j.status === "pending" && (
                        <button
                          onClick={() => removeJob(j.id)}
                          className="w-8 h-8 rounded-lg bg-[var(--color-bg-soft)] hover:bg-red-500/15 text-[var(--color-text-soft)] hover:text-red-300 flex items-center justify-center shrink-0 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 flex items-start gap-2 text-xs text-amber-200/90">
            <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              <span className="font-semibold">Demo parsing:</span> sistem akan
              membuat soal placeholder dari metadata file. Admin dapat
              mengedit soal & pembahasan secara manual setelah import selesai.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={closeImport} disabled={importing}>
              Batal
            </Button>
            <Button
              onClick={runImport}
              loading={importing}
              leftIcon={<Upload className="w-4 h-4" />}
              disabled={jobs.length === 0}
            >
              {importing
                ? "Memproses..."
                : `Import ${jobs.length > 0 ? `(${jobs.length})` : ""}`}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function TestEditModal({
  value,
  onClose,
  onSave,
}: {
  value: ManagedTest | null;
  onClose: () => void;
  onSave: (t: ManagedTest) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ManagedTest | null>(value);
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

  const set = <K extends keyof ManagedTest>(k: K, v: ManagedTest[K]) =>
    setDraft((p) => (p ? { ...p, [k]: v } : p));

  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    setDraft((p) => {
      if (!p) return p;
      const next = p.questions.map((q, i) =>
        i === idx ? { ...q, ...patch } : q
      );
      return { ...p, questions: next };
    });
  };

  const updateOption = (
    qIdx: number,
    key: "A" | "B" | "C" | "D",
    text: string
  ) => {
    setDraft((p) => {
      if (!p) return p;
      const q = p.questions[qIdx];
      if (!q) return p;
      const options = q.options.map((o) =>
        o.key === key ? { ...o, text } : o
      );
      return {
        ...p,
        questions: p.questions.map((x, i) =>
          i === qIdx ? { ...x, options } : x
        ),
      };
    });
  };

  const addQuestion = () => {
    setDraft((p) => {
      if (!p) return p;
      const n = p.questions.length + 1;
      const newQ: Question = {
        id: `${p.id}_q${Date.now()}`,
        text: `Soal #${n} — tulis pertanyaan di sini`,
        options: [
          { key: "A", text: "Opsi A" },
          { key: "B", text: "Opsi B" },
          { key: "C", text: "Opsi C" },
          { key: "D", text: "Opsi D" },
        ],
        correct: "A",
        explanation: "Pembahasan soal...",
      };
      return {
        ...p,
        questions: [...p.questions, newQ],
        totalQuestions: p.questions.length + 1,
      };
    });
  };

  const removeQuestion = (idx: number) => {
    setDraft((p) => {
      if (!p) return p;
      const next = p.questions.filter((_, i) => i !== idx);
      return { ...p, questions: next, totalQuestions: next.length };
    });
  };

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    setDraft((p) => {
      if (!p) return p;
      const target = idx + dir;
      if (target < 0 || target >= p.questions.length) return p;
      const next = [...p.questions];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return { ...p, questions: next };
    });
  };

  return (
    <Modal
      open={!!value}
      onClose={onClose}
      title={value?.title ? `Edit — ${value.title}` : "Buat Soal Baru"}
      description="Atur metadata soal dan edit tiap pertanyaan beserta pilihan gandanya."
      size="xl"
    >
      <div className="space-y-4">
        <Input
          label="Judul Soal"
          placeholder="Ujian Matematika Semester 1"
          icon={<BookOpen className="w-4 h-4" />}
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Mata Pelajaran"
            value={draft.subject}
            onChange={(e) => set("subject", e.target.value)}
          />
          <div>
            <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
              Tipe Soal
            </label>
            <select
              value={draft.type}
              onChange={(e) => set("type", e.target.value as TestType)}
              className="mt-1.5 w-full h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-indigo-500"
            >
              <option className="bg-[var(--color-bg)]">PRE_TEST</option>
              <option className="bg-[var(--color-bg)]">EXAM</option>
              <option className="bg-[var(--color-bg)]">VIDEO_QUIZ</option>
            </select>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-300" />
                Timer Pengerjaan
              </p>
              <p className="text-xs text-[var(--color-text-soft)]">
                Matikan jika ingin siswa mengerjakan tanpa batas waktu.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)]">
                {draft.duration > 0 ? "Pakai Timer" : "Tanpa Timer"}
              </span>
              <Toggle
                checked={draft.duration > 0}
                onChange={(v) => set("duration", v ? Math.max(30, draft.duration || 30) : 0)}
                color="indigo"
              />
            </div>
          </div>
          {draft.duration > 0 ? (
            <Input
              label="Durasi (menit)"
              type="number"
              min={1}
              icon={<Clock className="w-4 h-4" />}
              value={draft.duration}
              onChange={(e) => set("duration", Math.max(1, Number(e.target.value) || 1))}
              hint="Countdown otomatis muncul saat siswa mengerjakan — auto-submit jika habis"
            />
          ) : (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs text-emerald-200/90">
              Mode bebas waktu aktif. Siswa dapat mengerjakan kapan saja tanpa auto-submit.
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Biaya (pts)"
            type="number"
            icon={<Coins className="w-4 h-4" />}
            value={draft.cost}
            onChange={(e) => set("cost", Number(e.target.value) || 0)}
          />
          <Input
            label="Passing Score"
            type="number"
            value={draft.passingScore}
            onChange={(e) => set("passingScore", Number(e.target.value) || 0)}
          />
        </div>

        {/* BANK & RANDOMIZATION */}
        <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-transparent p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-serif text-lg text-[var(--color-text)]">Bank & Acak Soal</p>
              <p className="text-xs text-[var(--color-text-soft)] mt-0.5">
                Sistem mengambil subset acak dari bank. Setiap siswa dapat
                kombinasi soal & urutan pilihan yang berbeda.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)]">
                Kombinasi Unik
              </p>
              <p className="font-serif text-xl text-gradient-gold">
                {estimateCombinations(
                  draft.questions.length,
                  draft.questionsPerAttempt,
                  draft.shuffleOptions
                )}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
                Ukuran Bank Soal
              </label>
              <div className="mt-1.5 h-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-text-soft)]" />
                <span className="font-mono text-[var(--color-text)]">
                  {draft.questions.length} soal
                </span>
                <Badge tone="neutral" className="ml-auto text-[9px]">
                  Otomatis dari editor di bawah
                </Badge>
              </div>
            </div>
            <Input
              label="Soal per Attempt (yang dikerjakan siswa)"
              type="number"
              min={1}
              max={Math.max(1, draft.questions.length)}
              value={draft.questionsPerAttempt}
              onChange={(e) =>
                set(
                  "questionsPerAttempt",
                  Math.max(1, Math.min(Number(e.target.value) || 1, draft.questions.length || 1))
                )
              }
              hint={
                draft.questionsPerAttempt >= draft.questions.length && draft.questions.length > 0
                  ? "Sama dengan bank — tidak ada random subset"
                  : `Dari ${draft.questions.length} soal di bank`
              }
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <ToggleCard
              label="Acak Urutan Soal"
              desc="Tiap siswa dapat urutan berbeda"
              active={draft.shuffleQuestions}
              onChange={(v) => set("shuffleQuestions", v)}
            />
            <ToggleCard
              label="Acak Pilihan Ganda"
              desc="A/B/C/D di-shuffle per soal"
              active={draft.shuffleOptions}
              onChange={(v) => set("shuffleOptions", v)}
            />
          </div>
        </div>

        {draft.type === "VIDEO_QUIZ" && (
          <Input
            label="URL Video (YouTube embed)"
            placeholder="https://www.youtube.com/embed/..."
            icon={<Video className="w-4 h-4" />}
            value={draft.videoUrl ?? ""}
            onChange={(e) => set("videoUrl", e.target.value)}
          />
        )}

        <div>
          <label className="text-xs font-medium text-[var(--color-text-soft)] uppercase tracking-wider">
            Deskripsi
          </label>
          <textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-mute)] outline-none focus:border-indigo-500 transition resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <ToggleCard
            label="Wajib Tonton Video"
            desc="Muncul di Video Quiz sebelum soal"
            active={draft.requireVideo}
            onChange={(v) => set("requireVideo", v)}
          />
          <ToggleCard
            label="Soal Aktif"
            desc="Siswa bisa mengakses quiz ini"
            active={draft.active}
            onChange={(v) => set("active", v)}
          />
        </div>

        {/* QUESTIONS EDITOR */}
        <div className="pt-3 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="font-serif text-lg text-[var(--color-text)]">
                Pertanyaan ({draft.questions.length})
              </p>
              <p className="text-xs text-[var(--color-text-soft)] mt-0.5">
                Edit soal nomor 1 sampai terakhir — teks, 4 pilihan, jawaban
                benar, dan pembahasan.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={addQuestion}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Tambah Soal
            </Button>
          </div>

          {draft.questions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-soft)] p-6 text-center text-sm text-[var(--color-text-soft)]">
              Belum ada soal. Klik &ldquo;Tambah Soal&rdquo; untuk mulai.
            </div>
          ) : (
            <div className="space-y-3">
              {draft.questions.map((q, idx) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  index={idx}
                  total={draft.questions.length}
                  onChange={(patch) => updateQuestion(idx, patch)}
                  onOptionChange={(k, v) => updateOption(idx, k, v)}
                  onRemove={() => removeQuestion(idx)}
                  onMove={(dir) => moveQuestion(idx, dir)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-[var(--color-border)]">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={async () => {
              if (!draft.title.trim() || !draft.subject.trim()) {
                toast.error("Judul dan mata pelajaran wajib diisi");
                return;
              }
              setSaving(true);
              await onSave(draft);
              setSaving(false);
            }}
            loading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Simpan Soal
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onOptionChange,
  onRemove,
  onMove,
}: {
  question: Question;
  index: number;
  total: number;
  onChange: (patch: Partial<Question>) => void;
  onOptionChange: (key: "A" | "B" | "C" | "D", text: string) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3">
        <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-200 text-xs font-semibold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 text-left min-w-0"
        >
          <p className="text-sm text-[var(--color-text)] line-clamp-1">
            {question.text || "(Soal tanpa teks)"}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)] mt-0.5">
            Jawaban benar: {question.correct} · {question.options.length} opsi
          </p>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="w-7 h-7 rounded-md bg-[var(--color-bg-soft)] hover:bg-[var(--color-bg-soft)] text-[var(--color-text-soft)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center text-xs"
            title="Naik"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="w-7 h-7 rounded-md bg-[var(--color-bg-soft)] hover:bg-[var(--color-bg-soft)] text-[var(--color-text-soft)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center text-xs"
            title="Turun"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-7 h-7 rounded-md bg-[var(--color-bg-soft)] hover:bg-[var(--color-bg-soft)] text-[var(--color-text-soft)] hover:text-[var(--color-text)] transition flex items-center justify-center"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 rounded-md border border-red-500/30 text-red-300 hover:bg-red-500/10 transition flex items-center justify-center"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-border)] pt-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)]">
                  Teks Pertanyaan
                </label>
                <textarea
                  value={question.text}
                  onChange={(e) => onChange({ text: e.target.value })}
                  rows={3}
                  placeholder="Tulis pertanyaan di sini..."
                  className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-mute)] outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)] mb-2 block">
                  Pilihan Jawaban & Alasan
                </label>
                <div className="space-y-2">
                  {question.options.map((o) => {
                    const isCorrect = question.correct === o.key;
                    const expl = question.optionExplanations?.[o.key] ?? "";
                    return (
                      <div
                        key={o.key}
                        className={`rounded-lg border transition overflow-hidden ${
                          isCorrect
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : "border-[var(--color-border)] bg-[var(--color-bg-soft)]"
                        }`}
                      >
                        <div className="flex items-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => onChange({ correct: o.key })}
                            title="Tandai sebagai jawaban benar"
                            className={`w-8 h-8 rounded-md flex items-center justify-center font-serif text-sm shrink-0 transition ${
                              isCorrect
                                ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-[var(--color-text)]"
                                : "bg-[var(--color-bg-soft)] text-[var(--color-text-soft)] hover:bg-[var(--color-bg-soft)]"
                            }`}
                          >
                            {o.key}
                          </button>
                          <input
                            value={o.text}
                            onChange={(e) =>
                              onOptionChange(o.key, e.target.value)
                            }
                            placeholder={`Teks opsi ${o.key}`}
                            className="flex-1 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-mute)]"
                          />
                          {isCorrect ? (
                            <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold">
                              Benar
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-mute)]">
                              Pengecoh
                            </span>
                          )}
                        </div>
                        <div className="px-2 pb-2">
                          <input
                            value={expl}
                            onChange={(e) =>
                              onChange({
                                optionExplanations: {
                                  ...(question.optionExplanations ?? {}),
                                  [o.key]: e.target.value,
                                },
                              })
                            }
                            placeholder={
                              isCorrect
                                ? "Catatan untuk jawaban benar (opsional)"
                                : `Kenapa ${o.key} salah? Dilihat siswa yg menjawab ${o.key}`
                            }
                            className="w-full h-8 rounded-md bg-black/20 border border-[var(--color-border)] px-2 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-mute)] outline-none focus:border-indigo-500/50 transition"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)]">
                  Pembahasan Umum (jawaban benar)
                </label>
                <textarea
                  value={question.explanation}
                  onChange={(e) => onChange({ explanation: e.target.value })}
                  rows={3}
                  placeholder="Jelaskan langkah penyelesaian soal ini..."
                  className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-mute)] outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
      <Toggle checked={active} onChange={onChange} size="md" />
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
        <p className="text-xs text-[var(--color-text-soft)]">{desc}</p>
      </div>
      {active && <Check className="w-3.5 h-3.5 text-indigo-300" />}
    </div>
  );
}
