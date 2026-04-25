"use client";

import { useSnackbar } from "notistack";
import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import NiDocumentArchive from "@/icons/nexture/ni-document-archive";
import NiDocumentCheck from "@/icons/nexture/ni-document-check";
import NiSearch from "@/icons/nexture/ni-search";
import { formatIDR } from "@/lib/format";
import { useTransactions } from "@/lib/transactions-store";
import type { Transaction, TxStatus } from "@/lib/types";

type StatusFilter = "ALL" | TxStatus;

const HEADER = ["ID", "User", "Paket", "Nilai", "Poin", "Metode", "Status", "Waktu"] as const;

function toRow(t: Transaction): (string | number)[] {
  return [t.id, t.user, t.package, t.amount, t.points, t.method, t.status, t.createdAt];
}

function toTxt(rows: Transaction[]): string {
  const sep = "|";
  const sanitize = (v: string | number) => String(v).replace(/\|/g, "/").replace(/\r?\n/g, " ");
  const lines = [HEADER.join(sep)];
  for (const t of rows) lines.push(toRow(t).map(sanitize).join(sep));
  return lines.join("\r\n");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminTransactionsPage() {
  const { list: txList, loaded: txLoaded, source: txSource } = useTransactions();
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const { enqueueSnackbar } = useSnackbar();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return txList.filter((t) => {
      const matchStatus = status === "ALL" || t.status === status;
      const matchSearch =
        !q || t.user.toLowerCase().includes(q) || t.package.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [txList, status, search]);

  const totals = useMemo(() => {
    const totalAmount = filtered.reduce((acc, r) => acc + r.amount, 0);
    const success = filtered.filter((r) => r.status === "SUCCESS").length;
    const pending = filtered.filter((r) => r.status === "PENDING").length;
    const failed = filtered.filter((r) => r.status === "FAILED").length;
    return { totalAmount, success, pending, failed };
  }, [filtered]);

  const exportTxt = () => {
    try {
      const blob = new Blob(["﻿" + toTxt(filtered)], { type: "text/plain;charset=utf-8" });
      triggerDownload(blob, `transaksi-edudoc-${new Date().toISOString().slice(0, 10)}.txt`);
      enqueueSnackbar(`${filtered.length} transaksi diekspor ke Teks`, { variant: "success" });
    } catch {
      enqueueSnackbar("Gagal export Teks", { variant: "error" });
    }
  };

  const exportXlsx = async () => {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Transaksi");
      ws.addRow(HEADER);
      for (const t of filtered) ws.addRow(toRow(t));
      ws.getRow(1).font = { bold: true };
      ws.columns.forEach((col) => {
        let max = 10;
        col.eachCell?.({ includeEmpty: true }, (cell) => {
          const len = String(cell.value ?? "").length;
          if (len > max) max = len;
        });
        col.width = Math.min(max + 2, 40);
      });
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      triggerDownload(blob, `transaksi-edudoc-${new Date().toISOString().slice(0, 10)}.xlsx`);
      enqueueSnackbar(`${filtered.length} transaksi diekspor ke Excel`, { variant: "success" });
    } catch {
      enqueueSnackbar("Gagal export Excel", { variant: "error" });
    }
  };

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h1" component="h1" className="mb-0">
              Transaksi
            </Typography>
            {txLoaded && txSource === "mock" && (
              <Chip size="small" label="Data dummy" variant="outlined" color="warning" />
            )}
          </Stack>
          <Typography variant="body2" className="text-text-secondary">
            Riwayat pembayaran paket poin dari seluruh user — filter, ekspor, approve manual.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row items-start gap-2">
          <Button variant="surface" color="grey" startIcon={<NiDocumentArchive size="medium" />} onClick={exportXlsx}>
            Export Excel
          </Button>
          <Button variant="surface" color="grey" startIcon={<NiDocumentArchive size="medium" />} onClick={exportTxt}>
            Export Teks
          </Button>
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        {[
          { label: "Total Transaksi", value: filtered.length },
          { label: "Total Nilai", value: formatIDR(totals.totalAmount) },
          { label: "Sukses / Pending / Gagal", value: `${totals.success} / ${totals.pending} / ${totals.failed}` },
        ].map((s) => (
          <Grid size={{ xs: 12, md: 4 }} key={s.label}>
            <Card>
              <CardContent className="flex flex-col gap-5">
                <Box>
                  <Typography variant="body2" className="text-text-secondary-dark">
                    {s.label}
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {s.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid size={12} container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <TextField
            fullWidth
            placeholder="Cari ID / user / paket..."
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
        <Grid size={{ xs: 12, md: 5 }}>
          <TextField
            fullWidth
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <MenuItem value="ALL">Semua Status</MenuItem>
            <MenuItem value="SUCCESS">Sukses</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="FAILED">Gagal</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Paket</TableCell>
                    <TableCell>Nilai</TableCell>
                    <TableCell>Metode</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Waktu</TableCell>
                    <TableCell align="right">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" className="text-text-secondary">
                          Tidak ada transaksi.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((t) => (
                      <TableRow key={t.id} hover>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                            {t.id}
                          </Typography>
                        </TableCell>
                        <TableCell>{t.user}</TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-text-secondary">
                            {t.package}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatIDR(t.amount)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-text-secondary">
                            {t.method}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={t.status}
                            color={t.status === "SUCCESS" ? "success" : t.status === "PENDING" ? "warning" : "error"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" className="text-text-secondary-light">
                            {t.createdAt}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {t.status === "PENDING" && (
                            <Button
                              size="tiny"
                              variant="pastel"
                              color="success"
                              startIcon={<NiDocumentCheck size="small" />}
                              onClick={() => enqueueSnackbar(`Approve ${t.id} (demo)`, { variant: "success" })}
                            >
                              Approve
                            </Button>
                          )}
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
