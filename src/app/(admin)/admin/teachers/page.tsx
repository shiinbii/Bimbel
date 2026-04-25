"use client";

import { Form, Formik, type FormikProps } from "formik";
import { useSnackbar } from "notistack";
import { useMemo, useRef, useState } from "react";
import * as Yup from "yup";

import {
  Avatar,
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
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { RadarChart } from "@mui/x-charts/RadarChart";

import NiBinEmpty from "@/icons/nexture/ni-bin-empty";
import NiCamera from "@/icons/nexture/ni-camera";
import NiPen from "@/icons/nexture/ni-pen";
import NiPlus from "@/icons/nexture/ni-plus";
import NiSearch from "@/icons/nexture/ni-search";
import NiStar from "@/icons/nexture/ni-star";
import {
  MAX_STAT,
  overallScore,
  statLabels,
  type TeacherProfile,
  type TeacherStats,
  useTeacherProfiles,
} from "@/lib/teachers-store";

const STAT_KEYS: (keyof TeacherStats)[] = [
  "penjelasan",
  "interaktif",
  "penguasaan",
  "ketepatan",
  "motivasi",
  "kesabaran",
];

function intStats(s: Partial<TeacherStats> | undefined): TeacherStats {
  const base: TeacherStats = {
    penjelasan: 8,
    interaktif: 8,
    penguasaan: 8,
    ketepatan: 8,
    motivasi: 8,
    kesabaran: 8,
  };
  if (!s) return base;
  const out = { ...base };
  for (const k of STAT_KEYS) {
    const v = s[k];
    if (typeof v === "number") out[k] = Math.min(MAX_STAT, Math.max(0, Math.round(v)));
  }
  return out;
}

function StatRadar({ stats, size = 180 }: { stats: TeacherStats; size?: number }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <RadarChart
        height={size}
        width={size}
        hideLegend
        margin={{ top: 24, bottom: 24, left: 24, right: 24 }}
        radar={{
          max: MAX_STAT,
          metrics: STAT_KEYS.map((k) => statLabels[k]),
        }}
        series={[
          {
            label: "Stat",
            data: STAT_KEYS.map((k) => stats[k]),
            fillArea: true,
          },
        ]}
      />
    </Box>
  );
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const Schema = Yup.object({
  name: Yup.string().trim().min(2, "Minimal 2 karakter").required("Nama wajib diisi"),
  email: Yup.string().email("Format email tidak valid").required("Email wajib diisi"),
  subject: Yup.string().trim().required("Mata pelajaran wajib diisi"),
  description: Yup.string().trim().min(10, "Minimal 10 karakter").required("Deskripsi wajib diisi"),
  photo: Yup.string().nullable(),
});

type Draft = Partial<TeacherProfile> & { id?: string };

const EMPTY: Draft = {
  name: "",
  email: "",
  subject: "",
  description: "",
  photo: "",
  rating: 5,
  students: 0,
  sessions: 0,
  status: "ACTIVE",
  stats: { penjelasan: 8, interaktif: 8, penguasaan: 8, ketepatan: 8, motivasi: 8, kesabaran: 8 },
};

export default function AdminTeachersPage() {
  const { list, upsert, remove } = useTeacherProfiles();
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleteFor, setDeleteFor] = useState<TeacherProfile | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q),
    );
  }, [list, search]);

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Profil Guru
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Kelola profil guru EduDoc — tampil di landing page + private zoom.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<NiPlus size="medium" />}
            onClick={() => setEditing({ ...EMPTY })}
          >
            Guru Baru
          </Button>
        </Grid>
      </Grid>

      <Grid size={12}>
        <TextField
          fullWidth
          placeholder="Cari nama / email / mata pelajaran..."
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

      <Grid size={12} container spacing={2.5}>
        {filtered.length === 0 ? (
          <Grid size={12}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 5 }}>
                <Typography variant="body2" className="text-text-secondary">
                  Belum ada guru.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          filtered.map((t) => {
            const ts = intStats(t.stats);
            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={t.id}>
                <Card sx={{ height: "100%" }}>
                  <CardContent className="flex flex-col gap-2">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={t.photo} sx={{ width: 56, height: 56 }}>
                        {t.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1">{t.name}</Typography>
                        <Typography variant="caption" className="text-text-secondary-dark">
                          {t.subject}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={t.status}
                        color={t.status === "ACTIVE" ? "success" : "default"}
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="caption" className="text-text-secondary">
                      {t.email}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {t.description}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Stack direction="row" spacing={0.5} alignItems="center" className="text-warning">
                        <NiStar size="small" />
                        <Typography variant="caption">{t.rating.toFixed(1)}</Typography>
                      </Stack>
                      <Typography variant="caption" className="text-text-secondary">
                        {t.students} siswa · {t.sessions} sesi
                      </Typography>
                    </Stack>
                    <Box sx={{ mt: 0.5, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" className="text-text-secondary-dark">
                          Overall
                        </Typography>
                        <Typography variant="subtitle2" color="primary">
                          {overallScore(ts).toFixed(1)}/10
                        </Typography>
                      </Stack>
                      <StatRadar stats={ts} size={200} />
                    </Box>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ mt: 1, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}
                    >
                      <Button
                        size="tiny"
                        variant="surface"
                        color="grey"
                        startIcon={<NiPen size="small" />}
                        onClick={() => setEditing({ ...t, stats: ts })}
                        fullWidth
                      >
                        Edit
                      </Button>
                      <IconButton size="small" color="error" onClick={() => setDeleteFor(t)}>
                        <NiBinEmpty size="small" />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing?.id ? "Edit Guru" : "Guru Baru"}</DialogTitle>
        {editing && (
          <Formik
            initialValues={editing}
            validationSchema={Schema}
            enableReinitialize
            onSubmit={(values) => {
              const profile: TeacherProfile = {
                id: editing.id ?? `t_${Date.now()}`,
                name: values.name ?? "",
                email: values.email ?? "",
                subject: values.subject ?? "",
                description: values.description ?? "",
                photo: values.photo || undefined,
                rating: Number(values.rating) || 5,
                students: Number(values.students) || 0,
                sessions: Number(values.sessions) || 0,
                status: values.status ?? "ACTIVE",
                stats: intStats(values.stats),
              };
              upsert(profile);
              enqueueSnackbar(`Guru ${profile.name} tersimpan`, { variant: "success" });
              setEditing(null);
            }}
          >
            {({ values, handleChange, handleBlur, errors, touched, setFieldValue, submitForm }) => (
              <TeacherFormBody
                values={values}
                errors={errors}
                touched={touched}
                handleChange={handleChange}
                handleBlur={handleBlur}
                setFieldValue={setFieldValue}
                submitForm={submitForm}
                onCancel={() => setEditing(null)}
                onInvalidFile={(msg) => enqueueSnackbar(msg, { variant: "error" })}
              />
            )}
          </Formik>
        )}
      </Dialog>

      <Dialog open={!!deleteFor} onClose={() => setDeleteFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Guru?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            <strong>{deleteFor?.name}</strong> akan dihapus permanen.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setDeleteFor(null)}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (deleteFor) {
                remove(deleteFor.id);
                enqueueSnackbar("Dihapus", { variant: "success" });
                setDeleteFor(null);
              }
            }}
          >
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

type FormBodyProps = Pick<
  FormikProps<Draft>,
  "values" | "errors" | "touched" | "handleChange" | "handleBlur" | "setFieldValue" | "submitForm"
> & {
  onCancel: () => void;
  onInvalidFile: (msg: string) => void;
};

function TeacherFormBody({
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  setFieldValue,
  submitForm,
  onCancel,
  onInvalidFile,
}: FormBodyProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onInvalidFile("File harus gambar (PNG/JPG/WebP)");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      onInvalidFile("Ukuran maksimal 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFieldValue("photo", String(reader.result));
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => setFieldValue("photo", "");

  return (
    <Form>
      <DialogContent>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ position: "relative" }}>
              <Avatar src={values.photo || undefined} sx={{ width: 88, height: 88, fontSize: 32 }}>
                {(values.name ?? "").charAt(0) || "?"}
              </Avatar>
              <IconButton
                size="small"
                color="primary"
                onClick={onPickFile}
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  bgcolor: "background.paper",
                  boxShadow: 1,
                  "&:hover": { bgcolor: "background.paper" },
                }}
              >
                <NiCamera size="small" />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2">Foto Profil</Typography>
              <Typography variant="caption" className="text-text-secondary">
                PNG/JPG/WebP, maks 2MB. Klik ikon kamera untuk ubah.
              </Typography>
              {values.photo ? (
                <Button size="tiny" variant="text" color="error" onClick={clearPhoto} sx={{ mt: 0.5 }}>
                  Hapus foto
                </Button>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={onFileChange}
              />
            </Box>
          </Stack>

          <TextField
            fullWidth
            label="Nama Lengkap"
            name="name"
            value={values.name ?? ""}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!(touched.name && errors.name)}
            helperText={(touched.name && errors.name) as string}
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={values.email ?? ""}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!(touched.email && errors.email)}
            helperText={(touched.email && errors.email) as string}
          />
          <TextField
            fullWidth
            label="Mata Pelajaran"
            name="subject"
            value={values.subject ?? ""}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!(touched.subject && errors.subject)}
            helperText={(touched.subject && errors.subject) as string}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Deskripsi"
            name="description"
            value={values.description ?? ""}
            onChange={handleChange}
            onBlur={handleBlur}
            error={!!(touched.description && errors.description)}
            helperText={(touched.description && errors.description) as string}
          />

          <Box sx={{ mt: 1, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle2">Chart Kemampuan (1–10)</Typography>
              <Typography variant="caption" className="text-text-secondary">
                Overall: <strong>{overallScore(intStats(values.stats)).toFixed(1)}/10</strong>
              </Typography>
            </Stack>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={1.5}>
                  {STAT_KEYS.map((k) => {
                    const val = Math.round((values.stats?.[k] ?? 8) as number);
                    return (
                      <Box key={k}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" className="text-text-secondary-dark">
                            {statLabels[k]}
                          </Typography>
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                            {val}
                          </Typography>
                        </Stack>
                        <Slider
                          size="small"
                          min={1}
                          max={MAX_STAT}
                          step={1}
                          marks
                          value={val}
                          onChange={(_, v) => {
                            const num = Array.isArray(v) ? v[0] : v;
                            setFieldValue(`stats.${k}`, Math.round(num));
                          }}
                          valueLabelDisplay="auto"
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <StatRadar stats={intStats(values.stats)} size={200} />
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="paper" color="grey" onClick={onCancel}>
          Batal
        </Button>
        <Button variant="contained" color="primary" onClick={submitForm}>
          Simpan
        </Button>
      </DialogActions>
    </Form>
  );
}
