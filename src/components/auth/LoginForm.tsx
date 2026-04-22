"use client";

import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight, ChevronLeft, Lock, Mail, Shield, Smartphone, UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import OtpInput from "./OtpInput";
import { sleep } from "@/lib/utils";
import { useRole } from "@/lib/role-context";
import { setCurrentUserOnce } from "@/lib/current-user";
import {
  findUserByEmail,
  updateUserByEmail,
  type DeactivationReason,
} from "@/lib/users-store";
import FirstLoginModal from "./FirstLoginModal";
import type { Role } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";
import { signInEmail, touchLastLogin } from "@/lib/auth-client";

const ROLE_DASHBOARD: Record<Role, string> = {
  STUDENT: "/student/dashboard",
  TEACHER: "/teacher/dashboard",
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/super-admin/dashboard",
};

const FIRST_LOGIN_KEY_PREFIX = "edudoc.first_login_ack_";
const INACTIVITY_MS = 90 * 24 * 60 * 60 * 1000;

const isEmail = (v: string) => /@/.test(v);
const isPhone = (v: string) => /^[+\s\-0-9]{8,}$/.test(v);

const credSchema = z.object({
  identifier: z
    .string()
    .min(3, "Isi email atau nomor HP")
    .refine(
      (v) => isEmail(v) || isPhone(v),
      "Format tidak valid — gunakan email atau nomor HP"
    ),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type CredData = z.infer<typeof credSchema>;
type Step = "credentials" | "otp";

export default function LoginForm() {
  const router = useRouter();
  const { setRole } = useRole();

  const [step, setStep] = useState<Step>("credentials");
  const [identifier, setIdentifier] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [resending, setResending] = useState(false);
  const [authedRole, setAuthedRole] = useState<Role>("STUDENT");
  const [authedDashboard, setAuthedDashboard] = useState<string>("/student/dashboard");
  const [authedEmail, setAuthedEmail] = useState<string>("");
  const [firstLoginOpen, setFirstLoginOpen] = useState(false);

  const form = useForm<CredData>({
    resolver: zodResolver(credSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const watched = form.watch("identifier") || "";
  const detected: "email" | "phone" | null =
    isEmail(watched) ? "email" : isPhone(watched) ? "phone" : null;

  const onSubmitCreds = form.handleSubmit(async ({ identifier, password }) => {
    const emailForLookup = isEmail(identifier) ? identifier : undefined;

    if (!emailForLookup) {
      toast.error("Saat ini login hanya support email");
      return;
    }

    // 1) Password check
    const res = await signInEmail(emailForLookup, password);
    if (!res.ok) {
      toast.error(res.error ?? "Login gagal. Periksa email & password.");
      return;
    }

    // 2) Profile check + deactivation
    const supa = getSupabase();
    if (!supa) {
      toast.error("Supabase belum siap");
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
            `/account-deactivated?reason=${reason}&email=${encodeURIComponent(emailForLookup)}`
          );
          return;
        }
        setAuthedRole(p.role);
        setAuthedDashboard(ROLE_DASHBOARD[p.role]);
        setCurrentUserOnce({ name: p.name, email: emailForLookup });
      }
    }

    // 3) Additional deactivation check from users-store (legacy / cache)
    const userRecord = findUserByEmail(emailForLookup);
    if (userRecord) {
      const isProtectedRole =
        userRecord.role === "ADMIN" || userRecord.role === "SUPER_ADMIN";
      if (
        !isProtectedRole &&
        !userRecord.deactivated &&
        userRecord.lastLoginAt &&
        Date.now() - new Date(userRecord.lastLoginAt).getTime() > INACTIVITY_MS
      ) {
        updateUserByEmail(emailForLookup, {
          deactivated: true,
          status: "INACTIVE",
          deactivationReason: "INACTIVITY_3_MONTHS",
          deactivatedAt: new Date().toISOString(),
        });
        toast.error("Akun dinonaktifkan karena tidak login > 3 bulan");
        router.push(
          `/account-deactivated?reason=INACTIVITY_3_MONTHS&email=${encodeURIComponent(emailForLookup)}`
        );
        return;
      }
      if (userRecord.deactivated) {
        const reason: DeactivationReason =
          userRecord.deactivationReason ?? "ADMIN_ACTION";
        router.push(
          `/account-deactivated?reason=${reason}&email=${encodeURIComponent(emailForLookup)}`
        );
        return;
      }
    }

    // 4) Sign out password session, trigger real email OTP (2FA)
    await supa.auth.signOut();
    const otp = await supa.auth.signInWithOtp({
      email: emailForLookup,
      options: { shouldCreateUser: false },
    });
    if (otp.error) {
      toast.error("Gagal kirim OTP: " + otp.error.message);
      return;
    }
    setAuthedEmail(emailForLookup);
    setIdentifier(emailForLookup);
    toast.success(`Kode OTP dikirim ke ${emailForLookup}`);
    setStep("otp");
  });

  const finishLogin = async () => {
    setRole(authedRole);
    toast.success(`Berhasil masuk sebagai ${authedRole.replace("_", " ")}!`);
    if (authedEmail) {
      updateUserByEmail(authedEmail, { lastLoginAt: new Date().toISOString() });
    }
    void touchLastLogin();

    // First-login disclaimer untuk STUDENT & TEACHER
    const needsAck =
      (authedRole === "STUDENT" || authedRole === "TEACHER") &&
      authedEmail &&
      typeof window !== "undefined" &&
      !localStorage.getItem(FIRST_LOGIN_KEY_PREFIX + authedEmail);
    if (needsAck) {
      setFirstLoginOpen(true);
      return;
    }
    await sleep(300);
    router.push(authedDashboard);
  };

  const handleFirstLoginContinue = async () => {
    if (authedEmail) {
      localStorage.setItem(FIRST_LOGIN_KEY_PREFIX + authedEmail, "1");
    }
    setFirstLoginOpen(false);
    await sleep(200);
    router.push(authedDashboard);
  };

  const verifyOtp = async () => {
    if (otpValue.length < 8) {
      toast.error("Masukkan 8 digit OTP");
      return;
    }
    setOtpLoading(true);

    const supa = getSupabase();
    if (!supa) {
      setOtpLoading(false);
      toast.error("Supabase tidak siap");
      return;
    }
    const v = await supa.auth.verifyOtp({
      email: authedEmail,
      token: otpValue,
      type: "email",
    });
    if (v.error) {
      setOtpLoading(false);
      toast.error("OTP salah atau sudah kedaluwarsa");
      return;
    }

    setOtpLoading(false);
    await finishLogin();
  };

  const resend = async () => {
    setResending(true);
    const supa = getSupabase();
    if (!supa) {
      setResending(false);
      toast.error("Supabase tidak siap");
      return;
    }
    const r = await supa.auth.signInWithOtp({
      email: authedEmail,
      options: { shouldCreateUser: false },
    });
    setResending(false);
    if (r.error) {
      toast.error("Gagal kirim ulang: " + r.error.message);
      return;
    }
    toast.success(`Kode OTP baru dikirim ke ${authedEmail}`, { icon: "📤" });
  };

  const handleGoogle = async () => {
    const supa = getSupabase();
    if (!supa) {
      toast.error("Supabase belum dikonfigurasi");
      return;
    }
    const t = toast.loading("Menghubungkan ke Google...");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supa.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    toast.dismiss(t);
    if (error) {
      toast.error("Gagal masuk via Google: " + error.message);
      return;
    }
    // Browser akan di-redirect ke Google oleh Supabase
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-4xl text-[var(--color-text)]"
        >
          Masuk ke <span className="italic text-gradient-gold">EduDoc</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-2 text-sm text-[var(--color-text-soft)]"
        >
          {step === "credentials"
            ? "Masuk menggunakan email yang terdaftar."
            : "Verifikasi kode OTP untuk menyelesaikan proses login."}
        </motion.p>
      </div>

      <div className="min-h-[320px]">
        <AnimatePresence mode="wait">
          {step === "credentials" && (
            <motion.div
              key="creds"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <form onSubmit={onSubmitCreds} className="space-y-4">
                <Input
                  label="Email"
                  placeholder="nama@email.com"
                  icon={<UserRound className="w-4 h-4" />}
                  rightSlot={
                    detected === "email" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-indigo-300">
                        <Mail className="w-3 h-3" /> email
                      </span>
                    ) : detected === "phone" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-indigo-300">
                        <Smartphone className="w-3 h-3" /> no hp
                      </span>
                    ) : undefined
                  }
                  {...form.register("identifier")}
                  error={form.formState.errors.identifier?.message}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  {...form.register("password")}
                  error={form.formState.errors.password?.message}
                />
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-[var(--color-text-soft)] cursor-pointer">
                    <input type="checkbox" className="accent-indigo-500" />
                    Ingat saya
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-indigo-300 hover:text-indigo-200 transition"
                  >
                    Lupa password?
                  </Link>
                </div>
                <Button
                  full
                  size="lg"
                  type="submit"
                  loading={form.formState.isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Masuk
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-border)]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[var(--color-bg)] px-3 text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-soft)]">
                    atau
                  </span>
                </div>
              </div>

              <Button
                full
                variant="outline"
                size="lg"
                onClick={handleGoogle}
                leftIcon={
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path fill="#4285F4" d="M21.35 11.1h-9.17v2.93h5.27c-.23 1.26-.94 2.33-2 3.05v2.52h3.24c1.9-1.75 3-4.32 3-7.38 0-.78-.07-1.35-.18-1.92z"/>
                    <path fill="#34A853" d="M12.18 21c2.57 0 4.74-.85 6.32-2.31l-3.24-2.52c-.9.6-2.05.96-3.08.96-2.36 0-4.36-1.6-5.08-3.75H3.8v2.35C5.4 18.83 8.55 21 12.18 21z"/>
                    <path fill="#FBBC04" d="M7.1 13.38a5.5 5.5 0 0 1 0-3.5V7.53H3.8a9 9 0 0 0 0 7.93z"/>
                    <path fill="#EA4335" d="M12.18 6.88c1.4 0 2.65.48 3.63 1.42l2.72-2.72C16.92 4.02 14.74 3 12.18 3 8.55 3 5.4 5.17 3.8 8.53l3.3 2.35c.72-2.15 2.72-3.99 5.08-3.99z"/>
                  </svg>
                }
              >
                Lanjutkan dengan Google
              </Button>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <button
                type="button"
                onClick={() => {
                  setOtpValue("");
                  setStep("credentials");
                }}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
              >
                <ChevronLeft className="w-3 h-3" /> Ganti akun / ulangi
              </button>

              <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-transparent p-4">
                <div className="flex items-center gap-2 text-indigo-200">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-widest">
                    Verifikasi 2 Langkah
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text)]">
                  Kami telah mengirim 8 digit kode ke{" "}
                  <span className="font-semibold">{identifier}</span>
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                  Via Email · kode berlaku 5 menit
                </p>
              </div>

              <OtpInput
                length={8}
                value={otpValue}
                onChange={setOtpValue}
                onComplete={(code) => {
                  setOtpValue(code);
                  setTimeout(() => verifyOtp(), 100);
                }}
              />

              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-soft)]">
                  Tidak menerima kode?
                </span>
                <button
                  type="button"
                  onClick={resend}
                  disabled={resending}
                  className="text-indigo-300 hover:text-indigo-200 disabled:opacity-50"
                >
                  {resending ? "Mengirim..." : "Kirim ulang"}
                </button>
              </div>

              <Button
                full
                size="lg"
                onClick={verifyOtp}
                loading={otpLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Verifikasi & Masuk
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FirstLoginModal
        open={firstLoginOpen}
        userName={identifier ? identifier.split("@")[0] : undefined}
        onContinue={handleFirstLoginContinue}
      />
    </div>
  );
}
