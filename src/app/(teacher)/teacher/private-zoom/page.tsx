"use client";

import Link from "next/link";
import { useSnackbar } from "notistack";
import { useMemo, useState } from "react";

import {
  Alert,
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
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import NiCalendar from "@/icons/nexture/ni-calendar";
import NiCheck from "@/icons/nexture/ni-check";
import NiCross from "@/icons/nexture/ni-cross";
import NiMessage from "@/icons/nexture/ni-message";
import { useCurrentUser } from "@/lib/current-user";
import { pushNotification } from "@/lib/notifications-store";
import { type PrivateZoomRequest, type PrivateZoomStatus, usePrivateZoom } from "@/lib/private-zoom-store";
import { useTeacherProfiles } from "@/lib/teachers-store";

const STATUS_META: Record<
  PrivateZoomStatus,
  { label: string; color: "default" | "warning" | "info" | "success" | "error" | "primary" }
> = {
  PENDING: { label: "Menunggu Saya", color: "warning" },
  SCHEDULED: { label: "Menunggu Konfirmasi Siswa", color: "info" },
  CONFIRMED: { label: "Dikonfirmasi", color: "success" },
  REJECTED: { label: "Ditolak/Re-schedule", color: "error" },
  CANCELLED: { label: "Dibatalkan", color: "default" },
  DONE: { label: "Selesai", color: "primary" },
};

type StatusFilter = "ALL" | PrivateZoomStatus;

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "Semua" },
  { key: "PENDING", label: "Perlu Jadwal" },
  { key: "SCHEDULED", label: "Menunggu Siswa" },
  { key: "CONFIRMED", label: "Dikonfirmasi" },
  { key: "DONE", label: "Selesai" },
];

export default function TeacherPrivateZoomPage() {
  const { user } = useCurrentUser();
  const { list: teachers } = useTeacherProfiles();
  const { list: requests, update } = usePrivateZoom();
  const { enqueueSnackbar } = useSnackbar();

  const me = useMemo(() => {
    const byEmail = teachers.find((t) => user.email && t.email.toLowerCase() === user.email.toLowerCase());
    return byEmail ?? teachers[0];
  }, [teachers, user.email]);

  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [scheduleFor, setScheduleFor] = useState<PrivateZoomRequest | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [rejectFor, setRejectFor] = useState<PrivateZoomRequest | null>(null);

  const mine = useMemo(() => {
    if (!me) return [];
    return requests.filter((r) => r.teacherId === me.id).filter((r) => filter === "ALL" || r.status === filter);
  }, [requests, me, filter]);

  if (!me) {
    return (
      <Card>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h6">Profil guru belum tersedia.</Typography>
          <Typography variant="body2" className="text-text-secondary" sx={{ mt: 1 }}>
            Hubungi admin untuk menambahkan profil guru kamu ke database.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const handleSchedule = () => {
    if (!scheduleFor) return;
    if (!scheduledAt.trim() || !meetingUrl.trim()) {
      enqueueSnackbar("Isi tanggal dan link Zoom dulu", { variant: "error" });
      return;
    }
    update(scheduleFor.id, {
      status: "SCHEDULED",
      scheduledAt: scheduledAt.trim(),
      meetingUrl: meetingUrl.trim(),
    });
    pushNotification({
      kind: "PRIVATE_ZOOM_SCHEDULED",
      targetEmail: scheduleFor.studentEmail,
      title: "Sesi Privat Dijadwalkan",
      body: `${me.name} menjadwalkan sesi untukmu: ${scheduleFor.topic.slice(0, 60)}`,
      link: `/student/private-zoom/${scheduleFor.id}/chat`,
    });
    enqueueSnackbar(`Jadwal dikirim ke ${scheduleFor.studentName}`, { variant: "success" });
    setScheduleFor(null);
    setScheduledAt("");
    setMeetingUrl("");
  };

  const handleReject = () => {
    if (!rejectFor) return;
    update(rejectFor.id, { status: "REJECTED" });
    pushNotification({
      kind: "PRIVATE_ZOOM_REJECTED",
      targetEmail: rejectFor.studentEmail,
      title: "Perlu Re-schedule",
      body: `${me.name} minta re-schedule untuk: ${rejectFor.topic.slice(0, 60)}`,
      link: `/student/private-zoom/${rejectFor.id}/chat`,
    });
    enqueueSnackbar("Permintaan ditolak — siswa akan chat untuk re-schedule", { variant: "info" });
    setRejectFor(null);
  };

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Sesi Privat 1-on-1
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Permintaan sesi privat dari siswa premium. Tentukan jadwal + URL Zoom, siswa akan dapat notifikasi otomatis.
          </Typography>
        </Grid>
      </Grid>

      <Grid size={12}>
        <Alert severity="info" variant="outlined">
          Siswa akan menerima notifikasi dashboard + push saat kamu jadwalkan sesi. Gunakan chat untuk klarifikasi topik
          sebelum sesi berjalan.
        </Alert>
      </Grid>

      <Grid size={12}>
        <Tabs
          value={filter}
          onChange={(_, v) => setFilter(v as StatusFilter)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
      </Grid>

      <Grid size={12}>
        {mine.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 5 }}>
              <Typography variant="body2" className="text-text-secondary">
                Belum ada permintaan di kategori ini.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1.5}>
            {mine.map((r) => {
              const meta = STATUS_META[r.status];
              return (
                <Card key={r.id}>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
                      <Avatar>{r.studentName.charAt(0)}</Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="subtitle1">{r.studentName}</Typography>
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
                        <Typography
                          variant="caption"
                          className="text-text-secondary-light"
                          component="p"
                          sx={{ mt: 0.5 }}
                        >
                          Dikirim{" "}
                          {new Date(r.createdAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
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
                    </Stack>

                    {r.status === "PENDING" && (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          size="tiny"
                          startIcon={<NiCalendar size="small" />}
                          onClick={() => setScheduleFor(r)}
                        >
                          Jadwalkan
                        </Button>
                        <Button
                          variant="paper"
                          color="error"
                          size="tiny"
                          startIcon={<NiCross size="small" />}
                          onClick={() => setRejectFor(r)}
                        >
                          Tolak / Re-schedule
                        </Button>
                      </Stack>
                    )}

                    {r.status === "SCHEDULED" && (
                      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                        <Typography variant="caption" className="text-text-secondary">
                          Jadwal: <strong>{r.scheduledAt}</strong>
                        </Typography>
                        {r.meetingUrl && (
                          <Typography variant="caption" className="text-text-secondary" component="p">
                            Link: {r.meetingUrl}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {r.status === "CONFIRMED" && r.meetingUrl && (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}
                      >
                        <Button
                          variant="contained"
                          color="warning"
                          size="tiny"
                          startIcon={<NiCheck size="small" />}
                          component="a"
                          href={r.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Buka Zoom
                        </Button>
                        <Button
                          variant="surface"
                          color="grey"
                          size="tiny"
                          onClick={() => update(r.id, { status: "DONE" })}
                        >
                          Tandai Selesai
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

      {/* Schedule dialog */}
      <Dialog
        open={!!scheduleFor}
        onClose={() => {
          setScheduleFor(null);
          setScheduledAt("");
          setMeetingUrl("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Jadwalkan Sesi Privat</DialogTitle>
        <DialogContent>
          {scheduleFor && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" className="text-text-secondary">
                Untuk: <strong>{scheduleFor.studentName}</strong> — {scheduleFor.topic}
              </Typography>
              <TextField
                fullWidth
                label="Tanggal & Jam"
                placeholder="Contoh: 28 April 2026, 19:00 WIB"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <TextField
                fullWidth
                label="Link Zoom Meeting"
                placeholder="https://zoom.us/j/..."
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setScheduleFor(null)}>
            Batal
          </Button>
          <Button variant="contained" color="primary" onClick={handleSchedule}>
            Kirim Jadwal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectFor} onClose={() => setRejectFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Tolak / Re-schedule?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Siswa akan dapat notifikasi bahwa kamu belum bisa dan diminta chat untuk re-schedule. Yakin lanjut?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setRejectFor(null)}>
            Batal
          </Button>
          <Button variant="contained" color="error" onClick={handleReject}>
            Ya, Tolak
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
