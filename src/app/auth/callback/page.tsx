"use client";

import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";

import { Box, CircularProgress, Paper, Typography } from "@mui/material";

import EduDocLogo from "@/components/auth/EduDocLogo";
import { landingPathFor } from "@/config/roles";
import { setCurrentUserOnce } from "@/lib/current-user";
import { useRole } from "@/lib/role-context";
import { getSupabase } from "@/lib/supabase";
import type { Role } from "@/lib/types";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { setRole } = useRole();
  const [status, setStatus] = useState("Mengonfirmasi session...");

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      enqueueSnackbar("Supabase tidak terkonfigurasi", { variant: "error" });
      router.replace("/login");
      return;
    }

    const finish = async () => {
      let session: Awaited<ReturnType<typeof supa.auth.getSession>>["data"]["session"] = null;
      for (let i = 0; i < 10; i++) {
        const res = await supa.auth.getSession();
        session = res.data.session;
        if (session) break;
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!session) {
        enqueueSnackbar("Session tidak terbentuk. Coba login ulang.", {
          variant: "error",
        });
        router.replace("/login");
        return;
      }

      const uid = session.user.id;
      const email = session.user.email ?? "";
      const meta = session.user.user_metadata ?? {};
      const googleName =
        (meta.full_name as string) ||
        (meta.name as string) ||
        email.split("@")[0];
      const googleAvatar =
        (meta.avatar_url as string) || (meta.picture as string) || undefined;

      setStatus("Memuat profil...");

      let { data: profile } = await supa
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (!profile) {
        await supa.from("profiles").insert({
          id: uid,
          email,
          name: googleName,
          avatar_url: googleAvatar ?? null,
          role: "STUDENT",
          tier: "STARTER",
        });
        const retry = await supa
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .maybeSingle();
        profile = retry.data;
      }

      if (!profile) {
        enqueueSnackbar("Gagal ambil profil", { variant: "error" });
        router.replace("/login");
        return;
      }

      const p = profile as {
        role: Role;
        phone: string | null;
        name: string;
        deactivated: boolean;
        deactivation_reason: string | null;
      };

      if (p.deactivated) {
        const reason = p.deactivation_reason ?? "ADMIN_ACTION";
        await supa.auth.signOut();
        router.replace(
          `/account-deactivated?reason=${reason}&email=${encodeURIComponent(email)}`
        );
        return;
      }

      const incomplete = !p.phone && p.role === "STUDENT";
      if (incomplete) {
        setStatus("Akun baru — lengkapi data...");
        enqueueSnackbar(`Masuk via Google sebagai ${email}. Lengkapi data dulu.`, {
          variant: "info",
        });
        await new Promise((r) => setTimeout(r, 600));
        router.replace(
          `/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(
            p.name
          )}&fromGoogle=1`
        );
        return;
      }

      setCurrentUserOnce({ name: p.name, email });
      setRole(p.role);
      enqueueSnackbar(`Berhasil masuk sebagai ${p.role.replace("_", " ")}!`, {
        variant: "success",
      });
      router.replace(landingPathFor(p.role));
    };

    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box className="flex min-h-screen w-full items-center justify-center p-4">
      <Paper
        elevation={3}
        className="bg-foreground outline-line w-md max-w-full rounded-4xl py-14 outline -outline-offset-1 backdrop-blur-sm"
      >
        <Box className="flex flex-col items-center gap-6 px-8 text-center sm:px-14">
          <EduDocLogo size="lg" />
          <CircularProgress />
          <Box>
            <Typography variant="h5" component="h2">
              {status}
            </Typography>
            <Typography variant="body2" className="text-text-secondary mt-2">
              Mohon tunggu, jangan tutup halaman.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
