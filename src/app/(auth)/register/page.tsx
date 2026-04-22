"use client";

import { useFormik } from "formik";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import * as yup from "yup";

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Input,
  InputAdornment,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";

import EduDocLogo from "@/components/auth/EduDocLogo";
import GoogleButton from "@/components/auth/GoogleButton";
import NiArrowRight from "@/icons/nexture/ni-arrow-right";
import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiEmail from "@/icons/nexture/ni-email";
import NiEyeClose from "@/icons/nexture/ni-eye-close";
import NiEyeOpen from "@/icons/nexture/ni-eye-open";
import NiLock from "@/icons/nexture/ni-lock";
import NiPhone from "@/icons/nexture/ni-phone";
import NiUser from "@/icons/nexture/ni-user";
import { setCurrentUserOnce } from "@/lib/current-user";
import { SUPABASE_CONFIGURED, getSupabase } from "@/lib/supabase";

const registerSchema = yup.object({
  name: yup.string().required("Nama wajib diisi").min(3, "Minimal 3 karakter"),
  email: yup
    .string()
    .required("Email wajib diisi")
    .email("Format email tidak valid"),
  phone: yup
    .string()
    .required("Nomor HP wajib diisi")
    .min(8, "Terlalu pendek")
    .matches(/^[0-9+\-\s]+$/, "Hanya angka, +, spasi, dan strip"),
  password: yup
    .string()
    .required("Password wajib diisi")
    .min(6, "Minimal 6 karakter"),
  confirm: yup
    .string()
    .required("Konfirmasi password wajib diisi")
    .oneOf([yup.ref("password")], "Password tidak cocok"),
  terms: yup.boolean().oneOf([true], "Kamu harus menyetujui Syarat & Ketentuan"),
});

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  const fromGoogle = searchParams.get("fromGoogle") === "1";
  const prefillEmail = searchParams.get("email") ?? "";
  const prefillName = searchParams.get("name") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: prefillName,
      email: prefillEmail,
      phone: "",
      password: "",
      confirm: "",
      terms: false,
    },
    validationSchema: registerSchema,
    validateOnBlur: false,
    validateOnMount: false,
    onSubmit: async (values) => {
      if (!SUPABASE_CONFIGURED) {
        setCurrentUserOnce({
          name: values.name,
          email: values.email,
          phone: values.phone,
        });
        enqueueSnackbar("Akun dibuat (mode demo). Silakan masuk.", {
          variant: "success",
        });
        router.push("/login");
        return;
      }

      const supa = getSupabase();
      if (!supa) {
        enqueueSnackbar("Supabase belum siap", { variant: "error" });
        return;
      }

      if (fromGoogle) {
        const { error: pwErr } = await supa.auth.updateUser({
          password: values.password,
        });
        if (pwErr) {
          enqueueSnackbar("Gagal set password: " + pwErr.message, {
            variant: "error",
          });
          return;
        }
        const { data: sess } = await supa.auth.getSession();
        const uid = sess.session?.user.id;
        if (uid) {
          await supa
            .from("profiles")
            .update({
              name: values.name,
              phone: values.phone,
            })
            .eq("id", uid);
        }
        setCurrentUserOnce({
          name: values.name,
          email: values.email,
          phone: values.phone,
        });
        enqueueSnackbar("Profil lengkap! Selamat datang di EduDoc", {
          variant: "success",
        });
        router.push("/student/dashboard");
        return;
      }

      const res = await supa.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            phone: values.phone,
            role: "STUDENT",
            tier: "STARTER",
          },
        },
      });
      if (res.error) {
        const msg = res.error.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered")) {
          enqueueSnackbar("Email sudah terdaftar — silakan login", {
            variant: "error",
          });
        } else {
          enqueueSnackbar(res.error.message, { variant: "error" });
        }
        return;
      }

      if (!res.data.session) {
        enqueueSnackbar(
          "Akun dibuat! Cek inbox Gmail kamu untuk klik link konfirmasi.",
          { variant: "success", autoHideDuration: 6000 }
        );
        router.push("/login");
        return;
      }

      setCurrentUserOnce({
        name: values.name,
        email: values.email,
        phone: values.phone,
      });
      enqueueSnackbar("Akun berhasil dibuat & login!", { variant: "success" });
      router.push("/student/dashboard");
    },
  });

  useEffect(() => {
    if (prefillEmail) formik.setFieldValue("email", prefillEmail);
    if (prefillName) formik.setFieldValue("name", prefillName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillEmail, prefillName]);

  const handleGoogle = async () => {
    const supa = getSupabase();
    if (!supa) {
      enqueueSnackbar("Supabase belum dikonfigurasi", { variant: "error" });
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supa.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) enqueueSnackbar(error.message, { variant: "error" });
  };

  return (
    <Box className="flex min-h-screen w-full items-center justify-center p-4">
      <Paper
        elevation={3}
        className="bg-foreground outline-line max-h-full w-lg max-w-full rounded-4xl py-14 outline -outline-offset-1 backdrop-blur-sm"
      >
        <Box className="flex max-h-[calc(100dvh-7rem)] flex-col gap-4 overflow-y-auto px-8 sm:px-14">
          <Box className="mb-8 flex justify-center">
            <EduDocLogo size="lg" />
          </Box>

          <Box className="flex flex-col gap-1">
            <Typography variant="h1" component="h1">
              {fromGoogle ? "Lengkapi Profil" : "Daftar Gratis"}
            </Typography>
            <Typography variant="body1" className="text-text-secondary">
              {fromGoogle
                ? "Profil kamu belum lengkap — isi data berikut untuk lanjut."
                : "Gratis selamanya — mulai dengan pre-test tanpa biaya."}
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            className="mt-4 flex flex-col gap-4"
          >
            <FormControl className="outlined" variant="standard" size="small">
              <FormLabel component="label" className="flex flex-row">
                Nama Lengkap
                {formik.touched.name && formik.errors.name && (
                  <InputErrorTooltip title={formik.errors.name} />
                )}
              </FormLabel>
              <Input
                id="name"
                name="name"
                placeholder="Sesuai KTP / rapor"
                startAdornment={
                  <InputAdornment position="start">
                    <NiUser size="medium" className="text-text-secondary" />
                  </InputAdornment>
                }
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </FormControl>

            <FormControl className="outlined" variant="standard" size="small">
              <FormLabel component="label" className="flex flex-row">
                Email
                {formik.touched.email && formik.errors.email && (
                  <InputErrorTooltip title={formik.errors.email} />
                )}
              </FormLabel>
              <Input
                id="email"
                name="email"
                placeholder="nama@email.com"
                type="email"
                disabled={fromGoogle}
                startAdornment={
                  <InputAdornment position="start">
                    <NiEmail size="medium" className="text-text-secondary" />
                  </InputAdornment>
                }
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </FormControl>

            <FormControl className="outlined" variant="standard" size="small">
              <FormLabel component="label" className="flex flex-row">
                Nomor HP
                {formik.touched.phone && formik.errors.phone && (
                  <InputErrorTooltip title={formik.errors.phone} />
                )}
              </FormLabel>
              <Input
                id="phone"
                name="phone"
                placeholder="0812-3456-7890"
                startAdornment={
                  <InputAdornment position="start">
                    <NiPhone size="medium" className="text-text-secondary" />
                  </InputAdornment>
                }
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </FormControl>

            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormControl className="outlined" variant="standard" size="small">
                <FormLabel component="label" className="flex flex-row">
                  Password
                  {formik.touched.password && formik.errors.password && (
                    <InputErrorTooltip title={formik.errors.password} />
                  )}
                </FormLabel>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  startAdornment={
                    <InputAdornment position="start">
                      <NiLock size="medium" className="text-text-secondary" />
                    </InputAdornment>
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((v) => !v)} edge="end">
                        {showPassword ? (
                          <NiEyeClose size="small" className="text-text-secondary" />
                        ) : (
                          <NiEyeOpen size="small" className="text-text-secondary" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </FormControl>

              <FormControl className="outlined" variant="standard" size="small">
                <FormLabel component="label" className="flex flex-row">
                  Konfirmasi
                  {formik.touched.confirm && formik.errors.confirm && (
                    <InputErrorTooltip title={formik.errors.confirm} />
                  )}
                </FormLabel>
                <Input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  startAdornment={
                    <InputAdornment position="start">
                      <NiLock size="medium" className="text-text-secondary" />
                    </InputAdornment>
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end">
                        {showConfirm ? (
                          <NiEyeClose size="small" className="text-text-secondary" />
                        ) : (
                          <NiEyeOpen size="small" className="text-text-secondary" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                  value={formik.values.confirm}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </FormControl>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.terms}
                  onChange={(e) => formik.setFieldValue("terms", e.target.checked)}
                  name="terms"
                />
              }
              label={
                <Typography variant="body2" className="text-text-secondary">
                  Saya setuju dengan{" "}
                  <Link href="#" className="link-primary link-underline-hover">
                    Syarat & Ketentuan
                  </Link>{" "}
                  dan{" "}
                  <Link href="#" className="link-primary link-underline-hover">
                    Kebijakan Privasi
                  </Link>{" "}
                  EduDoc.
                </Typography>
              }
            />
            {formik.touched.terms && formik.errors.terms && (
              <Typography variant="caption" color="error">
                {formik.errors.terms}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={formik.isSubmitting}
              endIcon={
                formik.isSubmitting ? (
                  <CircularProgress size={16} />
                ) : (
                  <NiArrowRight size="medium" />
                )
              }
            >
              {formik.isSubmitting
                ? "Memproses..."
                : fromGoogle
                ? "Simpan & Lanjut"
                : "Daftar Gratis"}
            </Button>
          </Box>

          {!fromGoogle && (
            <>
              <Divider className="text-text-secondary my-2 text-sm">atau</Divider>
              <GoogleButton label="Daftar dengan Google" onClick={handleGoogle} />
            </>
          )}

          <Typography variant="body2" className="text-text-secondary text-center mt-4">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="link-primary link-underline-hover font-semibold"
            >
              Masuk di sini
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

function InputErrorTooltip({ title }: { title: string }) {
  return (
    <Box className="relative">
      <Tooltip title={title} arrow className="absolute -top-1.5">
        <Button
          startIcon={<NiCrossSquare size="small" />}
          color="error"
          size="small"
          className="group icon-only bg-transparent! outline-0!"
        />
      </Tooltip>
    </Box>
  );
}
