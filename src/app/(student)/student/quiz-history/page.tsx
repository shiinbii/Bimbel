"use client";

import { useMemo } from "react";
import { useSnackbar } from "notistack";

import { Box, Button, Card, CardContent, Chip, Grid, Typography } from "@mui/material";

import NiBinEmpty from "@/icons/nexture/ni-bin-empty";
import NiCheck from "@/icons/nexture/ni-check";
import NiClock from "@/icons/nexture/ni-clock";
import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiDocumentFull from "@/icons/nexture/ni-document-full";
import NiEyeOpen from "@/icons/nexture/ni-eye-open";
import NiShieldCross from "@/icons/nexture/ni-shield-cross";
import { useCurrentUser } from "@/lib/current-user";
import { useQuizHistory } from "@/lib/quiz-history-store";

export default function QuizHistoryPage() {
  const { user } = useCurrentUser();
  const { list, clear } = useQuizHistory(user.email);
  const { enqueueSnackbar } = useSnackbar();

  const stats = useMemo(() => {
    if (list.length === 0) return { total: 0, passed: 0, avg: 0, flagged: 0 };
    const passed = list.filter((a) => a.passed).length;
    const avg = Math.round(list.reduce((acc, a) => acc + a.score, 0) / list.length);
    const flagged = list.filter((a) => a.flagged).length;
    return { total: list.length, passed, avg, flagged };
  }, [list]);

  const statCards = [
    { icon: <NiDocumentFull size="medium" />, label: "Total", value: stats.total },
    { icon: <NiCheck size="medium" />, label: "Lulus", value: stats.passed },
    { icon: <NiClock size="medium" />, label: "Skor Rata-rata", value: stats.avg },
    { icon: <NiShieldCross size="medium" />, label: "Ditandai", value: stats.flagged },
  ];

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Riwayat Pengerjaan Soal
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Setiap attempt yang kamu selesaikan tercatat di sini — skor, durasi, dan anti-cheat.
          </Typography>
        </Grid>
        {list.length > 0 && (
          <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row items-start gap-2">
            <Button
              variant="surface"
              color="grey"
              size="medium"
              startIcon={<NiBinEmpty size="medium" />}
              onClick={() => {
                clear();
                enqueueSnackbar("Riwayat dihapus", { variant: "success" });
              }}
            >
              Hapus Riwayat
            </Button>
          </Grid>
        )}
      </Grid>

      <Grid size={12} container>
        <Typography variant="h6" component="h6" className="mt-2 mb-3 w-full">
          Ringkasan
        </Typography>
        <Grid size={12} container spacing={2.5}>
          {statCards.map((s) => (
            <Grid size={{ lg: 3, md: 6, xs: 12 }} key={s.label}>
              <Card>
                <CardContent className="flex flex-col gap-5">
                  <Box className="flex flex-col">
                    <Box className="flex flex-row items-center justify-between">
                      <Typography variant="body2" className="text-text-secondary-dark">
                        {s.label}
                      </Typography>
                      <Box className="text-primary">{s.icon}</Box>
                    </Box>
                    <Typography variant="h5" className="text-text-primary mt-1">
                      {s.value}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>

      <Grid size={12}>
        <Typography variant="h6" component="h6" className="mt-2 mb-3">
          Semua Pengerjaan
        </Typography>

        {list.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  mx: "auto",
                  borderRadius: 2,
                  bgcolor: "primary.light",
                  color: "primary.main",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <NiDocumentFull size="large" />
              </Box>
              <Typography variant="subtitle1">Belum ada pengerjaan soal</Typography>
              <Typography variant="body2" className="text-text-secondary mt-1">
                Mulai quiz dari menu Soal & Quiz — hasilnya akan tercatat di sini.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box className="flex flex-col gap-2.5">
            {list.map((a) => (
              <Card key={a.id}>
                <CardContent>
                  <Box className="flex items-center gap-2.5 flex-wrap">
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 2,
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: "1px solid",
                        borderColor: a.passed ? "success.main" : "error.main",
                        bgcolor: a.passed ? "success.light" : "error.light",
                        color: a.passed ? "success.dark" : "error.dark",
                      }}
                    >
                      <Typography variant="h5" lineHeight={1}>
                        {a.score}
                      </Typography>
                      <Typography variant="caption" sx={{ mt: 0.5 }}>
                        {a.passed ? "Lulus" : "Gagal"}
                      </Typography>
                    </Box>

                    <Box className="flex-1 min-w-0">
                      <Box className="flex items-center gap-1 flex-wrap">
                        <Typography variant="subtitle1" noWrap>
                          {a.testTitle}
                        </Typography>
                        <Chip size="small" label={a.subject} color="primary" variant="outlined" />
                        {a.cancelled && (
                          <Chip size="small" label="Dibatalkan" color="warning" variant="outlined" />
                        )}
                        {a.flagged && (
                          <Chip
                            size="small"
                            label="Ditandai"
                            color="error"
                            icon={<NiShieldCross size="small" />}
                          />
                        )}
                      </Box>
                      <Box className="flex items-center gap-2 mt-1 flex-wrap">
                        <Box className="text-text-secondary flex items-center gap-1">
                          <NiCheck size="small" />
                          <Typography variant="caption">{a.correct} benar</Typography>
                        </Box>
                        <Box className="text-text-secondary flex items-center gap-1">
                          <NiCrossSquare size="small" />
                          <Typography variant="caption">{a.wrong} salah</Typography>
                        </Box>
                        <Typography variant="caption" className="text-text-secondary">
                          {a.unanswered} kosong · {Math.floor(a.durationUsedSec / 60)}m{" "}
                          {a.durationUsedSec % 60}s
                        </Typography>
                        {a.tabSwitches > 0 && (
                          <Typography
                            variant="caption"
                            sx={{ color: a.flagged ? "error.main" : "warning.main" }}
                          >
                            {a.tabSwitches}× pindah tab
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" className="text-text-secondary-light mt-1 block">
                        {new Date(a.completedAt).toLocaleString("id-ID", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </Typography>
                    </Box>

                    <Button
                      size="tiny"
                      variant="paper"
                      color="grey"
                      startIcon={<NiEyeOpen size="small" />}
                      onClick={() =>
                        enqueueSnackbar("Detail review akan tersedia di update berikutnya.", {
                          variant: "info",
                        })
                      }
                    >
                      Detail
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Grid>
    </Grid>
  );
}
