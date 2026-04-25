"use client";

import { Form, Formik } from "formik";
import { useSnackbar } from "notistack";
import { useState } from "react";
import * as Yup from "yup";

import {
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
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import NiBinEmpty from "@/icons/nexture/ni-bin-empty";
import NiPen from "@/icons/nexture/ni-pen";
import NiPlus from "@/icons/nexture/ni-plus";
import { formatDate } from "@/lib/format";
import type { ZoomSession, ZoomStatus } from "@/lib/types";
import { useZoomSessions } from "@/lib/zoom-sessions-store";

const STATUS_COLOR: Record<ZoomStatus, "default" | "info" | "error"> = {
  SCHEDULED: "info",
  LIVE: "error",
  ENDED: "default",
};

const Schema = Yup.object({
  title: Yup.string().trim().min(3).required(),
  subject: Yup.string().trim().required(),
  teacher: Yup.string().trim().required(),
  scheduledAt: Yup.string().trim().required(),
  duration: Yup.number().min(15).max(480).required(),
  cost: Yup.number().min(0).required(),
  maxParticipants: Yup.number().min(1).required(),
  meetingUrl: Yup.string().url().required(),
  description: Yup.string().trim().required(),
});

type Draft = Partial<ZoomSession> & { id?: string };

const EMPTY: Draft = {
  title: "",
  subject: "",
  teacher: "",
  scheduledAt: new Date().toISOString(),
  duration: 60,
  cost: 100,
  maxParticipants: 30,
  currentParticipants: 0,
  status: "SCHEDULED",
  meetingUrl: "",
  description: "",
};

export default function AdminZoomSessionsPage() {
  const { list, upsert, remove } = useZoomSessions();
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleteFor, setDeleteFor] = useState<ZoomSession | null>(null);

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Sesi Zoom
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            CRUD sesi zoom — siswa daftar via student portal.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<NiPlus size="medium" />}
            onClick={() => setEditing({ ...EMPTY })}
          >
            Sesi Baru
          </Button>
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        {list.length === 0 ? (
          <Grid size={12}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 5 }}>
                <Typography variant="body2" className="text-text-secondary">
                  Belum ada sesi.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          list.map((s) => (
            <Grid size={{ xs: 12, md: 6, xl: 4 }} key={s.id}>
              <Card sx={{ height: "100%" }}>
                <CardContent className="flex flex-col gap-2">
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      size="small"
                      label={s.status}
                      color={STATUS_COLOR[s.status]}
                      variant={s.status === "ENDED" ? "outlined" : "filled"}
                    />
                    <Chip size="small" label={s.subject} color="primary" variant="outlined" />
                  </Stack>
                  <Typography variant="subtitle1">{s.title}</Typography>
                  <Typography variant="caption" className="text-text-secondary-light">
                    {formatDate(s.scheduledAt)} · {s.duration} mnt · {s.teacher}
                  </Typography>
                  <Typography variant="caption" className="text-text-secondary">
                    {s.currentParticipants}/{s.maxParticipants} peserta · {s.cost} pts
                  </Typography>
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
                      onClick={() => setEditing({ ...s })}
                      fullWidth
                    >
                      Edit
                    </Button>
                    <IconButton size="small" color="error" onClick={() => setDeleteFor(s)}>
                      <NiBinEmpty size="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="md" fullWidth>
        <DialogTitle>{editing?.id ? "Edit Sesi" : "Sesi Baru"}</DialogTitle>
        {editing && (
          <Formik
            initialValues={editing}
            validationSchema={Schema}
            enableReinitialize
            onSubmit={(values) => {
              const session: ZoomSession = {
                id: editing.id ?? `z_${Date.now()}`,
                title: values.title ?? "",
                subject: values.subject ?? "",
                teacher: values.teacher ?? "",
                teacherAvatar: values.teacherAvatar,
                scheduledAt: values.scheduledAt ?? new Date().toISOString(),
                duration: Number(values.duration) || 60,
                cost: Number(values.cost) || 0,
                maxParticipants: Number(values.maxParticipants) || 30,
                currentParticipants: Number(values.currentParticipants) || 0,
                status: values.status ?? "SCHEDULED",
                description: values.description ?? "",
                meetingUrl: values.meetingUrl ?? "",
              };
              upsert(session);
              enqueueSnackbar(`Sesi ${session.title} tersimpan`, { variant: "success" });
              setEditing(null);
            }}
          >
            {({ values, handleChange, handleBlur, errors, touched, submitForm }) => (
              <Form>
                <DialogContent>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Judul"
                      name="title"
                      value={values.title ?? ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.title && !!errors.title}
                      helperText={touched.title && errors.title}
                    />
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          label="Mata Pelajaran"
                          name="subject"
                          value={values.subject ?? ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.subject && !!errors.subject}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          label="Nama Guru"
                          name="teacher"
                          value={values.teacher ?? ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.teacher && !!errors.teacher}
                        />
                      </Grid>
                    </Grid>
                    <TextField
                      fullWidth
                      label="Jadwal (ISO)"
                      name="scheduledAt"
                      value={values.scheduledAt ?? ""}
                      onChange={handleChange}
                      placeholder="2026-04-25T19:00:00Z"
                      helperText="Format ISO 8601"
                    />
                    <Grid container spacing={2}>
                      <Grid size={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Durasi (mnt)"
                          name="duration"
                          value={values.duration ?? 60}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid size={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Biaya (pts)"
                          name="cost"
                          value={values.cost ?? 0}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid size={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Max Peserta"
                          name="maxParticipants"
                          value={values.maxParticipants ?? 30}
                          onChange={handleChange}
                        />
                      </Grid>
                    </Grid>
                    <TextField
                      fullWidth
                      select
                      label="Status"
                      name="status"
                      value={values.status ?? "SCHEDULED"}
                      onChange={handleChange}
                    >
                      <MenuItem value="SCHEDULED">SCHEDULED</MenuItem>
                      <MenuItem value="LIVE">LIVE</MenuItem>
                      <MenuItem value="ENDED">ENDED</MenuItem>
                    </TextField>
                    <TextField
                      fullWidth
                      label="Meeting URL"
                      name="meetingUrl"
                      value={values.meetingUrl ?? ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.meetingUrl && !!errors.meetingUrl}
                    />
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Deskripsi"
                      name="description"
                      value={values.description ?? ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.description && !!errors.description}
                    />
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button variant="paper" color="grey" onClick={() => setEditing(null)}>
                    Batal
                  </Button>
                  <Button variant="contained" color="primary" onClick={submitForm}>
                    Simpan
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        )}
      </Dialog>

      <Dialog open={!!deleteFor} onClose={() => setDeleteFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Sesi?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            <strong>{deleteFor?.title}</strong> akan dihapus.
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
