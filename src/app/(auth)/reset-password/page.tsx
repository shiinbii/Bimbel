"use client";

import { useFormik } from "formik";
import { useRouter } from "next/navigation";
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
  IconButton,
  Input,
  InputAdornment,
  LinearProgress,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";

import EduDocLogo from "@/components/auth/EduDocLogo";
import NiArrowRight from "@/icons/nexture/ni-arrow-right";
import NiCheck from "@/icons/nexture/ni-check";
import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiEyeClose from "@/icons/nexture/ni-eye-close";
import NiEyeOpen from "@/icons/nexture/ni-eye-open";
import NiLock from "@/icons/nexture/ni-lock";
import { getSupabase, SUPABASE_CONFIGURED } from "@/lib/supabase";

const schema = yup.object({
  password: yup
    .string()
    .required("Password baru wajib diisi")
    .min(8, "Minimal 8 karakter")
    .matches(/[A-Z]/, "Harus mengandung minimal 1 huruf besar")
    .matches(/[0-9]/, "Harus mengandung minimal 1 angka"),
  confirm: yup
    .string()
    .required("Konfirmasi wajib diisi")
    .oneOf([yup.ref("password")], "Konfirmasi tidak cocok"),
});

function scoreStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const formik = useFormik({
    initialValues: { password: "", confirm: "" },
    validationSchema: schema,
    validateOnBlur: false,
    validateOnMount: false,
    onSubmit: async ({ password }) => {
      if (!SUPABASE_CONFIGURED) {
        enqueueSnackbar("Password berhasil diganti (demo)", {
          variant: "success",
        });
        setDone(true);
        return;
      }
      const supa = getSupabase();
      if (!supa) {
        enqueueSnackbar("Supabase belum siap", { variant: "error" });
        return;
      }
      const { error } = await supa.auth.updateUser({ password });
      if (error) {
        enqueueSnackbar(error.message, { variant: "error" });
        return;
      }
      enqueueSnackbar("Password berhasil diganti", { variant: "success" });
      setDone(true);
    },
  });

  const strength = scoreStrength(formik.values.password);
  const strengthPct = (strength / 5) * 100;

  return (
    <Box className="flex min-h-screen w-full items-center justify-center p-4">
      <Paper
        elevation={3}
        className="bg-foreground outline-line w-md max-w-full rounded-4xl py-14 outline -outline-offset-1 backdrop-blur-sm"
      >
        <Box className="flex flex-col gap-6 px-8 sm:px-14">
          <Box className="flex justify-center">
            <EduDocLogo size="lg" />
          </Box>

          <Box className="flex flex-col gap-1 text-center">
            <Typography variant="h1" component="h1">
              Password Baru
            </Typography>
            <Typography variant="body2" className="text-text-secondary">
              Pastikan password kuat — minimal 8 karakter, 1 huruf besar, 1 angka.
            </Typography>
          </Box>

          {!done ? (
            <Box component="form" onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
              <FormControl className="outlined" variant="standard" size="small">
                <FormLabel component="label" className="flex flex-row">
                  Password Baru
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

              {formik.values.password.length > 0 && (
                <Box className="flex flex-col gap-1">
                  <LinearProgress
                    variant="determinate"
                    value={strengthPct}
                    color={strength <= 2 ? "error" : strength <= 3 ? "warning" : "success"}
                  />
                  <Typography variant="caption" className="text-text-secondary">
                    Kekuatan password:{" "}
                    <strong>
                      {strength <= 1
                        ? "Sangat lemah"
                        : strength === 2
                          ? "Lemah"
                          : strength === 3
                            ? "Cukup"
                            : strength === 4
                              ? "Kuat"
                              : "Sangat kuat"}
                    </strong>
                  </Typography>
                </Box>
              )}

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
                  type={showPassword ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  startAdornment={
                    <InputAdornment position="start">
                      <NiLock size="medium" className="text-text-secondary" />
                    </InputAdornment>
                  }
                  value={formik.values.confirm}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={formik.isSubmitting}
                endIcon={formik.isSubmitting ? <CircularProgress size={16} /> : <NiArrowRight size="medium" />}
              >
                {formik.isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
              </Button>
            </Box>
          ) : (
            <>
              <Alert severity="success" icon={<NiCheck size="medium" />}>
                <Typography variant="subtitle2">Password Diganti</Typography>
                <Typography variant="body2">Silakan masuk dengan password baru.</Typography>
              </Alert>
              <Button
                variant="contained"
                fullWidth
                onClick={() => router.push("/login")}
                endIcon={<NiArrowRight size="medium" />}
              >
                Masuk Sekarang
              </Button>
            </>
          )}
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
