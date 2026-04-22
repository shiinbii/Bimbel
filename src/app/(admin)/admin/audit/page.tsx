"use client";

import { useMemo, useState } from "react";

import {
  Box,
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

import RequireSuperAdmin from "@/components/layout/RequireSuperAdmin";
import NiPulse from "@/icons/nexture/ni-pulse";
import NiSearch from "@/icons/nexture/ni-search";
import NiShieldCheck from "@/icons/nexture/ni-shield-check";
import { useAuditLogs } from "@/lib/audit-store";
import type { Role } from "@/lib/types";

const ROLE_COLOR: Record<Role, "default" | "primary" | "info" | "warning"> = {
  STUDENT: "info",
  TEACHER: "primary",
  ADMIN: "warning",
  SUPER_ADMIN: "warning",
};

export default function AdminAuditPage() {
  return (
    <RequireSuperAdmin>
      <AuditContent />
    </RequireSuperAdmin>
  );
}

function AuditContent() {
  const { list: logs, loaded, source } = useAuditLogs();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchRole = roleFilter === "ALL" || log.role === roleFilter;
      const matchSearch =
        !q ||
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [logs, search, roleFilter]);

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Audit Log
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Jejak aktivitas admin & super-admin. Super Admin only.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {loaded && source === "mock" && (
              <Chip size="small" label="Data dummy" variant="outlined" color="warning" />
            )}
            <Chip icon={<NiShieldCheck size="small" />} label="Super Admin Only" color="warning" />
          </Stack>
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        {[
          { label: "Total Event", value: logs.length },
          {
            label: "24 Jam Terakhir",
            value: logs.filter((l) => {
              const t = Date.parse(l.time);
              return Number.isFinite(t) && Date.now() - t < 24 * 60 * 60 * 1000;
            }).length,
          },
          { label: "Super Admin Events", value: logs.filter((l) => l.role === "SUPER_ADMIN").length },
        ].map((s) => (
          <Grid size={{ xs: 12, md: 4 }} key={s.label}>
            <Card>
              <CardContent className="flex flex-col gap-5">
                <Box className="flex flex-row items-center justify-between">
                  <Typography variant="body2" className="text-text-secondary-dark">
                    {s.label}
                  </Typography>
                  <Box className="text-primary">
                    <NiPulse size="medium" />
                  </Box>
                </Box>
                <Typography variant="h5">{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid size={12} container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <TextField
            fullWidth
            placeholder="Cari actor / aksi / target..."
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
            label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "ALL" | Role)}
          >
            <MenuItem value="ALL">Semua Role</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Waktu</TableCell>
                    <TableCell>Actor</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>IP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" className="text-text-secondary">
                          Tidak ada log.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          <Typography variant="caption" className="text-text-secondary">
                            {log.time}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{log.user}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={log.role.replace("_", " ")} color={ROLE_COLOR[log.role]} variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                            {log.action}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-text-secondary">
                            {log.target}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: "monospace" }} className="text-text-secondary-light">
                            {log.ip}
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
