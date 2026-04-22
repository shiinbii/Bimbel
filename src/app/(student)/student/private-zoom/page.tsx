"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Formik, Form } from "formik";
import { useSnackbar } from "notistack";
import * as Yup from "yup";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import TierGate from "@/components/TierGate";
import NiCheck from "@/icons/nexture/ni-check";
import NiCrown from "@/icons/nexture/ni-crown";
import NiMessage from "@/icons/nexture/ni-message";
import NiSendRight from "@/icons/nexture/ni-send-right";
import NiStar from "@/icons/nexture/ni-star";
import { useCurrentUser } from "@/lib/current-user";
import { mockUser } from "@/lib/mock-data";
import { pushNotification } from "@/lib/notifications-store";
import { useWallet } from "@/lib/points-store";
import { usePrivateZoom, type PrivateZoomStatus } from "@/lib/private-zoom-store";
import { useTeacherProfiles } from "@/lib/teachers-store";
import { computeTier, useTierConfigs } from "@/lib/tier-config-store";

const STATUS_META: Record<
  PrivateZoomStatus,
  { label: string; color: "default" | "warning" | "info" | "success" | "error" | "primary" }
> = {
  PENDING: { label: "Menunggu Guru", color: "warning" },
  SCHEDULED: { label: "Perlu Konfirmasi Kamu", color: "info" },
  CONFIRMED: { label: "Dikonfirmasi", color: "success" },
  REJECTED: { label: "Perlu Re-schedule", color: "error" },
  CANCELLED: { label: "Dibatalkan", color: "default" },
  DONE: { label: "Selesai", color: "primary" },
};

const RequestSchema = Yup.object().shape({
  teacherId: Yup.string().required("Pilih guru"),
  topic: Yup.string().trim().min(5, "Minimal 5 karakter").required("Topik wajib"),
  notes: Yup.string(),
});

export default function StudentPrivateZoomPage() {
  const { user } = useCurrentUser();
  const { balance } = useWallet();
  const { list: tiers } = useTierConfigs();
  const currentTier = computeTier(balance, tiers);
  const privateTier = tiers.find((t) => t.canRequestPrivateZoom);
  const canPrivate = currentTier.canRequestPrivateZoom;

  const { list: teachers } = useTeacherProfiles();
  const { list: requests, create } = usePrivateZoom();
  const { enqueueSnackbar } = useSnackbar();

  const name = user.name ?? mockUser.name;
  const email = user.email ?? mockUser.email;

  const myRequests = useMemo(
    () => requests.filter((r) => r.studentEmail.toLowerCase() === email.toLowerCase()),
    [requests, email],
  );

  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === "ACTIVE"), [teachers]);

  if (!canPrivate) {
    return (
      <TierGate
        required={privateTier ?? currentTier}
        current={currentTier}
        feature="Sesi Privat 1-on-1"
        description={`Sesi zoom privat 1-on-1 dengan guru pilihan hanya tersedia untuk tier ${
          privateTier?.name ?? "tertinggi"
        }. Top up poin untuk naik tier otomatis.`}
      />
    );
  }

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Sesi Privat 1-on-1
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Pilih guru, tentukan topik — notifikasi akan terkirim ke guru untuk penjadwalan.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row items-start gap-2">
          <Chip
            icon={<NiCrown size="small" />}
            label="Fitur Premium"
            color="warning"
            variant="outlined"
          />
        </Grid>
      </Grid>

      {/* Request form */}
      <Grid size={12}>
        <Typography variant="h6" component="h6" className="mt-2 mb-3">
          Kirim Permintaan Baru
        </Typography>
        <Formik
          initialValues={{ teacherId: "", topic: "", notes: "" }}
          validationSchema={RequestSchema}
          onSubmit={async (values, { resetForm, setSubmitting }) => {
            const teacher = activeTeachers.find((t) => t.id === values.teacherId);
            if (!teacher) {
              enqueueSnackbar("Guru tidak ditemukan", { variant: "error" });
              setSubmitting(false);
              return;
            }
            await new Promise((r) => setTimeout(r, 800));
            create({
              studentEmail: email,
              studentName: name,
              teacherId: teacher.id,
              teacherName: teacher.name,
              subject: teacher.subject,
              topic: values.topic.trim(),
              notes: values.notes.trim() || undefined,
            });
            pushNotification({
              kind: "PRIVATE_ZOOM_REQUEST",
              targetEmail: teacher.email,
              title: "Permintaan Sesi Privat Baru",
              body: `${name} memintamu mengajar: ${values.topic.slice(0, 80)}`,
              link: "/teacher/private-zoom",
            });
            enqueueSnackbar(`Permintaan terkirim ke ${teacher.name}`, { variant: "success" });
            resetForm();
            setSubmitting(false);
          }}
        >
          {({ values, handleChange, handleBlur, errors, touched, isSubmitting, setFieldValue }) => (
            <Form>
              <Card>
                <CardContent className="flex flex-col gap-2.5">
                  <TextField
                    select
                    fullWidth
                    label="Pilih Guru"
                    name="teacherId"
                    value={values.teacherId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.teacherId && Boolean(errors.teacherId)}
                    helperText={touched.teacherId && errors.teacherId}
                  >
                    {activeTeachers.length === 0 ? (
                      <MenuItem disabled value="">
                        Tidak ada guru aktif
                      </MenuItem>
                    ) : (
                      activeTeachers.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ width: 24, height: 24 }}>{t.name.charAt(0)}</Avatar>
                            <Box>
                              <Typography variant="body2">{t.name}</Typography>
                              <Typography variant="caption" className="text-text-secondary">
                                {t.subject} · {t.rating.toFixed(1)} ⭐
                              </Typography>
                            </Box>
                          </Stack>
                        </MenuItem>
                      ))
                    )}
                  </TextField>

                  <TextField
                    fullWidth
                    label="Topik / Materi"
                    name="topic"
                    value={values.topic}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Contoh: Pembahasan soal UTBK Matematika — fungsi komposisi"
                    error={touched.topic && Boolean(errors.topic)}
                    helperText={touched.topic && errors.topic}
                  />

                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Catatan Tambahan (opsional)"
                    name="notes"
                    value={values.notes}
                    onChange={handleChange}
                    placeholder="Preferensi waktu / level kesulitan / soal spesifik..."
                  />

                  <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="warning"
                      startIcon={<NiSendRight size="small" />}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Mengirim..." : "Kirim Permintaan"}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Form>
          )}
        </Formik>
      </Grid>

      {/* Teachers preview */}
      <Grid size={12}>
        <Typography variant="h6" component="h6" className="mt-2 mb-3">
          Guru Aktif
        </Typography>
        <Grid container spacing={2.5}>
          {activeTeachers.slice(0, 6).map((t) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t.id}>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar src={t.photo}>{t.name.charAt(0)}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap>
                        {t.name}
                      </Typography>
                      <Typography variant="caption" className="text-text-secondary-dark">
                        {t.subject}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <Stack direction="row" spacing={0.5} alignItems="center" className="text-warning">
                      <NiStar size="small" />
                      <Typography variant="caption">{t.rating.toFixed(1)}</Typography>
                    </Stack>
                    <Typography variant="caption" className="text-text-secondary">
                      {t.students} siswa · {t.sessions} sesi
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* My requests */}
      <Grid size={12}>
        <Typography variant="h6" component="h6" className="mt-2 mb-3">
          Permintaan Saya
        </Typography>
        {myRequests.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 5 }}>
              <Typography variant="body2" className="text-text-secondary">
                Belum ada permintaan. Kirim permintaan pertamamu di form atas.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {myRequests.map((r) => {
              const meta = STATUS_META[r.status];
              return (
                <Card key={r.id}>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
                      <Avatar>{r.teacherName.charAt(0)}</Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="subtitle1">{r.teacherName}</Typography>
                          <Chip size="small" label={r.subject} color="primary" variant="outlined" />
                          <Chip size="small" label={meta.label} color={meta.color} />
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {r.topic}
                        </Typography>
                        {r.notes && (
                          <Typography variant="caption" className="text-text-secondary">
                            Catatan: {r.notes}
                          </Typography>
                        )}
                        <Typography variant="caption" className="text-text-secondary-light" component="p" sx={{ mt: 0.5 }}>
                          Dikirim {new Date(r.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                        </Typography>
                      </Box>
                      <Button
                        component={Link}
                        href={`/student/private-zoom/${r.id}/chat`}
                        variant="surface"
                        color="grey"
                        size="tiny"
                        startIcon={<NiMessage size="small" />}
                      >
                        Chat
                      </Button>
                    </Stack>
                    {r.status === "SCHEDULED" && (
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                        <Button
                          size="tiny"
                          variant="contained"
                          color="success"
                          startIcon={<NiCheck size="small" />}
                        >
                          Konfirmasi Jadwal
                        </Button>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Grid>
    </Grid>
  );
}
