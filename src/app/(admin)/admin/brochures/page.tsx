"use client";

import { useState } from "react";
import { Formik, Form } from "formik";
import { useSnackbar } from "notistack";
import * as Yup from "yup";

import {
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
import NiPen from "@/icons/nexture/ni-pen";
import NiPlus from "@/icons/nexture/ni-plus";
import { useBrochures, type Brochure } from "@/lib/brochures-store";

const Schema = Yup.object({
  title: Yup.string().trim().required("Judul wajib"),
  subtitle: Yup.string().trim(),
  image: Yup.string().trim().url("URL tidak valid").required("URL gambar wajib"),
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
          <Button variant="contained" color="primary" startIcon={<NiPlus size="medium" />} onClick={() => setEditing({ ...EMPTY })}>
            Slide Baru
          </Button>
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        {list.length === 0 ? (
          <Grid size={12}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 5 }}>
                <Typography variant="body2" className="text-text-secondary">Belum ada slide.</Typography>
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
                    <Typography variant="caption" className="text-text-secondary">{b.subtitle}</Typography>
                  )}
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
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
            {({ values, handleChange, handleBlur, errors, touched, submitForm }) => (
              <Form>
                <DialogContent>
                  <Stack spacing={2}>
                    <TextField fullWidth label="Judul" name="title" value={values.title} onChange={handleChange} onBlur={handleBlur} error={touched.title && !!errors.title} helperText={touched.title && errors.title} />
                    <TextField fullWidth label="Subtitle (opsional)" name="subtitle" value={values.subtitle} onChange={handleChange} />
                    <TextField fullWidth label="URL Gambar" name="image" value={values.image} onChange={handleChange} onBlur={handleBlur} error={touched.image && !!errors.image} helperText={touched.image && errors.image} placeholder="https://..." />
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button variant="paper" color="grey" onClick={() => setEditing(null)}>Batal</Button>
                  <Button variant="contained" color="primary" onClick={submitForm}>Simpan</Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        )}
      </Dialog>

      <Dialog open={!!deleteFor} onClose={() => setDeleteFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Slide?</DialogTitle>
        <DialogContent><Typography variant="body2">Slide <strong>{deleteFor?.title}</strong> akan dihapus.</Typography></DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setDeleteFor(null)}>Batal</Button>
          <Button variant="contained" color="error" onClick={() => { if (deleteFor) { remove(deleteFor.id); enqueueSnackbar("Dihapus", { variant: "success" }); setDeleteFor(null); } }}>Ya, Hapus</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
