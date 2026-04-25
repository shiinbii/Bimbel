"use client";

import { useMemo, useState } from "react";

import {
  Alert,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import NiEyeOpen from "@/icons/nexture/ni-eye-open";
import NiLock from "@/icons/nexture/ni-lock";
import NiSearch from "@/icons/nexture/ni-search";
import { mockTests } from "@/lib/mock-data";
import type { Test } from "@/lib/types";

const TYPE_COLOR: Record<Test["type"], "primary" | "warning" | "info"> = {
  EXAM: "primary",
  VIDEO_QUIZ: "warning",
  PRE_TEST: "info",
};

export default function TeacherTestsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mockTests;
    return mockTests.filter((t) => t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
  }, [search]);

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Kelola Soal
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Daftar bank soal yang tersedia untuk mata pelajaran kamu.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row items-start gap-2">
          <Chip icon={<NiLock size="small" />} label="Admin-managed" color="warning" variant="outlined" />
        </Grid>
      </Grid>

      <Grid size={12}>
        <Alert severity="info" variant="outlined">
          Bank soal dikelola pusat oleh admin untuk menjaga kualitas & konsistensi. Jika kamu butuh soal baru, hubungi
          admin untuk import/penambahan.
        </Alert>
      </Grid>

      <Grid size={12}>
        <TextField
          fullWidth
          placeholder="Cari judul soal atau mata pelajaran..."
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

      <Grid size={12}>
        <Card>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Judul</TableCell>
                    <TableCell>Mapel</TableCell>
                    <TableCell>Tipe</TableCell>
                    <TableCell>Durasi</TableCell>
                    <TableCell>Biaya</TableCell>
                    <TableCell align="right">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" className="text-text-secondary">
                          Tidak ada soal yang cocok dengan pencarian.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((t) => (
                      <TableRow key={t.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{t.title}</Typography>
                          <Typography variant="caption" className="text-text-secondary-light">
                            {t.totalQuestions} soal
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-text-secondary-dark">
                            {t.subject}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={t.type.replace("_", " ")}
                            color={TYPE_COLOR[t.type]}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-text-secondary">
                            {t.duration} mnt
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {t.cost === 0 ? (
                            <Chip size="small" label="Gratis" color="success" variant="outlined" />
                          ) : (
                            <Typography variant="body2" className="text-warning font-semibold">
                              {t.cost} pts
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small">
                            <NiEyeOpen size="small" />
                          </IconButton>
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
