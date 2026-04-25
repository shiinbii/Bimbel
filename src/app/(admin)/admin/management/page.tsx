"use client";

import { useSnackbar } from "notistack";
import { useMemo, useState } from "react";

import {
  Avatar,
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
import NiSearch from "@/icons/nexture/ni-search";
import NiShieldCheck from "@/icons/nexture/ni-shield-check";
import type { Role } from "@/lib/types";
import { useUsersStore } from "@/lib/users-store";

const ROLE_COLOR: Record<Role, "default" | "primary" | "info" | "warning"> = {
  STUDENT: "info",
  TEACHER: "primary",
  ADMIN: "warning",
  SUPER_ADMIN: "warning",
};

const PROMOTABLE_ROLES: Role[] = ["STUDENT", "TEACHER", "ADMIN", "SUPER_ADMIN"];

export default function AdminManagementPage() {
  return (
    <RequireSuperAdmin>
      <ManagementContent />
    </RequireSuperAdmin>
  );
}

function ManagementContent() {
  const { list, updateById } = useUsersStore();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");

  const staff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((u) => {
      const isStaff = u.role === "ADMIN" || u.role === "SUPER_ADMIN" || u.role === "TEACHER";
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return isStaff && matchRole && matchSearch;
    });
  }, [list, search, roleFilter]);

  const changeRole = (id: string, role: Role, name: string) => {
    updateById(id, { role });
    enqueueSnackbar(`Role ${name} diubah ke ${role.replace("_", " ")}`, { variant: "success" });
  };

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Admin & Guru Management
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Super Admin only — kelola staff (teacher, admin, super-admin) dan assign role.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }}>
          <Chip icon={<NiShieldCheck size="small" />} label="Super Admin Only" color="warning" />
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <TextField
            fullWidth
            placeholder="Cari nama atau email..."
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
            <MenuItem value="ALL">Semua Staff</MenuItem>
            <MenuItem value="TEACHER">Teacher</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
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
                    <TableCell>Nama</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role Saat Ini</TableCell>
                    <TableCell>Ubah Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" className="text-text-secondary">
                          Tidak ada staff yang cocok.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    staff.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar src={u.avatar} sx={{ width: 32, height: 32 }}>
                              {u.name.charAt(0)}
                            </Avatar>
                            <Typography variant="subtitle2">{u.name}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-text-secondary">
                            {u.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={u.role.replace("_", " ")} color={ROLE_COLOR[u.role]} />
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            value={u.role}
                            onChange={(e) => changeRole(u.id, e.target.value as Role, u.name)}
                            sx={{ minWidth: 160 }}
                          >
                            {PROMOTABLE_ROLES.map((r) => (
                              <MenuItem key={r} value={r}>
                                {r.replace("_", " ")}
                              </MenuItem>
                            ))}
                          </TextField>
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
