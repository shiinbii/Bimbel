"use client";

import Link from "next/link";
import { useSnackbar } from "notistack";
import { useMemo, useRef, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import NiBinEmpty from "@/icons/nexture/ni-bin-empty";
import NiDocumentArchive from "@/icons/nexture/ni-document-archive";
import NiDocumentCheck from "@/icons/nexture/ni-document-check";
import NiEyeOpen from "@/icons/nexture/ni-eye-open";
import NiPen from "@/icons/nexture/ni-pen";
import NiPlay from "@/icons/nexture/ni-play";
import NiPlus from "@/icons/nexture/ni-plus";
import NiSearch from "@/icons/nexture/ni-search";
import { type ManagedTest, useTestsStore } from "@/lib/tests-store";
import type { Question, Test } from "@/lib/types";

const TYPE_COLOR: Record<Test["type"], "primary" | "warning" | "info"> = {
  EXAM: "primary",
  VIDEO_QUIZ: "warning",
  PRE_TEST: "info",
};

const TYPE_LABEL: Record<Test["type"], string> = {
  EXAM: "Ujian",
  VIDEO_QUIZ: "Video Quiz",
  PRE_TEST: "Pre-Test",
};

type EditDraft = {
  id: string;
  title: string;
  subject: string;
  type: Test["type"];
  duration: number;
  cost: number;
  passingScore: number;
  description: string;
  requireVideo: boolean;
  videoUrl: string;
  questionsPerAttempt: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  active: boolean;
};

function toDraft(t: ManagedTest): EditDraft {
  return {
    id: t.id,
    title: t.title,
    subject: t.subject,
    type: t.type,
    duration: t.duration,
    cost: t.cost,
    passingScore: t.passingScore,
    description: t.description,
    requireVideo: t.requireVideo,
    videoUrl: t.videoUrl ?? "",
    questionsPerAttempt: t.questionsPerAttempt,
    shuffleQuestions: t.shuffleQuestions,
    shuffleOptions: t.shuffleOptions,
    active: t.active,
  };
}

export default function AdminTestsPage() {
  const { list, upsert, toggleActive, remove } = useTestsStore();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState("");
  const [viewFor, setViewFor] = useState<ManagedTest | null>(null);
  const [editFor, setEditFor] = useState<ManagedTest | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [deleteFor, setDeleteFor] = useState<ManagedTest | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<EditDraft | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    meta: Omit<EditDraft, "id">;
    questions: Question[];
  } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) => t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
  }, [list, search]);

  const openEdit = (t: ManagedTest) => {
    setEditFor(t);
    setEditDraft(toDraft(t));
  };

  const closeEdit = () => {
    setEditFor(null);
    setEditDraft(null);
  };

  const saveEdit = () => {
    if (!editFor || !editDraft) return;
    if (editDraft.title.trim().length < 2) {
      enqueueSnackbar("Judul minimal 2 karakter", { variant: "error" });
      return;
    }
    const merged: ManagedTest = {
      ...editFor,
      title: editDraft.title.trim(),
      subject: editDraft.subject.trim(),
      type: editDraft.type,
      duration: Number(editDraft.duration) || 1,
      cost: Math.max(0, Number(editDraft.cost) || 0),
      passingScore: Math.min(100, Math.max(0, Number(editDraft.passingScore) || 0)),
      description: editDraft.description,
      requireVideo: editDraft.requireVideo,
      videoUrl: editDraft.videoUrl.trim() || undefined,
      questionsPerAttempt: Math.max(1, Number(editDraft.questionsPerAttempt) || 1),
      shuffleQuestions: editDraft.shuffleQuestions,
      shuffleOptions: editDraft.shuffleOptions,
      active: editDraft.active,
    };
    upsert(merged);
    enqueueSnackbar("Perubahan tersimpan", { variant: "success" });
    closeEdit();
  };

  const confirmDelete = () => {
    if (!deleteFor) return;
    remove(deleteFor.id);
    enqueueSnackbar(`Soal "${deleteFor.title}" dihapus`, { variant: "success" });
    setDeleteFor(null);
  };

  const openAdd = () => {
    setAddDraft({
      id: "",
      title: "",
      subject: "",
      type: "PRE_TEST",
      duration: 30,
      cost: 0,
      passingScore: 70,
      description: "",
      requireVideo: false,
      videoUrl: "",
      questionsPerAttempt: 10,
      shuffleQuestions: true,
      shuffleOptions: true,
      active: true,
    });
    setAddOpen(true);
  };

  const saveAdd = () => {
    if (!addDraft) return;
    if (addDraft.title.trim().length < 2) {
      enqueueSnackbar("Judul minimal 2 karakter", { variant: "error" });
      return;
    }
    const fresh: ManagedTest = {
      id: `qt_${Date.now()}`,
      title: addDraft.title.trim(),
      subject: addDraft.subject.trim(),
      type: addDraft.type,
      duration: Number(addDraft.duration) || 30,
      cost: Math.max(0, Number(addDraft.cost) || 0),
      totalQuestions: 0,
      requireVideo: addDraft.requireVideo,
      videoUrl: addDraft.videoUrl.trim() || undefined,
      passingScore: Number(addDraft.passingScore) || 70,
      description: addDraft.description,
      questions: [],
      active: addDraft.active,
      questionsPerAttempt: Math.max(1, Number(addDraft.questionsPerAttempt) || 1),
      shuffleQuestions: addDraft.shuffleQuestions,
      shuffleOptions: addDraft.shuffleOptions,
    };
    upsert(fresh);
    enqueueSnackbar(`Soal "${fresh.title}" dibuat`, { variant: "success" });
    setAddOpen(false);
    setAddDraft(null);
  };

  const onPickImport = () => importFileRef.current?.click();

  const parseExcel = async (file: File) => {
    setImportBusy(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.worksheets[0];
      if (!ws) throw new Error("Sheet kosong");

      const meta: Omit<EditDraft, "id"> = {
        title: file.name.replace(/\.xlsx$/i, "").replace(/_/g, " "),
        subject: "",
        type: "PRE_TEST",
        duration: 30,
        cost: 0,
        passingScore: 70,
        description: "",
        requireVideo: false,
        videoUrl: "",
        questionsPerAttempt: 10,
        shuffleQuestions: true,
        shuffleOptions: true,
        active: true,
      };

      const questions: Question[] = [];
      let started = false;
      ws.eachRow((row, rowNumber) => {
        const cells: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          cells.push(cell.value == null ? "" : String(cell.value));
        });
        const first = (cells[0] ?? "").trim().toLowerCase();
        if (rowNumber === 1 && first.includes("question")) {
          started = true;
          return;
        }
        if (!started && rowNumber === 1) {
          started = true;
          return;
        }
        const qText = (cells[0] ?? "").trim();
        if (!qText) return;
        const [, a, b, c, d, correctRaw, explanation] = cells;
        const correct = (correctRaw ?? "").trim().toUpperCase();
        if (!["A", "B", "C", "D"].includes(correct)) return;
        questions.push({
          id: `q_${Date.now()}_${questions.length}`,
          text: qText,
          options: [
            { key: "A", text: (a ?? "").trim() },
            { key: "B", text: (b ?? "").trim() },
            { key: "C", text: (c ?? "").trim() },
            { key: "D", text: (d ?? "").trim() },
          ],
          correct: correct as "A" | "B" | "C" | "D",
          explanation: (explanation ?? "").trim(),
        });
      });

      if (questions.length === 0) {
        enqueueSnackbar("Tidak ada pertanyaan valid. Pastikan kolom: Question, A, B, C, D, Correct, Explanation", {
          variant: "error",
        });
        return;
      }

      setImportPreview({ meta, questions });
      setImportOpen(true);
    } catch (err) {
      enqueueSnackbar(`Gagal parse Excel: ${(err as Error).message}`, { variant: "error" });
    } finally {
      setImportBusy(false);
    }
  };

  const onImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx")) {
      void parseExcel(file);
    } else if (name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx")) {
      enqueueSnackbar("Import PDF/Word akan segera tersedia — saat ini hanya Excel (.xlsx)", { variant: "info" });
    } else {
      enqueueSnackbar("Format tidak didukung. Gunakan .xlsx", { variant: "error" });
    }
  };

  const confirmImport = () => {
    if (!importPreview) return;
    const { meta, questions } = importPreview;
    const fresh: ManagedTest = {
      id: `qt_${Date.now()}`,
      title: meta.title.trim() || "Soal Import",
      subject: meta.subject.trim(),
      type: meta.type,
      duration: Number(meta.duration) || 30,
      cost: Math.max(0, Number(meta.cost) || 0),
      totalQuestions: questions.length,
      requireVideo: meta.requireVideo,
      videoUrl: meta.videoUrl.trim() || undefined,
      passingScore: Number(meta.passingScore) || 70,
      description: meta.description,
      questions,
      active: meta.active,
      questionsPerAttempt: Math.min(
        questions.length,
        Math.max(1, Number(meta.questionsPerAttempt) || questions.length),
      ),
      shuffleQuestions: meta.shuffleQuestions,
      shuffleOptions: meta.shuffleOptions,
    };
    upsert(fresh);
    enqueueSnackbar(`Soal "${fresh.title}" dibuat dengan ${questions.length} pertanyaan`, { variant: "success" });
    setImportOpen(false);
    setImportPreview(null);
  };

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Kelola Soal
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Lihat, edit, simulasi, tambah & import soal. Excel siap pakai; PDF & Word menyusul.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row flex-wrap gap-2">
          <Button
            variant="surface"
            color="grey"
            startIcon={<NiDocumentArchive size="medium" />}
            onClick={onPickImport}
            disabled={importBusy}
          >
            {importBusy ? "Memproses..." : "Import (Excel / PDF / Word)"}
          </Button>
          <input ref={importFileRef} type="file" accept=".xlsx,.pdf,.doc,.docx" hidden onChange={onImportFileChange} />
          <Button variant="contained" color="primary" startIcon={<NiPlus size="medium" />} onClick={openAdd}>
            Soal Baru
          </Button>
        </Grid>
      </Grid>

      <Grid size={12}>
        <TextField
          fullWidth
          placeholder="Cari judul atau mata pelajaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <NiSearch size="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Judul</TableCell>
                    <TableCell>Mapel</TableCell>
                    <TableCell>Tipe</TableCell>
                    <TableCell>Durasi</TableCell>
                    <TableCell>Biaya</TableCell>
                    <TableCell>Aktif</TableCell>
                    <TableCell align="right">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" className="text-text-secondary">
                          Tidak ada soal.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((t) => (
                      <TableRow key={t.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{t.title}</Typography>
                          <Typography variant="caption" className="text-text-secondary-light">
                            {t.questions.length} soal di bank · {t.questionsPerAttempt}/attempt
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-text-secondary-dark">
                            {t.subject}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={TYPE_LABEL[t.type]} color={TYPE_COLOR[t.type]} variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{t.duration} mnt</Typography>
                        </TableCell>
                        <TableCell>
                          {t.cost === 0 ? (
                            <Chip size="small" label="Gratis" color="success" variant="outlined" />
                          ) : (
                            <Typography variant="body2" className="text-warning font-semibold">
                              {t.cost} pts
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            size="small"
                            checked={t.active !== false}
                            onChange={() => {
                              toggleActive(t.id);
                              enqueueSnackbar("Status soal diubah", { variant: "success" });
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" title="Lihat detail" onClick={() => setViewFor(t)}>
                            <NiEyeOpen size="small" />
                          </IconButton>
                          <IconButton size="small" color="primary" title="Edit" onClick={() => openEdit(t)}>
                            <NiPen size="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="warning"
                            title="Simulasi (preview sebagai siswa)"
                            component={Link}
                            href={`/student/quiz/${t.id}?preview=1`}
                            target="_blank"
                          >
                            <NiPlay size="small" />
                          </IconButton>
                          <IconButton size="small" color="error" title="Hapus" onClick={() => setDeleteFor(t)}>
                            <NiBinEmpty size="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* View dialog */}
      <Dialog open={!!viewFor} onClose={() => setViewFor(null)} maxWidth="md" fullWidth>
        <DialogTitle>Detail Soal</DialogTitle>
        <DialogContent>
          {viewFor && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                <Typography variant="h6">{viewFor.title}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Chip size="small" label={viewFor.subject} />
                  <Chip size="small" label={TYPE_LABEL[viewFor.type]} color={TYPE_COLOR[viewFor.type]} />
                  <Chip
                    size="small"
                    label={viewFor.active ? "Aktif" : "Nonaktif"}
                    color={viewFor.active ? "success" : "default"}
                  />
                </Stack>
              </Box>
              {viewFor.description && (
                <Typography variant="body2" className="text-text-secondary">
                  {viewFor.description}
                </Typography>
              )}
              <Grid container spacing={2}>
                {[
                  { k: "Durasi", v: `${viewFor.duration} menit` },
                  { k: "Biaya", v: viewFor.cost === 0 ? "Gratis" : `${viewFor.cost} pts` },
                  { k: "Passing Score", v: `${viewFor.passingScore}%` },
                  { k: "Soal di bank", v: `${viewFor.questions.length} soal` },
                  { k: "Per attempt", v: `${viewFor.questionsPerAttempt} soal` },
                  {
                    k: "Shuffle Q / Opt",
                    v: `${viewFor.shuffleQuestions ? "Ya" : "Tidak"} / ${viewFor.shuffleOptions ? "Ya" : "Tidak"}`,
                  },
                ].map((x) => (
                  <Grid key={x.k} size={{ xs: 6, md: 4 }}>
                    <Typography variant="caption" className="text-text-secondary-dark">
                      {x.k}
                    </Typography>
                    <Typography variant="body2">{x.v}</Typography>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 1, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Preview soal (max 5)
                </Typography>
                <Stack spacing={1.5}>
                  {viewFor.questions.slice(0, 5).map((q, i) => (
                    <Card key={q.id ?? i} variant="outlined">
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="subtitle2">
                          {i + 1}. {q.text}
                        </Typography>
                        <Stack spacing={0.25} sx={{ mt: 0.5, pl: 1 }}>
                          {(q.options ?? []).map((opt) => (
                            <Typography
                              key={opt.key}
                              variant="caption"
                              className={opt.key === q.correct ? "text-success font-semibold" : "text-text-secondary"}
                            >
                              {opt.key}. {opt.text}
                            </Typography>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                  {viewFor.questions.length === 0 && (
                    <Typography variant="caption" className="text-text-secondary">
                      Bank soal kosong.
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setViewFor(null)}>
            Tutup
          </Button>
          {viewFor && (
            <Button
              variant="surface"
              color="warning"
              startIcon={<NiPlay size="small" />}
              component={Link}
              href={`/student/quiz/${viewFor.id}?preview=1`}
              target="_blank"
            >
              Simulasi
            </Button>
          )}
          {viewFor && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<NiPen size="small" />}
              onClick={() => {
                openEdit(viewFor);
                setViewFor(null);
              }}
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editFor} onClose={closeEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Soal</DialogTitle>
        <DialogContent>
          {editDraft && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Judul"
                value={editDraft.title}
                onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="Mata Pelajaran"
                  value={editDraft.subject}
                  onChange={(e) => setEditDraft({ ...editDraft, subject: e.target.value })}
                />
                <TextField
                  fullWidth
                  select
                  label="Tipe"
                  value={editDraft.type}
                  onChange={(e) => setEditDraft({ ...editDraft, type: e.target.value as Test["type"] })}
                >
                  <MenuItem value="PRE_TEST">Pre-Test</MenuItem>
                  <MenuItem value="EXAM">Ujian</MenuItem>
                  <MenuItem value="VIDEO_QUIZ">Video Quiz</MenuItem>
                </TextField>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Durasi (menit)"
                  value={editDraft.duration}
                  onChange={(e) => setEditDraft({ ...editDraft, duration: Number(e.target.value) })}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Biaya (pts)"
                  value={editDraft.cost}
                  onChange={(e) => setEditDraft({ ...editDraft, cost: Number(e.target.value) })}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Passing Score (%)"
                  value={editDraft.passingScore}
                  onChange={(e) => setEditDraft({ ...editDraft, passingScore: Number(e.target.value) })}
                />
              </Stack>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Deskripsi"
                value={editDraft.description}
                onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
              />
              <TextField
                fullWidth
                type="number"
                label="Soal per attempt"
                value={editDraft.questionsPerAttempt}
                onChange={(e) => setEditDraft({ ...editDraft, questionsPerAttempt: Number(e.target.value) })}
                helperText={`Maks ${editFor?.questions.length ?? 0} (ukuran bank)`}
              />
              <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">Aktif</Typography>
                  <Switch
                    checked={editDraft.active}
                    onChange={(e) => setEditDraft({ ...editDraft, active: e.target.checked })}
                  />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">Shuffle Soal</Typography>
                  <Switch
                    checked={editDraft.shuffleQuestions}
                    onChange={(e) => setEditDraft({ ...editDraft, shuffleQuestions: e.target.checked })}
                  />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">Shuffle Opsi</Typography>
                  <Switch
                    checked={editDraft.shuffleOptions}
                    onChange={(e) => setEditDraft({ ...editDraft, shuffleOptions: e.target.checked })}
                  />
                </Stack>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">Butuh Video</Typography>
                  <Switch
                    checked={editDraft.requireVideo}
                    onChange={(e) => setEditDraft({ ...editDraft, requireVideo: e.target.checked })}
                  />
                </Stack>
                {editDraft.requireVideo && (
                  <TextField
                    fullWidth
                    label="URL Video"
                    value={editDraft.videoUrl}
                    onChange={(e) => setEditDraft({ ...editDraft, videoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={closeEdit}>
            Batal
          </Button>
          <Button variant="contained" color="primary" startIcon={<NiDocumentCheck size="small" />} onClick={saveEdit}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add new test */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Soal Baru</DialogTitle>
        <DialogContent>
          {addDraft && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Judul"
                value={addDraft.title}
                onChange={(e) => setAddDraft({ ...addDraft, title: e.target.value })}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="Mata Pelajaran"
                  value={addDraft.subject}
                  onChange={(e) => setAddDraft({ ...addDraft, subject: e.target.value })}
                />
                <TextField
                  fullWidth
                  select
                  label="Tipe"
                  value={addDraft.type}
                  onChange={(e) => setAddDraft({ ...addDraft, type: e.target.value as Test["type"] })}
                >
                  <MenuItem value="PRE_TEST">Pre-Test</MenuItem>
                  <MenuItem value="EXAM">Ujian</MenuItem>
                  <MenuItem value="VIDEO_QUIZ">Video Quiz</MenuItem>
                </TextField>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Durasi (menit)"
                  value={addDraft.duration}
                  onChange={(e) => setAddDraft({ ...addDraft, duration: Number(e.target.value) })}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Biaya (pts)"
                  value={addDraft.cost}
                  onChange={(e) => setAddDraft({ ...addDraft, cost: Number(e.target.value) })}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Passing Score (%)"
                  value={addDraft.passingScore}
                  onChange={(e) => setAddDraft({ ...addDraft, passingScore: Number(e.target.value) })}
                />
              </Stack>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Deskripsi"
                value={addDraft.description}
                onChange={(e) => setAddDraft({ ...addDraft, description: e.target.value })}
              />
              <Typography variant="caption" className="text-text-secondary">
                Soal dibuat kosong. Import Excel atau tambahkan pertanyaan lewat Edit setelah disimpan.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setAddOpen(false)}>
            Batal
          </Button>
          <Button variant="contained" color="primary" onClick={saveAdd}>
            Buat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import preview */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Soal — Preview</DialogTitle>
        <DialogContent>
          {importPreview && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" className="text-text-secondary">
                <strong>{importPreview.questions.length}</strong> pertanyaan terdeteksi. Isi metadata, preview 3 soal
                pertama di bawah.
              </Typography>
              <TextField
                fullWidth
                label="Judul"
                value={importPreview.meta.title}
                onChange={(e) =>
                  setImportPreview({ ...importPreview, meta: { ...importPreview.meta, title: e.target.value } })
                }
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="Mata Pelajaran"
                  value={importPreview.meta.subject}
                  onChange={(e) =>
                    setImportPreview({ ...importPreview, meta: { ...importPreview.meta, subject: e.target.value } })
                  }
                />
                <TextField
                  fullWidth
                  select
                  label="Tipe"
                  value={importPreview.meta.type}
                  onChange={(e) =>
                    setImportPreview({
                      ...importPreview,
                      meta: { ...importPreview.meta, type: e.target.value as Test["type"] },
                    })
                  }
                >
                  <MenuItem value="PRE_TEST">Pre-Test</MenuItem>
                  <MenuItem value="EXAM">Ujian</MenuItem>
                  <MenuItem value="VIDEO_QUIZ">Video Quiz</MenuItem>
                </TextField>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Durasi (menit)"
                  value={importPreview.meta.duration}
                  onChange={(e) =>
                    setImportPreview({
                      ...importPreview,
                      meta: { ...importPreview.meta, duration: Number(e.target.value) },
                    })
                  }
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Biaya (pts)"
                  value={importPreview.meta.cost}
                  onChange={(e) =>
                    setImportPreview({
                      ...importPreview,
                      meta: { ...importPreview.meta, cost: Number(e.target.value) },
                    })
                  }
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Passing (%)"
                  value={importPreview.meta.passingScore}
                  onChange={(e) =>
                    setImportPreview({
                      ...importPreview,
                      meta: { ...importPreview.meta, passingScore: Number(e.target.value) },
                    })
                  }
                />
              </Stack>

              <Box sx={{ mt: 1, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Preview 3 pertanyaan pertama
                </Typography>
                <Stack spacing={1.5}>
                  {importPreview.questions.slice(0, 3).map((q, i) => (
                    <Card key={q.id} variant="outlined">
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="subtitle2">
                          {i + 1}. {q.text}
                        </Typography>
                        <Stack spacing={0.25} sx={{ mt: 0.5, pl: 1 }}>
                          {q.options.map((opt) => (
                            <Typography
                              key={opt.key}
                              variant="caption"
                              className={opt.key === q.correct ? "text-success font-semibold" : "text-text-secondary"}
                            >
                              {opt.key}. {opt.text}
                            </Typography>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setImportOpen(false)}>
            Batal
          </Button>
          <Button variant="contained" color="primary" onClick={confirmImport}>
            Import {importPreview?.questions.length ?? 0} Soal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteFor} onClose={() => setDeleteFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Soal?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Soal <strong>{deleteFor?.title}</strong> akan dihapus permanen beserta semua pertanyaan di bank-nya.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setDeleteFor(null)}>
            Batal
          </Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
