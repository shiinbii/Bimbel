"use client";

import { useMemo, useState } from "react";
import { useSnackbar } from "notistack";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
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

import NiBinEmpty from "@/icons/nexture/ni-bin-empty";
import NiEyeOpen from "@/icons/nexture/ni-eye-open";
import NiPen from "@/icons/nexture/ni-pen";
import NiSearch from "@/icons/nexture/ni-search";
import NiShieldCross from "@/icons/nexture/ni-shield-cross";
import NiShieldCheck from "@/icons/nexture/ni-shield-check";
import { useRole } from "@/lib/role-context";
import { isSuperAdmin } from "@/config/roles";
import { useUsersStore, type ManagedUser } from "@/lib/users-store";
import type { Role } from "@/lib/types";

const ROLE_COLOR: Record<Role, "default" | "primary" | "info" | "warning"> = {
  STUDENT: "info",
  TEACHER: "primary",
  ADMIN: "warning",
  SUPER_ADMIN: "warning",
};

type RoleFilter = "ALL" | Role;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

type EditDraft = {
  name: string;
  phone: string;
  role: Role;
};

export default function AdminUsersPage() {
  const { role: currentRole } = useRole();
  const canManage = isSuperAdmin(currentRole);
  const { list, setDeactivated, remove, updateById } = useUsersStore();
  const { enqueueSnackbar } = useSnackbar();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [deleteFor, setDeleteFor] = useState<ManagedUser | null>(null);
  const [editFor, setEditFor] = useState<ManagedUser | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const openEdit = (u: ManagedUser) => {
    setEditFor(u);
    setEditDraft({ name: u.name, phone: u.phone ?? "", role: u.role });
    setEditError(null);
  };

  const closeEdit = () => {
    setEditFor(null);
    setEditDraft(null);
    setEditError(null);
  };

  const saveEdit = () => {
    if (!editFor || !editDraft) return;
    const name = editDraft.name.trim();
    if (name.length < 2) {
      setEditError("Nama minimal 2 karakter");
      return;
    }
    updateById(editFor.id, {
      name,
      phone: editDraft.phone.trim() || undefined,
      role: editDraft.role,
    });
    enqueueSnackbar(`Perubahan untuk ${name} tersimpan`, { variant: "success" });
    closeEdit();
  };

  const users = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((u) => {
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && !u.deactivated) ||
        (statusFilter === "INACTIVE" && u.deactivated);
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q);
      return matchRole && matchStatus && matchSearch;
    });
  }, [list, roleFilter, statusFilter, search]);

  const toggleDeactivation = (u: ManagedUser) => {
    setDeactivated(
      u.id,
      !u.deactivated,
      u.deactivated ? undefined : "ADMIN_ACTION",
    );
    enqueueSnackbar(
      `${u.name} ${u.deactivated ? "diaktifkan" : "dinonaktifkan"}`,
      { variant: "success" },
    );
    setSelected(null);
  };

  const handleDelete = () => {
    if (!deleteFor) return;
    remove(deleteFor.id);
    enqueueSnackbar(`${deleteFor.name} dihapus`, { variant: "success" });
    setDeleteFor(null);
  };

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Kelola User
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            {canManage
              ? "Super Admin: nonaktifkan/aktifkan + hapus user."
              : "Admin: lihat detail user. Nonaktifkan/hapus hanya untuk Super Admin."}
          </Typography>
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <TextField
            fullWidth
            placeholder="Cari nama / email / HP..."
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
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField
            fullWidth
            select
            label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          >
            <MenuItem value="ALL">Semua Role</MenuItem>
            <MenuItem value="STUDENT">Siswa</MenuItem>
            <MenuItem value="TEACHER">Guru</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <TextField
            fullWidth
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <MenuItem value="ALL">Semua Status</MenuItem>
            <MenuItem value="ACTIVE">Aktif</MenuItem>
            <MenuItem value="INACTIVE">Nonaktif</MenuItem>
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
                    <TableCell>Kontak</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" className="text-text-secondary">
                          Tidak ada user yang cocok dengan filter.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow
                        key={u.id}
                        hover
                        sx={{ opacity: u.deactivated ? 0.6 : 1, cursor: "pointer" }}
                        onClick={() => setSelected(u)}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar src={u.avatar} sx={{ width: 32, height: 32 }}>
                              {u.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">{u.name}</Typography>
                              <Typography
                                variant="caption"
                                className="text-text-secondary-light"
                                sx={{ fontFamily: "monospace" }}
                              >
                                {u.id}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-text-secondary">
                            {u.email}
                          </Typography>
                          <Typography
                            variant="caption"
                            className="text-text-secondary-light"
                          >
                            {u.phone ?? "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={u.role.replace("_", " ")}
                            color={ROLE_COLOR[u.role]}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {u.deactivated ? (
                            <Chip size="small" label="Nonaktif" color="error" variant="outlined" />
                          ) : (
                            <Chip size="small" label="Aktif" color="success" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <IconButton size="small" onClick={() => setSelected(u)}>
                            <NiEyeOpen size="small" />
                          </IconButton>
                          {canManage && (
                            <IconButton size="small" color="primary" onClick={() => openEdit(u)}>
                              <NiPen size="small" />
                            </IconButton>
                          )}
                          {canManage && (
                            <IconButton
                              size="small"
                              color={u.deactivated ? "success" : "warning"}
                              onClick={() => toggleDeactivation(u)}
                            >
                              {u.deactivated ? (
                                <NiShieldCheck size="small" />
                              ) : (
                                <NiShieldCross size="small" />
                              )}
                            </IconButton>
                          )}
                          {canManage && (
                            <IconButton size="small" color="error" onClick={() => setDeleteFor(u)}>
                              <NiBinEmpty size="small" />
                            </IconButton>
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

      {/* Detail drawer (dialog) */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Detail User</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={selected.avatar} sx={{ width: 56, height: 56 }}>
                  {selected.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selected.name}</Typography>
                  <Typography variant="caption" className="text-text-secondary" sx={{ fontFamily: "monospace" }}>
                    {selected.id}
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="caption" className="text-text-secondary-dark">
                    Email
                  </Typography>
                  <Typography variant="body2">{selected.email}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" className="text-text-secondary-dark">
                    Phone
                  </Typography>
                  <Typography variant="body2">{selected.phone ?? "—"}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" className="text-text-secondary-dark">
                    Role
                  </Typography>
                  <Chip size="small" label={selected.role.replace("_", " ")} color={ROLE_COLOR[selected.role]} />
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" className="text-text-secondary-dark">
                    Status
                  </Typography>
                  <Chip
                    size="small"
                    label={selected.deactivated ? "Nonaktif" : "Aktif"}
                    color={selected.deactivated ? "error" : "success"}
                  />
                </Grid>
                {selected.deactivationReason && (
                  <Grid size={12}>
                    <Typography variant="caption" className="text-text-secondary-dark">
                      Alasan nonaktif
                    </Typography>
                    <Typography variant="body2">{selected.deactivationReason}</Typography>
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setSelected(null)}>
            Tutup
          </Button>
          {canManage && selected && (
            <Button
              variant="surface"
              color="primary"
              startIcon={<NiPen size="small" />}
              onClick={() => {
                openEdit(selected);
                setSelected(null);
              }}
            >
              Edit
            </Button>
          )}
          {canManage && selected && (
            <Button
              variant="contained"
              color={selected.deactivated ? "success" : "warning"}
              onClick={() => toggleDeactivation(selected)}
            >
              {selected.deactivated ? "Aktifkan" : "Nonaktifkan"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editFor} onClose={closeEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editFor && editDraft && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={editFor.avatar} sx={{ width: 56, height: 56 }}>
                  {editFor.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="caption" className="text-text-secondary-dark">
                    Email (tidak dapat diubah)
                  </Typography>
                  <Typography variant="body2">{editFor.email}</Typography>
                </Box>
              </Stack>
              <TextField
                fullWidth
                label="Nama"
                value={editDraft.name}
                onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                error={!!editError}
                helperText={editError ?? ""}
              />
              <TextField
                fullWidth
                label="No. HP"
                value={editDraft.phone}
                onChange={(e) => setEditDraft({ ...editDraft, phone: e.target.value })}
                placeholder="Opsional"
              />
              <TextField
                fullWidth
                select
                label="Role"
                value={editDraft.role}
                onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value as Role })}
                helperText="Mengubah role akan berdampak pada hak akses user."
              >
                <MenuItem value="STUDENT">Siswa</MenuItem>
                <MenuItem value="TEACHER">Guru</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              </TextField>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={closeEdit}>
            Batal
          </Button>
          <Button variant="contained" color="primary" onClick={saveEdit}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteFor} onClose={() => setDeleteFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus User Permanen?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {deleteFor?.name} akan dihapus permanen. Aksi ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setDeleteFor(null)}>
            Batal
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
