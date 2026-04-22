"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import NiCamera from "@/icons/nexture/ni-camera";
import NiClock from "@/icons/nexture/ni-clock";
import NiLock from "@/icons/nexture/ni-lock";
import NiPlay from "@/icons/nexture/ni-play";
import NiUsers from "@/icons/nexture/ni-users";
import { formatDate } from "@/lib/format";
import { useZoomSessions } from "@/lib/zoom-sessions-store";

export default function TeacherSessionsPage() {
  const { list } = useZoomSessions();

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Jadwal Sesi
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Daftar sesi Zoom yang dikelola admin — pakai URL yang sudah disediakan.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row items-start gap-2">
          <Chip
            icon={<NiLock size="small" />}
            label="Admin-managed"
            color="warning"
            variant="outlined"
          />
        </Grid>
      </Grid>

      <Grid size={12}>
        <Alert severity="info" variant="outlined">
          Hanya admin yang dapat menambah sesi Zoom. Sebagai guru kamu hanya menjalankan sesi
          yang sudah dijadwalkan.
        </Alert>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        {list.length === 0 ? (
          <Grid size={12}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="body2" className="text-text-secondary">
                  Belum ada sesi yang dijadwalkan.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          list.map((s) => (
            <Grid size={{ xs: 12, md: 6, xl: 4 }} key={s.id}>
              <Card sx={{ height: "100%" }}>
                <CardContent className="flex flex-col gap-2.5">
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {s.status === "LIVE" ? (
                      <Chip size="small" label="LIVE" color="error" />
                    ) : s.status === "ENDED" ? (
                      <Chip size="small" label="Selesai" variant="outlined" />
                    ) : (
                      <Chip size="small" label="Terjadwal" color="info" variant="outlined" />
                    )}
                    <Chip size="small" label={s.subject} color="primary" variant="outlined" />
                  </Stack>

                  <Typography variant="subtitle1">{s.title}</Typography>
                  <Typography variant="caption" className="text-text-secondary-light">
                    {formatDate(s.scheduledAt)} · {s.duration} menit
                  </Typography>

                  <Box className="flex-1" />

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 1 }}
                  >
                    <Stack direction="row" spacing={0.5} alignItems="center" className="text-text-secondary">
                      <NiUsers size="small" />
                      <Typography variant="caption">
                        {s.currentParticipants}/{s.maxParticipants}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center" className="text-warning">
                      <NiClock size="small" />
                      <Typography variant="caption" className="font-semibold">
                        {s.cost} pts
                      </Typography>
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button variant="surface" color="grey" size="tiny" fullWidth>
                      Detail
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="tiny"
                      fullWidth
                      startIcon={<NiPlay size="small" />}
                      component="a"
                      href={s.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Mulai Sesi
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Grid>
  );
}
