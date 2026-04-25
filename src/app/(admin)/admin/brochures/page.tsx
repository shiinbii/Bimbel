"use client";

import { Form, Formik, type FormikProps } from "formik";
import { useSnackbar } from "notistack";
import { useRef, useState } from "react";
import * as Yup from "yup";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import NiArrowLeft from "@/icons/nexture/ni-arrow-left";
import NiArrowRight from "@/icons/nexture/ni-arrow-right";
import NiBinEmpty from "@/icons/nexture/ni-bin-empty";
import NiCamera from "@/icons/nexture/ni-camera";
import NiPen from "@/icons/nexture/ni-pen";
import NiPlus from "@/icons/nexture/ni-plus";
import { type Brochure, useBrochures } from "@/lib/brochures-store";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const Schema = Yup.object({
  title: Yup.string().trim().min(2, "Minimal 2 karakter").required("Judul wajib diisi"),
  subtitle: Yup.string().trim(),
  image: Yup.string().required("Foto wajib diupload"),
});

type Draft = Omit<Brochure, "id" | "order"> & { id?: string };

const EMPTY: Draft = { title: "", subtitle: "", image: "" };

export default function AdminBrochuresPage() {
  const { list, add, update, remove, move } = useBrochures();
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleteFor, setDeleteFor] = useState<Brochure | null>(null);

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Slider Alumni
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Kelola slider gambar alumni yang tampil di landing page.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<NiPlus size="medium" />}
            onClick={() => setEditing({ ...EMPTY })}
          >
            Slide Baru
          </Button>
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        {list.length === 0 ? (
          <Grid size={12}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 5 }}>
                <Typography variant="body2" className="text-text-secondary">
                  Belum ada slide.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          list.map((b, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={b.id}>
              <Card sx={{ height: "100%" }}>
                <CardMedia component="img" height={180} image={b.image} alt={b.title} sx={{ objectFit: "cover" }} />
                <CardContent className="flex flex-col gap-2">
                  <Typography variant="subtitle1">{b.title}</Typography>
                  {b.subtitle && (
                    <Typography variant="caption" className="text-text-secondary">
                      {b.subtitle}
                    </Typography>
                  )}
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ mt: 1, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}
                  >
                    <IconButton size="small" disabled={i === 0} onClick={() => move(b.id, -1)}>
                      <NiArrowLeft size="small" />
                    </IconButton>
                    <IconButton size="small" disabled={i === list.length - 1} onClick={() => move(b.id, 1)}>
                      <NiArrowRight size="small" />
                    </IconButton>
                    <Box sx={{ flex: 1 }} />
                    <IconButton size="small" onClick={() => setEditing({ ...b })}>
                      <NiPen size="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteFor(b)}>
                      <NiBinEmpty size="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing?.id ? "Edit Slide" : "Slide Baru"}</DialogTitle>
        {editing && (
          <Formik
            initialValues={editing}
            validationSchema={Schema}
            enableReinitialize
            onSubmit={(values) => {
              if (editing.id) {
                update(editing.id, { title: values.title, subtitle: values.subtitle, image: values.image });
                enqueueSnackbar("Slide diupdate", { variant: "success" });
              } else {
                add({ title: values.title, subtitle: values.subtitle, image: values.image });
                enqueueSnackbar("Slide ditambah", { variant: "success" });
              }
              setEditing(null);
            }}
          >
            {(formik) => (
              <BrochureFormBody
                formik={formik}
                onCancel={() => setEditing(null)}
                onInvalidFile={(msg) => enqueueSnackbar(msg, { variant: "error" })}
              />
            )}
          </Formik>
        )}
      </Dialog>

      <Dialog open={!!deleteFor} onClose={() => setDeleteFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Slide?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Slide <strong>{deleteFor?.title}</strong> akan dihapus.
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
              if (deleteFor) {
                remove(deleteFor.id);
                enqueueSnackbar("Dihapus", { variant: "success" });
                setDeleteFor(null);
              }
            }}
          >
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

function BrochureFormBody({
  formik,
  onCancel,
  onInvalidFile,
}: {
  formik: FormikProps<Draft>;
  onCancel: () => void;
  onInvalidFile: (msg: string) => void;
}) {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue, submitForm } = formik;
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onInvalidFile("File harus gambar (PNG/JPG/WebP)");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onInvalidFile("Ukuran maksimal 3MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFieldValue("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const clearImage = () => setFieldValue("image", "");

  return (
    <Form>
      <DialogContent>
        <Grid container spacing={2.5} alignItems="flex-start">
          <Grid size={{ xs: 12, sm: "auto" }}>
            <Stack spacing={1} alignItems="center">
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={values.image || undefined}
                  onClick={onPickFile}
                  sx={{
                    width: 120,
                    height: 120,
                    cursor: "pointer",
                    bgcolor: "action.hover",
                    color: "text.secondary",
                    transition: "opacity .15s",
                    "&:hover": { opacity: 0.85 },
                    "& img": { objectFit: "cover" },
                  }}
                >
                  {!values.image && <NiCamera size="large" />}
                </Avatar>
                {!values.image && (
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={onPickFile}
                    sx={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      bgcolor: "background.paper",
                      boxShadow: 1,
                      "&:hover": { bgcolor: "background.paper" },
                      pointerEvents: "none",
                    }}
                  >
                    <NiCamera size="small" />
                  </IconButton>
                )}
              </Box>
              <Typography variant="caption" className="text-text-secondary" align="center">
                Klik untuk upload
                <br />
                (PNG/JPG, maks 3MB)
              </Typography>
              {values.image && (
                <Button size="tiny" variant="text" color="error" onClick={clearImage}>
                  Hapus foto
                </Button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={onFileChange}
              />
              {touched.image && errors.image && (
                <Typography variant="caption" color="error">
                  {errors.image as string}
                </Typography>
              )}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: "grow" }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Nama Alumni"
                name="title"
                value={values.title}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!(touched.title && errors.title)}
                helperText={(touched.title && errors.title) as string}
                placeholder="Contoh: Naomi Ardelia"
              />
              <TextField
                fullWidth
                label="Keterangan (opsional)"
                name="subtitle"
                value={values.subtitle}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Contoh: Lolos Kedokteran UI 2025"
                helperText="Tampil di bawah nama pada slider"
              />
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="paper" color="grey" onClick={onCancel}>
          Batal
        </Button>
        <Button variant="contained" color="primary" onClick={submitForm}>
          Simpan
        </Button>
      </DialogActions>
    </Form>
  );
}
