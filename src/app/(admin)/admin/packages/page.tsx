"use client";

import { Form, Formik } from "formik";
import { useSnackbar } from "notistack";
import { useState } from "react";
import * as Yup from "yup";

import {
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import NiBinEmpty from "@/icons/nexture/ni-bin-empty";
import NiPen from "@/icons/nexture/ni-pen";
import NiPlus from "@/icons/nexture/ni-plus";
import { type CreditPackage, useCreditPackages } from "@/lib/credit-packages-store";
import { formatIDR } from "@/lib/format";
import type { PackageCategory } from "@/lib/types";

const CATEGORY_LABEL: Record<PackageCategory, string> = {
  TRY_OUT: "Try Out",
  CBT: "CBT",
  MATERI: "Materi (Mindmap/Video)",
  LIVE_CLASS: "Live Class / Private",
  TOKEN: "Token / Poin",
};
const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABEL) as PackageCategory[];

const PackageSchema = Yup.object().shape({
  name: Yup.string().trim().required("Nama paket wajib"),
  description: Yup.string(),
  category: Yup.string().oneOf(CATEGORY_OPTIONS).required(),
  price: Yup.number().min(0).required(),
  originalPrice: Yup.number().min(0).nullable(),
  points: Yup.number().min(1).required(),
  bonus: Yup.number().min(0),
  durationDays: Yup.number().min(0).nullable(),
});

type Draft = Omit<CreditPackage, "id" | "order"> & { id?: string };

const EMPTY: Draft = {
  name: "",
  description: "",
  category: "TOKEN",
  price: 0,
  points: 0,
  bonus: 0,
  popular: false,
  features: [],
};

export default function AdminPackagesPage() {
  const { list, upsert, remove } = useCreditPackages();
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleteFor, setDeleteFor] = useState<CreditPackage | null>(null);

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Paket Harga
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Kelola paket poin — harga, jumlah poin, bonus, dan flag populer.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<NiPlus size="medium" />}
            onClick={() => setEditing({ ...EMPTY })}
          >
            Paket Baru
          </Button>
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        {list.length === 0 ? (
          <Grid size={12}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 5 }}>
                <Typography variant="body2" className="text-text-secondary">
                  Belum ada paket. Buat paket pertama.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          list.map((pkg) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg.id}>
              <Card
                sx={{
                  height: "100%",
                  borderColor: pkg.popular ? "primary.main" : "divider",
                  borderWidth: pkg.popular ? 2 : 1,
                }}
                variant={pkg.popular ? "elevation" : "outlined"}
              >
                <CardContent className="flex flex-col gap-2">
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Paket {pkg.points} pts</Typography>
                    {pkg.popular && <Chip size="small" label="Populer" color="primary" />}
                  </Stack>
                  <Typography variant="h4">{formatIDR(pkg.price)}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" className="text-warning font-semibold">
                      {pkg.points} pts
                    </Typography>
                    {pkg.bonus ? (
                      <Chip size="small" label={`+${pkg.bonus} bonus`} color="warning" variant="outlined" />
                    ) : null}
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}
                  >
                    <Button
                      variant="surface"
                      color="grey"
                      size="tiny"
                      startIcon={<NiPen size="small" />}
                      onClick={() => setEditing({ ...pkg })}
                      fullWidth
                    >
                      Edit
                    </Button>
                    <IconButton size="small" color="error" onClick={() => setDeleteFor(pkg)}>
                      <NiBinEmpty size="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Edit/Create dialog */}
      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing?.id ? "Edit Paket" : "Paket Baru"}</DialogTitle>
        <DialogContent>
          {editing && (
            <Formik
              initialValues={editing}
              validationSchema={PackageSchema}
              enableReinitialize
              onSubmit={(values, { setSubmitting }) => {
                const existing = editing.id ? list.find((p) => p.id === editing.id) : undefined;
                const nextOrder = existing?.order ?? (list.length ? Math.max(...list.map((p) => p.order)) + 1 : 1);
                const pkg: CreditPackage = {
                  id: editing.id ?? `pkg_${Date.now()}`,
                  name: values.name.trim(),
                  description: (values.description ?? "").trim(),
                  category: values.category,
                  price: Number(values.price),
                  originalPrice: values.originalPrice ? Number(values.originalPrice) : undefined,
                  points: Number(values.points),
                  bonus: Number(values.bonus) || undefined,
                  popular: values.popular,
                  order: nextOrder,
                  features: values.features ?? [],
                  durationDays: values.durationDays ? Number(values.durationDays) : undefined,
                };
                upsert(pkg);
                enqueueSnackbar(`Paket ${pkg.points} pts tersimpan`, { variant: "success" });
                setSubmitting(false);
                setEditing(null);
              }}
            >
              {({ values, handleChange, handleBlur, errors, touched, submitForm, isSubmitting, setFieldValue }) => (
                <Form>
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField
                      fullWidth
                      label="Nama paket"
                      name="name"
                      placeholder="cth. Paket Try Out Jawara"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                    <TextField
                      fullWidth
                      label="Deskripsi singkat"
                      name="description"
                      multiline
                      rows={2}
                      placeholder="1-2 kalimat menjelaskan apa yang didapat siswa"
                      value={values.description ?? ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <TextField
                      fullWidth
                      select
                      label="Kategori"
                      name="category"
                      value={values.category}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <MenuItem key={c} value={c}>
                          {CATEGORY_LABEL[c]}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Harga (IDR)"
                          name="price"
                          value={values.price}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.price && Boolean(errors.price)}
                          helperText={touched.price && errors.price}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Harga coret (opsional)"
                          name="originalPrice"
                          placeholder="Untuk promo strikethrough"
                          value={values.originalPrice ?? ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Poin"
                          name="points"
                          value={values.points}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.points && Boolean(errors.points)}
                          helperText={touched.points && errors.points}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Bonus Poin (opsional)"
                          name="bonus"
                          value={values.bonus ?? 0}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </Grid>
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Durasi akses (hari, opsional)"
                          name="durationDays"
                          placeholder="Kosongkan = tanpa batas"
                          value={values.durationDays ?? ""}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </Grid>
                    </Grid>
                    <TextField
                      fullWidth
                      label="Fitur paket (1 baris = 1 fitur)"
                      multiline
                      rows={4}
                      placeholder={"10x Try Out lengkap\nPembahasan video tiap soal\nRanking nasional realtime"}
                      value={(values.features ?? []).join("\n")}
                      onChange={(e) => {
                        const feats = e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        setFieldValue("features", feats);
                      }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!values.popular}
                          onChange={(e) => handleChange({ target: { name: "popular", value: e.target.checked } })}
                        />
                      }
                      label="Tandai sebagai Populer"
                    />
                  </Stack>
                  <DialogActions sx={{ px: 0, pt: 2 }}>
                    <Button variant="paper" color="grey" onClick={() => setEditing(null)}>
                      Batal
                    </Button>
                    <Button variant="contained" color="primary" onClick={submitForm} disabled={isSubmitting}>
                      {isSubmitting ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </DialogActions>
                </Form>
              )}
            </Formik>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteFor} onClose={() => setDeleteFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Paket?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Paket {deleteFor?.points} pts akan dihapus. Paket ini tidak akan muncul di student dashboard.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setDeleteFor(null)}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (!deleteFor) return;
              remove(deleteFor.id);
              enqueueSnackbar(`Paket ${deleteFor.points} pts dihapus`, { variant: "success" });
              setDeleteFor(null);
            }}
          >
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
