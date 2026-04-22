"use client";

import { useMemo, useState } from "react";

import {
  Avatar,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
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

import NiSearch from "@/icons/nexture/ni-search";
import { mockStudents } from "@/lib/mock-data";

export default function TeacherStudentsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mockStudents;
    return mockStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Siswa
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Ringkasan performa seluruh siswa yang mengikuti kelasmu.
          </Typography>
        </Grid>
      </Grid>

      <Grid size={12}>
        <TextField
          fullWidth
          placeholder="Cari nama atau email siswa..."
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
                    <TableCell>Nama</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Quiz Selesai</TableCell>
                    <TableCell>Poin</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" className="text-text-secondary">
                          Tidak ada siswa yang cocok.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((s) => (
                      <TableRow key={s.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32 }}>{s.name.charAt(0)}</Avatar>
                            <Typography variant="body2">{s.name}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-text-secondary">
                            {s.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{s.completedTests}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-warning font-semibold">
                            {s.points} pts
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={s.status}
                            color={s.status === "ACTIVE" ? "success" : "default"}
                            variant="outlined"
                          />
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
