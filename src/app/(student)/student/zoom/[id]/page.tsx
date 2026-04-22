"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import TierGate from "@/components/TierGate";
import NiArrowLeft from "@/icons/nexture/ni-arrow-left";
import NiCamera from "@/icons/nexture/ni-camera";
import NiClock from "@/icons/nexture/ni-clock";
import NiPlay from "@/icons/nexture/ni-play";
import NiShield from "@/icons/nexture/ni-shield";
import NiUsers from "@/icons/nexture/ni-users";
import { formatDate } from "@/lib/format";
import { mockStudents } from "@/lib/mock-data";
import { useWallet } from "@/lib/points-store";
import { computeTier, useTierConfigs } from "@/lib/tier-config-store";
import { useZoomSessions } from "@/lib/zoom-sessions-store";

export default function ZoomWaitingRoomPage() {
  const { list: zoomList } = useZoomSessions();
  const { balance } = useWallet();
  const { list: tiers } = useTierConfigs();
  const currentTier = computeTier(balance, tiers);
  const firstZoomTier = tiers.find((t) => t.canAccessZoom);
  const params = useParams<{ id: string }>();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const session = useMemo(
    () => zoomList.find((z) => z.id === params.id),
    [params.id, zoomList],
  );

  if (!currentTier.canAccessZoom) {
    return (
      <TierGate
        required={firstZoomTier ?? currentTier}
        current={currentTier}
        feature="Sesi Zoom Live"
        description={`Akses sesi zoom live grup tersedia mulai paket ${
          firstZoomTier?.name ?? "—"
        } ke atas.`}
      />
    );
  }

  if (!session) {
    return (
      <Card>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h6">Sesi tidak ditemukan.</Typography>
          <Button component={Link} href="/student/zoom" sx={{ mt: 2 }}>
            Kembali ke daftar sesi
          </Button>
        </CardContent>
      </Card>
    );
  }

  const participants = mockStudents.slice(0, session.currentParticipants || 8);
  const canEnter = session.status === "LIVE";

  return (
    <Stack spacing={3}>
      <Button
        component={Link}
        href="/student/zoom"
        startIcon={<NiArrowLeft size={16} />}
        size="small"
        sx={{ alignSelf: "flex-start" }}
      >
        Semua sesi
      </Button>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                  <Chip
                    icon={<NiCamera size={14} />}
                    label={session.status === "LIVE" ? "LIVE" : session.status === "ENDED" ? "Selesai" : "Terjadwal"}
                    color={session.status === "LIVE" ? "error" : session.status === "ENDED" ? "default" : "info"}
                  />
                  <Chip size="small" label={session.subject} color="primary" variant="outlined" />
                </Stack>
                <Typography variant="h4" sx={{ mt: 2 }}>
                  {session.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {session.description}
                </Typography>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <NiClock size={14} />
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          Jadwal
                        </Typography>
                        <Typography variant="body2">{formatDate(session.scheduledAt)}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <NiClock size={14} />
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          Durasi
                        </Typography>
                        <Typography variant="body2">{session.duration} menit</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <NiUsers size={14} />
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          Peserta
                        </Typography>
                        <Typography variant="body2">
                          {session.currentParticipants}/{session.maxParticipants}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="overline" color="text.secondary">
                  Pengajar
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
                  <Avatar sx={{ width: 48, height: 48 }}>{session.teacher.charAt(0)}</Avatar>
                  <Box>
                    <Typography variant="subtitle1">{session.teacher}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {session.subject}
                    </Typography>
                  </Box>
                </Stack>

                <Typography variant="overline" color="text.secondary" sx={{ mt: 3, display: "block" }}>
                  Peserta bergabung
                </Typography>
                <AvatarGroup max={6} sx={{ mt: 1, justifyContent: "flex-start" }}>
                  {participants.map((s) => (
                    <Avatar key={s.id}>{s.name.charAt(0)}</Avatar>
                  ))}
                </AvatarGroup>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", md: "center" }}
                  spacing={2}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="overline" color="text.secondary">
                      Link meeting
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                        mt: 0.5,
                      }}
                    >
                      {session.meetingUrl}
                    </Typography>
                  </Box>
                  {canEnter ? (
                    <Button
                      variant="contained"
                      color="warning"
                      size="large"
                      startIcon={<NiPlay size={16} />}
                      onClick={() => setConfirmOpen(true)}
                    >
                      Masuk Zoom
                    </Button>
                  ) : session.status === "ENDED" ? (
                    <Button variant="outlined" size="large" disabled>
                      Sesi Berakhir
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<NiShield size={16} />}
                      disabled
                    >
                      Tunggu sampai LIVE
                    </Button>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                  Link meeting aktif otomatis saat sesi LIVE. Status diperbarui real-time.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Chat Room
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Chat live peserta akan tampil di sini saat sesi berlangsung.
                Fitur ini akan aktif di update berikutnya.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Masuk Zoom Meeting?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Kamu akan membuka tab baru ke <strong>{session.title}</strong>. Pastikan kamera + mic
            sudah siap.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Batal</Button>
          <Button
            variant="contained"
            color="warning"
            component="a"
            href={session.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<NiPlay size={16} />}
            onClick={() => setConfirmOpen(false)}
          >
            Buka Zoom
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
