"use client";

import Link from "next/link";
import { useState } from "react";
import { useSnackbar } from "notistack";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";

import NiArrowHistory from "@/icons/nexture/ni-arrow-history";
import NiBook from "@/icons/nexture/ni-book";
import NiCamera from "@/icons/nexture/ni-camera";
import NiChevronRightSmall from "@/icons/nexture/ni-chevron-right-small";
import NiClock from "@/icons/nexture/ni-clock";
import NiCoin from "@/icons/nexture/ni-coin";
import NiPlay from "@/icons/nexture/ni-play";
import NiTrophy from "@/icons/nexture/ni-trophy";
import { useCurrentUser } from "@/lib/current-user";
import { formatIDR } from "@/lib/format";
import { daysUntil, useWallet } from "@/lib/points-store";
import { mockPackages, mockTransactions, mockUser, mockZoomSessions } from "@/lib/mock-data";
import { getSupabase } from "@/lib/supabase";
import { insertTransaction } from "@/lib/transactions-store";
import type { PointPackage } from "@/lib/types";

const PAYMENT_METHODS = [
  { value: "GOPAY", label: "GoPay" },
  { value: "DANA", label: "DANA" },
  { value: "OVO", label: "OVO" },
  { value: "BCA_VA", label: "BCA Virtual Account" },
  { value: "QRIS", label: "QRIS" },
] as const;

export default function StudentDashboardPage() {
  const { user } = useCurrentUser();
  const { balance, grant, nextExpiring, history } = useWallet();
  const [pkg, setPkg] = useState<PointPackage | null>(null);
  const [method, setMethod] = useState<string>("GOPAY");
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const displayName = user.name || mockUser.name;
  const firstName = displayName.split(" ")[0];
  const upcomingZoom = mockZoomSessions.filter((z) => z.status !== "ENDED").slice(0, 3);
  const recentTx = mockTransactions.slice(0, 4);
  const totalEarn = history.filter((h) => h.kind === "GRANT").reduce((a, h) => a + h.points, 0);
  const totalSpent = history.filter((h) => h.kind === "SPEND").reduce((a, h) => a + h.points, 0);

  const handleBuy = async () => {
    if (!pkg) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const totalPts = pkg.points + (pkg.bonus ?? 0);
    grant(totalPts, undefined, "PURCHASE", `Beli paket ${pkg.name}`);

    // Catat transaksi ke DB (fire-and-forget — tidak block UX kalau gagal).
    const supa = getSupabase();
    let uid: string | null = null;
    if (supa) {
      const { data } = await supa.auth.getSession();
      uid = data.session?.user.id ?? null;
    }
    const methodLabel =
      PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
    void insertTransaction({
      userId: uid,
      userName: displayName,
      userEmail: user.email ?? null,
      packageName: pkg.name,
      amount: pkg.price,
      points: totalPts,
      method: methodLabel,
      status: "SUCCESS",
    });

    enqueueSnackbar(`Berhasil! ${totalPts} poin ditambahkan.`, { variant: "success" });
    setLoading(false);
    setPkg(null);
  };

  const stats = [
    { icon: <NiBook size="medium" />, label: "Quiz Selesai", value: "42", trend: "+12 minggu ini" },
    { icon: <NiCamera size="medium" />, label: "Sesi Diikuti", value: "18", trend: "+3 bulan ini" },
    { icon: <NiTrophy size="medium" />, label: "Skor Rata-rata", value: "84.2", trend: "+6.5 vs bulan lalu" },
    { icon: <NiArrowHistory size="medium" />, label: "Streak Belajar", value: "12 hari", trend: "Rekor: 24 hari" },
  ];

  return (
    <Grid container spacing={5}>
      {/* Page header */}
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Halo, {firstName}
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Selamat datang kembali di EduDoc — semoga sesi belajarmu produktif hari ini.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row items-start gap-2">
          <Button
            component={Link}
            href="/student/quiz"
            size="medium"
            color="grey"
            variant="surface"
            startIcon={<NiBook size="medium" />}
          >
            Bank Soal
          </Button>
          <Button
            size="medium"
            color="primary"
            variant="contained"
            startIcon={<NiCoin size="medium" />}
            onClick={() => setPkg(mockPackages[2])}
          >
            Beli Poin
          </Button>
        </Grid>
      </Grid>

      {/* Point wallet card */}
      <Grid size={12}>
        <Card>
          <CardContent className="flex flex-col gap-5">
            <Grid container spacing={2.5} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Box className="flex items-center gap-2">
                  <Chip
                    icon={<NiCoin size="small" />}
                    label="Point Wallet"
                    color="warning"
                    variant="outlined"
                    size="small"
                  />
                  {nextExpiring && (
                    <Chip
                      icon={<NiClock size="small" />}
                      label={`${nextExpiring.remaining} pts — ${daysUntil(nextExpiring.expiresAt)} hari lagi`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Typography variant="h1" component="p" className="mt-3">
                  {balance.toLocaleString("id-ID")}
                  <Typography variant="h5" component="span" className="text-text-secondary-light ms-2">
                    poin
                  </Typography>
                </Typography>
                <Typography variant="body2" className="text-text-secondary">
                  Setara {formatIDR(balance * 500)} nilai belajar
                </Typography>

                <Grid container spacing={2.5} className="mt-3">
                  <Grid size={{ xs: 6, md: 4 }}>
                    <Typography variant="body2" className="text-text-secondary-dark">
                      Total didapat
                    </Typography>
                    <Typography variant="h5">{totalEarn.toLocaleString("id-ID")}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 4 }}>
                    <Typography variant="body2" className="text-text-secondary-dark">
                      Total digunakan
                    </Typography>
                    <Typography variant="h5">{totalSpent.toLocaleString("id-ID")}</Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box className="flex flex-col gap-2">
                  <Button
                    variant="pastel"
                    color="primary"
                    size="large"
                    fullWidth
                    component={Link}
                    href="/student/quiz"
                    startIcon={<NiPlay size="medium" />}
                  >
                    Mulai Quiz
                  </Button>
                  <Button
                    variant="pastel"
                    color="secondary"
                    size="large"
                    fullWidth
                    component={Link}
                    href="/student/zoom"
                    startIcon={<NiCamera size="medium" />}
                  >
                    Sesi Zoom
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Stats */}
      <Grid size={12} container>
        <Typography variant="h6" component="h6" className="mt-2 mb-3 w-full">
          Ringkasan Belajar
        </Typography>
        <Grid size={12} container spacing={2.5}>
          {stats.map((s) => (
            <Grid size={{ lg: 3, md: 6, xs: 12 }} key={s.label}>
              <Card>
                <CardContent className="flex flex-col gap-5">
                  <Box className="flex flex-col">
                    <Box className="flex flex-row items-center justify-between">
                      <Typography variant="body2" className="text-text-secondary-dark text-nowrap">
                        {s.label}
                      </Typography>
                      <Box className="text-primary">{s.icon}</Box>
                    </Box>
                    <Box className="flex flex-row items-center justify-start gap-2 lg:justify-between lg:gap-0 mt-1">
                      <Typography variant="h5" className="text-text-primary">
                        {s.value}
                      </Typography>
                      <Typography variant="body2" className="text-text-secondary-light">
                        {s.trend}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>

      {/* Upcoming zoom + recent tx */}
      <Grid size={12} container spacing={2.5}>
        <Grid size={{ lg: 7, xs: 12 }}>
          <Box className="mt-2 mb-3 flex flex-wrap justify-between gap-4">
            <Typography variant="h6" component="h6">
              Sesi Zoom Mendatang
            </Typography>
            <Button
              component={Link}
              href="/student/zoom"
              size="tiny"
              color="grey"
              variant="text"
              endIcon={<NiChevronRightSmall size="small" />}
            >
              Semua sesi
            </Button>
          </Box>
          <Box className="flex w-full flex-col gap-2.5">
            {upcomingZoom.map((z) => (
              <Card
                key={z.id}
                component={Link}
                href={`/student/zoom/${z.id}`}
                className="flex w-full flex-row p-1 transition-transform hover:scale-[1.02]"
              >
                <Avatar
                  sx={{ width: 80, height: 80, borderRadius: 2 }}
                  className="text-primary"
                >
                  {z.teacher.charAt(0)}
                </Avatar>
                <CardContent className="flex w-full items-center">
                  <Box className="flex flex-1 flex-col gap-1.5">
                    <Box className="flex flex-row items-center justify-between gap-2">
                      <Typography variant="subtitle2" className="line-clamp-1">
                        {z.title}
                      </Typography>
                      {z.status === "LIVE" ? (
                        <Chip size="small" label="LIVE" color="error" />
                      ) : (
                        <Chip size="small" label="Terjadwal" variant="outlined" />
                      )}
                    </Box>
                    <Typography variant="body2" className="text-text-secondary line-clamp-1">
                      {z.teacher} · {z.subject}
                    </Typography>
                    <Box className="flex items-center gap-3">
                      <Typography variant="caption" className="text-text-secondary-light">
                        {new Date(z.scheduledAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                      <Typography variant="caption" className="text-warning">
                        {z.cost} pts
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

        <Grid size={{ lg: 5, xs: 12 }}>
          <Box className="mt-2 mb-3 flex flex-wrap justify-between gap-4">
            <Typography variant="h6" component="h6">
              Transaksi Terbaru
            </Typography>
            <Button
              component={Link}
              href="/student/history"
              size="tiny"
              color="grey"
              variant="text"
              endIcon={<NiChevronRightSmall size="small" />}
            >
              Semua
            </Button>
          </Box>
          <Card>
            <CardContent className="flex flex-col gap-2.5">
              {recentTx.map((t, i) => (
                <Box
                  key={t.id}
                  className="flex items-center gap-3"
                  sx={{
                    pb: i < recentTx.length - 1 ? 1.5 : 0,
                    borderBottom: i < recentTx.length - 1 ? "1px solid" : "none",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "warning.light",
                      color: "warning.main",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <NiCoin size="small" />
                  </Box>
                  <Box className="flex-1 min-w-0">
                    <Typography variant="subtitle2" className="line-clamp-1">
                      {t.package}
                    </Typography>
                    <Typography variant="caption" className="text-text-secondary-light">
                      {t.createdAt} · {t.method}
                    </Typography>
                  </Box>
                  <Box className="text-right">
                    <Typography variant="body2">{formatIDR(t.amount)}</Typography>
                    <Chip
                      size="small"
                      label={t.status}
                      color={
                        t.status === "SUCCESS"
                          ? "success"
                          : t.status === "PENDING"
                            ? "warning"
                            : "error"
                      }
                      variant="outlined"
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment dialog */}
      <Dialog open={!!pkg} onClose={() => setPkg(null)} maxWidth="md" fullWidth>
        <DialogTitle>Beli Paket {pkg?.name}</DialogTitle>
        <DialogContent>
          {pkg && (
            <Grid container spacing={2.5} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent className="flex flex-col gap-2.5">
                    <Typography variant="body2" className="text-text-secondary-dark">
                      Ringkasan Pembelian
                    </Typography>
                    <Typography variant="h5">{pkg.name}</Typography>
                    <Box className="flex flex-col gap-1">
                      <Row label="Harga paket" value={formatIDR(pkg.price)} />
                      <Row label="Poin diterima" value={`${pkg.points} pts`} />
                      {pkg.bonus ? (
                        <Row label="Bonus poin" value={`+${pkg.bonus} pts`} accent />
                      ) : null}
                      <Row label="Biaya admin" value={formatIDR(2500)} />
                    </Box>
                    <Box
                      sx={{
                        mt: 1,
                        pt: 1.5,
                        borderTop: "1px solid",
                        borderColor: "divider",
                      }}
                      className="flex items-center justify-between"
                    >
                      <Typography variant="body2" className="text-text-secondary">
                        Total
                      </Typography>
                      <Typography variant="h5">
                        {formatIDR(pkg.price + 2500)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" className="text-text-secondary-dark mb-2">
                  Metode Pembayaran
                </Typography>
                <RadioGroup value={method} onChange={(_, v) => setMethod(v)}>
                  {PAYMENT_METHODS.map((m) => (
                    <FormControlLabel
                      key={m.value}
                      value={m.value}
                      control={<Radio />}
                      label={m.label}
                    />
                  ))}
                </RadioGroup>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={handleBuy}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? "Memproses..." : "Bayar Sekarang"}
                </Button>
                <Typography
                  variant="caption"
                  className="text-text-secondary-light"
                  sx={{ mt: 1.5, display: "block", textAlign: "center" }}
                >
                  Transaksi terenkripsi · Tidak ada auto-renewal
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Grid>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Box className="flex items-center justify-between">
      <Typography variant="body2" className="text-text-secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        className={accent ? "text-warning font-semibold" : "text-text-primary"}
      >
        {value}
      </Typography>
    </Box>
  );
}
