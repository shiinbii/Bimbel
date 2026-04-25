"use client";

import { Form, Formik } from "formik";
import { useSnackbar } from "notistack";
import { useMemo, useState } from "react";
import * as Yup from "yup";

import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import NiBinEmpty from "@/icons/nexture/ni-bin-empty";
import NiPlus from "@/icons/nexture/ni-plus";
import { useTestimonials } from "@/lib/testimonials-store";
import type { Testimonial } from "@/lib/types";
import { type ManagedUser, useUsersStore } from "@/lib/users-store";

type TestimonialType = "STUDENT" | "TEACHER" | "ALUMNI" | "PARENT" | "OTHER";

const TYPE_OPTIONS: { value: TestimonialType; label: string; roleLabel: string }[] = [
  { value: "STUDENT", label: "Siswa (pilih akun)", roleLabel: "Siswa" },
  { value: "TEACHER", label: "Guru (pilih akun)", roleLabel: "Guru" },
  { value: "ALUMNI", label: "Alumni (isi manual)", roleLabel: "Alumni" },
  { value: "PARENT", label: "Orang Tua (isi manual)", roleLabel: "Orang Tua" },
  { value: "OTHER", label: "Lainnya (isi manual)", roleLabel: "" },
];

const Schema = Yup.object({
  type: Yup.mixed<TestimonialType>().oneOf(["STUDENT", "TEACHER", "ALUMNI", "PARENT", "OTHER"]).required(),
  userId: Yup.string().when("type", {
    is: (v: TestimonialType) => v === "STUDENT" || v === "TEACHER",
    then: (s) => s.required("Pilih akun"),
    otherwise: (s) => s.notRequired(),
  }),
  name: Yup.string().when("type", {
    is: (v: TestimonialType) => v === "STUDENT" || v === "TEACHER",
    then: (s) => s.notRequired(),
    otherwise: (s) => s.trim().min(2, "Minimal 2 karakter").required("Nama wajib diisi"),
  }),
  role: Yup.string().when("type", {
    is: "OTHER",
    then: (s) => s.trim().min(2, "Minimal 2 karakter").required("Isi role/status"),
    otherwise: (s) => s.notRequired(),
  }),
  message: Yup.string().trim().min(10, "Minimal 10 karakter").required("Pesan wajib diisi"),
  rating: Yup.number().min(1).max(5).required(),
});

export default function AdminTestimonialsPage() {
  const { list, add, remove } = useTestimonials();
  const { list: users } = useUsersStore();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [deleteFor, setDeleteFor] = useState<Testimonial | null>(null);

  const studentOptions = useMemo(() => users.filter((u) => u.role === "STUDENT"), [users]);
  const teacherOptions = useMemo(() => users.filter((u) => u.role === "TEACHER"), [users]);

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Testimoni
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Kelola testimoni yang tampil di landing page.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<NiPlus size="medium" />}
            onClick={() => setOpen(true)}
          >
            Tambah Testimoni
          </Button>
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        {list.length === 0 ? (
          <Grid size={12}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 5 }}>
                <Typography variant="body2" className="text-text-secondary">
                  Belum ada testimoni.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          list.map((t) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={t.id}>
              <Card sx={{ height: "100%" }}>
                <CardContent className="flex flex-col gap-2">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar src={t.avatar}>{t.name.charAt(0)}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2">{t.name}</Typography>
                      <Typography variant="caption" className="text-text-secondary">
                        {t.role}
                      </Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => setDeleteFor(t)}>
                      <NiBinEmpty size="small" />
                    </IconButton>
                  </Stack>
                  <Rating value={t.rating} readOnly size="small" />
                  <Typography variant="body2" className="text-text-secondary" sx={{ fontStyle: "italic" }}>
                    &quot;{t.message}&quot;
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Testimoni Baru</DialogTitle>
        <Formik
          initialValues={{
            type: "STUDENT" as TestimonialType,
            userId: "",
            name: "",
            role: "",
            message: "",
            rating: 5,
          }}
          validationSchema={Schema}
          onSubmit={(values, { resetForm }) => {
            const typeInfo = TYPE_OPTIONS.find((o) => o.value === values.type)!;
            let finalName = values.name.trim();
            const finalRole = values.type === "OTHER" ? values.role.trim() : typeInfo.roleLabel;
            let finalAvatar: string | undefined = undefined;

            if (values.type === "STUDENT" || values.type === "TEACHER") {
              const pickedUser = users.find((u) => u.id === values.userId);
              if (!pickedUser) {
                enqueueSnackbar("Akun tidak ditemukan", { variant: "error" });
                return;
              }
              finalName = pickedUser.name;
              finalAvatar = pickedUser.avatar;
            }

            add({
              name: finalName,
              role: finalRole,
              message: values.message,
              rating: Number(values.rating),
              avatar: finalAvatar,
            });
            enqueueSnackbar("Testimoni ditambahkan", { variant: "success" });
            resetForm();
            setOpen(false);
          }}
        >
          {({ values, handleChange, handleBlur, errors, touched, setFieldValue, submitForm, isSubmitting }) => {
            const isStudent = values.type === "STUDENT";
            const isTeacher = values.type === "TEACHER";
            const isManualRole = values.type === "OTHER";
            const isUserPicker = isStudent || isTeacher;
            const userOptions = isStudent ? studentOptions : isTeacher ? teacherOptions : [];

            return (
              <Form>
                <DialogContent>
                  <Stack spacing={2}>
                    <TextField
                      select
                      fullWidth
                      label="Tipe Testimoni"
                      name="type"
                      value={values.type}
                      onChange={(e) => {
                        setFieldValue("type", e.target.value);
                        setFieldValue("userId", "");
                        setFieldValue("name", "");
                        setFieldValue("role", "");
                      }}
                    >
                      {TYPE_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    {isUserPicker ? (
                      <Autocomplete<ManagedUser>
                        options={userOptions}
                        getOptionLabel={(u) => `${u.name} — ${u.email}`}
                        value={userOptions.find((u) => u.id === values.userId) ?? null}
                        onChange={(_, picked) => setFieldValue("userId", picked?.id ?? "")}
                        renderOption={(props, option) => {
                          const { key, ...rest } = props as typeof props & { key: string };
                          return (
                            <Box component="li" key={key} {...rest}>
                              <Avatar src={option.avatar} sx={{ width: 28, height: 28, mr: 1.5 }}>
                                {option.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{option.name}</Typography>
                                <Typography variant="caption" className="text-text-secondary">
                                  {option.email}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={`Pilih akun ${isStudent ? "siswa" : "guru"}`}
                            error={touched.userId && !!errors.userId}
                            helperText={touched.userId && (errors.userId as string)}
                          />
                        )}
                        noOptionsText={
                          userOptions.length === 0 ? `Tidak ada akun ${isStudent ? "siswa" : "guru"}` : "Tidak ketemu"
                        }
                      />
                    ) : (
                      <TextField
                        fullWidth
                        label="Nama"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.name && !!errors.name}
                        helperText={touched.name && errors.name}
                      />
                    )}

                    {isManualRole && (
                      <TextField
                        fullWidth
                        label="Role / Status"
                        name="role"
                        value={values.role}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.role && !!errors.role}
                        helperText={touched.role && errors.role}
                        placeholder="Contoh: Wali Murid SMA, Mitra Perusahaan"
                      />
                    )}

                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      label="Pesan"
                      name="message"
                      value={values.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.message && !!errors.message}
                      helperText={touched.message && errors.message}
                    />
                    <Box>
                      <Typography variant="caption" className="text-text-secondary-dark">
                        Rating
                      </Typography>
                      <Rating value={Number(values.rating)} onChange={(_, v) => setFieldValue("rating", v ?? 1)} />
                    </Box>
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button variant="paper" color="grey" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button variant="contained" color="primary" onClick={submitForm} disabled={isSubmitting}>
                    Simpan
                  </Button>
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Dialog>

      <Dialog open={!!deleteFor} onClose={() => setDeleteFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Hapus Testimoni?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Testimoni dari <strong>{deleteFor?.name}</strong> akan dihapus permanen.
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
