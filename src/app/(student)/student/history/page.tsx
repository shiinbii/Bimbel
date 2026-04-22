"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import NiArrowDownRight from "@/icons/nexture/ni-arrow-down-right";
import NiArrowHistory from "@/icons/nexture/ni-arrow-history";
import NiArrowUpRight from "@/icons/nexture/ni-arrow-up-right";
import NiClock from "@/icons/nexture/ni-clock";
import NiCoin from "@/icons/nexture/ni-coin";
import { formatIDR } from "@/lib/format";
import { mockTransactions } from "@/lib/mock-data";
import { daysUntil, useWallet } from "@/lib/points-store";

export default function StudentHistoryPage() {
  const { balance, history, grants, nextExpiring } = useWallet();

  const earn = history.filter((h) => h.kind === "GRANT").reduce((a, h) => a + h.points, 0);
  const spend = history.filter((h) => h.kind === "SPEND").reduce((a, h) => a + h.points, 0);
  const expired = history.filter((h) => h.kind === "EXPIRE").reduce((a, h) => a + h.points, 0);

  const stats = [
    {
      icon: <NiCoin size="medium" />,
      label: "Saldo Aktif",
      value: balance,
      hint: nextExpiring
        ? `${nextExpiring.remaining} pts → ${daysUntil(nextExpiring.expiresAt)} hari lagi`
        : "Belum ada poin",
    },
    { icon: <NiArrowUpRight size="medium" />, label: "Total Didapat", value: earn },
    { icon: <NiArrowDownRight size="medium" />, label: "Total Digunakan", value: spend },
    { icon: <NiClock size="medium" />, label: "Expired", value: expired },
  ];

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Riwayat
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Aktivitas poin kamu — earning, spending, dan expiry tercatat di sini.
          </Typography>
        </Grid>
      </Grid>

      <Grid size={12} container>
        <Typography variant="h6" component="h6" className="mt-2 mb-3 w-full">
          Ringkasan Poin
        </Typography>
        <Grid size={12} container spacing={2.5}>
          {stats.map((s) => (
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
                      {s.value.toLocaleString("id-ID")}
                    </Typography>
                    {s.hint && (
                      <Typography variant="caption" className="text-text-secondary-light">
                        {s.hint}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        <Grid size={{ lg: 7, xs: 12 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">
            Aktivitas Poin
          </Typography>
          <Card>
            <CardContent className="flex flex-col gap-2.5">
              <Box className="flex items-center gap-2">
                <NiArrowHistory size="small" />
                <Typography variant="body2" className="text-text-secondary-dark">
                  Semua pergerakan saldo
                </Typography>
              </Box>
              {history.length === 0 ? (
                <Typography className="text-text-secondary py-4 text-center">
                  Belum ada aktivitas poin.
                </Typography>
              ) : (
                <Box className="flex flex-col gap-1.5" sx={{ maxHeight: 560, overflowY: "auto" }}>
                  {history.map((h) => {
                    const positive = h.kind === "GRANT";
                    return (
                      <Box
                        key={h.id}
                        className="flex items-center gap-2.5 p-2"
                        sx={{
                          borderRadius: 1.5,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.default",
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color:
                              h.kind === "SPEND"
                                ? "error.main"
                                : h.kind === "EXPIRE"
                                  ? "warning.main"
                                  : "success.main",
                            bgcolor: "action.hover",
                            flexShrink: 0,
                          }}
                        >
                          {h.kind === "SPEND" ? (
                            <NiArrowDownRight size="small" />
                          ) : h.kind === "EXPIRE" ? (
                            <NiClock size="small" />
                          ) : (
                            <NiArrowUpRight size="small" />
                          )}
                        </Box>
                        <Box className="flex-1 min-w-0">
                          <Typography variant="body2" noWrap>
                            {h.note}
                          </Typography>
                          <Typography variant="caption" className="text-text-secondary-light">
                            {new Date(h.at).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </Typography>
                        </Box>
                        <Box className="text-right">
                          <Typography
                            variant="body2"
                            className="font-semibold"
                            sx={{ color: positive ? "success.main" : "error.main" }}
                          >
                            {positive ? "+" : "-"}
                            {h.points}
                          </Typography>
                          <Typography variant="caption" className="text-text-secondary-light">
                            saldo {h.balanceAfter}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ lg: 5, xs: 12 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">
            Transaksi Pembayaran
          </Typography>
          <Card>
            <CardContent className="flex flex-col gap-2.5">
              <Typography variant="body2" className="text-text-secondary-dark">
                Riwayat pembelian paket poin kamu.
              </Typography>
              {mockTransactions.slice(0, 5).map((t) => (
                <Box
                  key={t.id}
                  className="flex items-center gap-2.5 p-2"
                  sx={{
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.default",
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "warning.main",
                      bgcolor: "action.hover",
                      flexShrink: 0,
                    }}
                  >
                    <NiCoin size="small" />
                  </Box>
                  <Box className="flex-1 min-w-0">
                    <Typography variant="body2" noWrap>
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

      <Grid size={12}>
        <Typography variant="h6" component="h6" className="mt-2 mb-3">
          Semua Batch Poin
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body2" className="text-text-secondary-dark mb-2">
              Termasuk yang sudah habis atau kedaluwarsa.
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Sumber</TableCell>
                    <TableCell align="right">Awal</TableCell>
                    <TableCell align="right">Sisa</TableCell>
                    <TableCell>Diberikan</TableCell>
                    <TableCell>Kedaluwarsa</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" className="text-text-secondary">
                          Belum ada batch poin.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    grants.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell>
                          <Chip
                            size="small"
                            label={g.source.replace("_", " ")}
                            color={
                              g.source === "ADMIN_GRANT"
                                ? "warning"
                                : g.source === "PURCHASE"
                                  ? "success"
                                  : "default"
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{g.points}</TableCell>
                        <TableCell align="right">
                          <Typography className="text-warning font-semibold">
                            {g.remaining}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" className="text-text-secondary-light">
                            {new Date(g.grantedAt).toLocaleDateString("id-ID")}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" className="text-text-secondary-light">
                            {new Date(g.expiresAt).toLocaleDateString("id-ID")}
                          </Typography>
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
    </Grid>
  );
}
