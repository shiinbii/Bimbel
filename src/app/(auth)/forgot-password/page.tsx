"use client";

import { useFormik } from "formik";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useState } from "react";
import * as yup from "yup";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormLabel,
  Input,
  InputAdornment,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";

import EduDocLogo from "@/components/auth/EduDocLogo";
import NiArrowRight from "@/icons/nexture/ni-arrow-right";
import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiEmail from "@/icons/nexture/ni-email";
import { SUPABASE_CONFIGURED, getSupabase } from "@/lib/supabase";

const schema = yup.object({
  email: yup
    .string()
    .required("Email wajib diisi")
    .email("Format email tidak valid"),
});

export default function ForgotPasswordPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: schema,
    validateOnBlur: false,
    validateOnMount: false,
    onSubmit: async ({ email }) => {
      if (!SUPABASE_CONFIGURED) {
        setSentTo(email);
        enqueueSnackbar(`Tautan reset password dikirim ke ${email} (demo)`, {
          variant: "success",
        });
        return;
      }
      const supa = getSupabase();
      if (!supa) {
        enqueueSnackbar("Supabase belum siap", { variant: "error" });
        return;
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supa.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });
      if (error) {
        enqueueSnackbar(error.message, { variant: "error" });
        return;
      }
      setSentTo(email);
      enqueueSnackbar(`Tautan reset password dikirim ke ${email}`, {
        variant: "success",
      });
    },
  });

  return (
    <Box className="flex min-h-screen w-full items-center justify-center p-4">
      <Paper
        elevation={3}
        className="bg-foreground outline-line max-w-full w-md rounded-4xl py-14 outline -outline-offset-1 backdrop-blur-sm"
      >
        <Box className="flex flex-col gap-6 px-8 sm:px-14">
          <Box className="flex justify-center">
            <EduDocLogo size="lg" />
          </Box>

          <Box className="flex flex-col gap-1 text-center">
            <Typography variant="h1" component="h1">
              Lupa Password
            </Typography>
            <Typography variant="body2" className="text-text-secondary">
              Kami akan mengirim tautan reset ke email kamu.
            </Typography>
          </Box>

          {!sentTo ? (
            <Box
              component="form"
              onSubmit={formik.handleSubmit}
              className="flex flex-col gap-4"
            >
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
                  type="email"
                  placeholder="nama@email.com"
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
                {formik.isSubmitting ? "Mengirim..." : "Kirim Tautan Reset"}
              </Button>

              <Typography
                variant="caption"
                className="text-text-secondary text-center"
              >
                Jika akun terdaftar, kamu akan menerima tautan reset dalam 1–2 menit.
              </Typography>
            </Box>
          ) : (
            <Alert severity="success">
              <Typography variant="subtitle2">Tautan Terkirim</Typography>
              <Typography variant="body2">
                Tautan reset password telah dikirim ke <strong>{sentTo}</strong>.
                Cek inbox (atau folder spam) dan buka link untuk mengganti password.
              </Typography>
            </Alert>
          )}

          <Typography variant="body2" className="text-text-secondary text-center">
            Ingat password-mu?{" "}
            <Link
              href="/login"
              className="link-primary link-underline-hover font-semibold"
            >
              Masuk sekarang
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
