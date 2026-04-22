"use client";

import { useFormik } from "formik";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";
import * as yup from "yup";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputAdornment,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { MuiOtpInput } from "mui-one-time-password-input";

import EduDocLogo from "@/components/auth/EduDocLogo";
import FirstLoginModal from "@/components/auth/FirstLoginModal";
import GoogleButton from "@/components/auth/GoogleButton";
import { landingPathFor } from "@/config/roles";
import NiArrowRight from "@/icons/nexture/ni-arrow-right";
import NiCrossSquare from "@/icons/nexture/ni-cross-square";
import NiEyeClose from "@/icons/nexture/ni-eye-close";
import NiEyeOpen from "@/icons/nexture/ni-eye-open";
import NiLock from "@/icons/nexture/ni-lock";
import NiShield from "@/icons/nexture/ni-shield";
import NiUser from "@/icons/nexture/ni-user";
import { signInEmail, touchLastLogin } from "@/lib/auth-client";
import { setCurrentUserOnce } from "@/lib/current-user";
import { useRole } from "@/lib/role-context";
import { getSupabase } from "@/lib/supabase";
import type { Role } from "@/lib/types";
import {
  findUserByEmail,
  updateUserByEmail,
  type DeactivationReason,
} from "@/lib/users-store";

const FIRST_LOGIN_KEY_PREFIX = "edudoc.first_login_ack_";
const INACTIVITY_MS = 90 * 24 * 60 * 60 * 1000;

const credentialsSchema = yup.object({
  email: yup
    .string()
    .required("Email wajib diisi")
    .email("Format email tidak valid"),
  password: yup.string().required("Password wajib diisi").min(6, "Minimal 6 karakter"),
});

type Step = "credentials" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const { setRole } = useRole();

  const idleNotifiedRef = useRef(false);
  useEffect(() => {
    if (idleNotifiedRef.current) return;
    const reason = searchParams.get("reason");
    if (reason === "idle") {
      idleNotifiedRef.current = true;
      enqueueSnackbar(
        "Sesi berakhir karena tidak ada aktivitas selama 20 menit.",
        { variant: "warning", autoHideDuration: 5000 }
      );
    } else if (reason === "cold") {
      idleNotifiedRef.current = true;
      enqueueSnackbar(
        "Browser dimulai ulang — silakan login kembali untuk keamanan.",
        { variant: "info", autoHideDuration: 5000 }
      );
    }
  }, [searchParams, enqueueSnackbar]);

  const [step, setStep] = useState<Step>("credentials");
  const [showPassword, setShowPassword] = useState(false);
  const [authedRole, setAuthedRole] = useState<Role>("STUDENT");
  const [authedDashboard, setAuthedDashboard] = useState("/student/dashboard");
  const [authedEmail, setAuthedEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [firstLoginOpen, setFirstLoginOpen] = useState(false);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: credentialsSchema,
    validateOnBlur: false,
    validateOnMount: false,
    onSubmit: async ({ email, password }) => {
      const res = await signInEmail(email, password);
      if (!res.ok) {
        enqueueSnackbar(res.error ?? "Login gagal. Periksa email & password.", {
          variant: "error",
        });
        return;
      }

      const supa = getSupabase();
      if (!supa) {
        enqueueSnackbar("Supabase belum siap", { variant: "error" });
        return;
      }

      const { data: sess } = await supa.auth.getSession();
      const uid = sess.session?.user.id;
      if (uid) {
        const { data: profile } = await supa
          .from("profiles")
          .select("role, deactivated, deactivation_reason, name")
          .eq("id", uid)
          .maybeSingle();
        if (profile) {
          const p = profile as {
            role: Role;
            deactivated: boolean;
            deactivation_reason: string | null;
            name: string;
          };
          if (p.deactivated) {
            const reason = p.deactivation_reason ?? "ADMIN_ACTION";
            await supa.auth.signOut();
            router.push(
              `/account-deactivated?reason=${reason}&email=${encodeURIComponent(email)}`
            );
            return;
          }
          setAuthedRole(p.role);
          setAuthedDashboard(landingPathFor(p.role));
          setCurrentUserOnce({ name: p.name, email });
        }
      }

      const userRecord = findUserByEmail(email);
      if (userRecord) {
        const isProtectedRole =
          userRecord.role === "ADMIN" || userRecord.role === "SUPER_ADMIN";
        if (
          !isProtectedRole &&
          !userRecord.deactivated &&
          userRecord.lastLoginAt &&
          Date.now() - new Date(userRecord.lastLoginAt).getTime() > INACTIVITY_MS
        ) {
          updateUserByEmail(email, {
            deactivated: true,
            status: "INACTIVE",
            deactivationReason: "INACTIVITY_3_MONTHS",
            deactivatedAt: new Date().toISOString(),
          });
          enqueueSnackbar("Akun dinonaktifkan karena tidak login > 3 bulan", {
            variant: "error",
          });
          router.push(
            `/account-deactivated?reason=INACTIVITY_3_MONTHS&email=${encodeURIComponent(email)}`
          );
          return;
        }
        if (userRecord.deactivated) {
          const reason: DeactivationReason =
            userRecord.deactivationReason ?? "ADMIN_ACTION";
          router.push(
            `/account-deactivated?reason=${reason}&email=${encodeURIComponent(email)}`
          );
          return;
        }
      }

      await supa.auth.signOut();
      const otp = await supa.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (otp.error) {
        enqueueSnackbar("Gagal kirim OTP: " + otp.error.message, {
          variant: "error",
        });
        return;
      }

      setAuthedEmail(email);
      enqueueSnackbar(`Kode OTP dikirim ke ${email}`, { variant: "success" });
      setStep("otp");
    },
  });

  const finishLogin = async () => {
    setRole(authedRole);
    enqueueSnackbar(`Berhasil masuk sebagai ${authedRole.replace("_", " ")}!`, {
      variant: "success",
    });
    if (authedEmail) {
      updateUserByEmail(authedEmail, {
        lastLoginAt: new Date().toISOString(),
      });
    }
    void touchLastLogin();

    const needsAck =
      (authedRole === "STUDENT" || authedRole === "TEACHER") &&
      authedEmail &&
      typeof window !== "undefined" &&
      !localStorage.getItem(FIRST_LOGIN_KEY_PREFIX + authedEmail);

    if (needsAck) {
      setFirstLoginOpen(true);
      return;
    }
    router.push(authedDashboard);
  };

  const handleFirstLoginContinue = () => {
    if (authedEmail) {
      localStorage.setItem(FIRST_LOGIN_KEY_PREFIX + authedEmail, "1");
    }
    setFirstLoginOpen(false);
    router.push(authedDashboard);
  };

  const verifyOtp = async () => {
    if (otpValue.length < 6) {
      enqueueSnackbar("Masukkan 6 digit OTP", { variant: "error" });
      return;
    }
    setOtpLoading(true);
    const supa = getSupabase();
    if (!supa) {
      setOtpLoading(false);
      enqueueSnackbar("Supabase tidak siap", { variant: "error" });
      return;
    }
    const v = await supa.auth.verifyOtp({
      email: authedEmail,
      token: otpValue,
      type: "email",
    });
    if (v.error) {
      setOtpLoading(false);
      enqueueSnackbar("OTP salah atau sudah kedaluwarsa", { variant: "error" });
      return;
    }
    setOtpLoading(false);
    await finishLogin();
  };

  const resendOtp = async () => {
    setResending(true);
    const supa = getSupabase();
    if (!supa) {
      setResending(false);
      enqueueSnackbar("Supabase tidak siap", { variant: "error" });
      return;
    }
    const r = await supa.auth.signInWithOtp({
      email: authedEmail,
      options: { shouldCreateUser: false },
    });
    setResending(false);
    if (r.error) {
      enqueueSnackbar("Gagal kirim ulang: " + r.error.message, {
        variant: "error",
      });
      return;
    }
    enqueueSnackbar(`Kode OTP baru dikirim ke ${authedEmail}`, {
      variant: "success",
    });
  };

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
    if (error) {
      enqueueSnackbar("Gagal masuk via Google: " + error.message, {
        variant: "error",
      });
    }
  };

  return (
    <Box className="flex h-dvh min-h-screen w-full items-center justify-center p-4">
      <Paper
        elevation={3}
        className="bg-foreground outline-line max-h-full w-lg max-w-full rounded-4xl py-14 outline -outline-offset-1 backdrop-blur-sm"
      >
        <Box className="flex max-h-[calc(100dvh-9rem)] flex-col gap-4 overflow-y-auto px-8 sm:px-14">
          <Box className="mb-8 flex justify-center">
            <EduDocLogo size="lg" />
          </Box>

          {step === "credentials" ? (
            <Box className="flex flex-col gap-8">
              <Box className="flex flex-col gap-1">
                <Typography variant="h1" component="h1">
                  Masuk
                </Typography>
                <Typography variant="body1" className="text-text-secondary">
                  Gunakan email yang terdaftar di EduDoc untuk melanjutkan.
                </Typography>
              </Box>

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
                    placeholder="nama@email.com"
                    startAdornment={
                      <InputAdornment position="start">
                        <NiUser size="medium" className="text-text-secondary" />
                      </InputAdornment>
                    }
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </FormControl>

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
                    placeholder="••••••••"
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    startAdornment={
                      <InputAdornment position="start">
                        <NiLock size="medium" className="text-text-secondary" />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                        >
                          {showPassword ? (
                            <NiEyeClose size="medium" className="text-text-secondary" />
                          ) : (
                            <NiEyeOpen size="medium" className="text-text-secondary" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>

                <Box className="flex items-center justify-between">
                  <Link
                    href="/forgot-password"
                    className="link-text-secondary link-underline-hover text-sm"
                  >
                    Lupa password?
                  </Link>
                </Box>

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
                  {formik.isSubmitting ? "Memproses..." : "Masuk"}
                </Button>
              </Box>

              <Divider className="text-text-secondary my-0 text-sm">atau</Divider>

              <GoogleButton
                label="Lanjutkan dengan Google"
                onClick={handleGoogle}
              />

              <Typography
                variant="body2"
                className="text-text-secondary text-center"
              >
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="link-primary link-underline-hover font-semibold"
                >
                  Daftar gratis
                </Link>
              </Typography>
            </Box>
          ) : (
            <Box className="flex flex-col gap-6">
              <Box className="flex flex-col gap-1">
                <Typography variant="h2" component="h2">
                  Verifikasi OTP
                </Typography>
                <Typography variant="body2" className="text-text-secondary">
                  Masukkan kode 6 digit yang dikirim ke{" "}
                  <strong>{authedEmail}</strong>
                </Typography>
              </Box>

              <Alert
                severity="info"
                icon={<NiShield size="medium" />}
                className="neutral"
              >
                <Typography variant="subtitle2">Verifikasi 2 Langkah</Typography>
                <Typography variant="caption">
                  Via Email · kode berlaku 5 menit
                </Typography>
              </Alert>

              <MuiOtpInput
                length={6}
                value={otpValue}
                onChange={setOtpValue}
                onComplete={(code) => {
                  setOtpValue(code);
                  setTimeout(() => verifyOtp(), 100);
                }}
                TextFieldsProps={{ size: "small" }}
              />

              <Box className="flex items-center justify-between">
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setOtpValue("");
                    setStep("credentials");
                  }}
                >
                  Ganti akun / ulangi
                </Button>
                <Button
                  variant="text"
                  size="small"
                  disabled={resending}
                  onClick={resendOtp}
                >
                  {resending ? "Mengirim..." : "Kirim ulang"}
                </Button>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={verifyOtp}
                disabled={otpLoading}
                endIcon={
                  otpLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <NiArrowRight size="medium" />
                  )
                }
              >
                {otpLoading ? "Memverifikasi..." : "Verifikasi & Masuk"}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      <FirstLoginModal
        open={firstLoginOpen}
        userName={authedEmail ? authedEmail.split("@")[0] : undefined}
        onContinue={handleFirstLoginContinue}
      />
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
