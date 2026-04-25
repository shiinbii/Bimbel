"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Alert, Box, Button, Chip, Paper, Typography } from "@mui/material";

import EduDocLogo from "@/components/auth/EduDocLogo";
import NiHeadset from "@/icons/nexture/ni-headset";
import NiHome from "@/icons/nexture/ni-home";
import NiShieldCross from "@/icons/nexture/ni-shield-cross";
import { DEACTIVATION_MESSAGES, type DeactivationReason } from "@/lib/users-store";

function DeactivatedInner() {
  const router = useRouter();
  const params = useSearchParams();
  const reasonParam = (params.get("reason") ?? "ADMIN_ACTION") as DeactivationReason;
  const email = params.get("email") ?? undefined;

  const reasonKey: NonNullable<DeactivationReason> =
    reasonParam === "INACTIVITY_3_MONTHS" || reasonParam === "ZERO_CREDIT" || reasonParam === "ADMIN_ACTION"
      ? reasonParam
      : "ADMIN_ACTION";

  const info = DEACTIVATION_MESSAGES[reasonKey];

  return (
    <Box className="flex min-h-screen w-full items-center justify-center p-4">
      <Paper
        elevation={3}
        className="bg-foreground outline-line w-lg max-w-full rounded-4xl py-14 outline -outline-offset-1 backdrop-blur-sm"
      >
        <Box className="flex flex-col gap-6 px-8 sm:px-14">
          <Box className="flex justify-center">
            <EduDocLogo size="md" />
          </Box>

          <Box className="flex flex-col items-center gap-3 text-center">
            <Box
              className="flex items-center justify-center rounded-2xl"
              sx={{
                width: 56,
                height: 56,
                backgroundColor: "hsl(var(--error) / 0.15)",
                color: "hsl(var(--error))",
              }}
            >
              <NiShieldCross size="large" />
            </Box>
            <Chip label="Akun Dinonaktifkan" color="error" size="small" />
            <Typography variant="h1" component="h1">
              {info.title}
            </Typography>
            {email && (
              <Typography variant="body2" className="text-text-secondary">
                Akun: <strong>{email}</strong>
              </Typography>
            )}
          </Box>

          <Alert severity="warning" className="neutral">
            <Typography variant="body2">{info.body}</Typography>
          </Alert>

          <Box className="flex flex-col gap-2">
            {reasonKey === "ZERO_CREDIT" && (
              <Button variant="contained" fullWidth onClick={() => router.push("/student/dashboard#packages")}>
                Beli Paket Poin
              </Button>
            )}
            {(reasonKey === "INACTIVITY_3_MONTHS" || reasonKey === "ADMIN_ACTION") && (
              <Button
                variant="contained"
                fullWidth
                startIcon={<NiHeadset size="medium" />}
                onClick={() => router.push("/")}
              >
                Buka Helpdesk di Beranda
              </Button>
            )}
            <Box className="grid grid-cols-2 gap-2">
              <Button
                variant="outlined"
                color="grey"
                startIcon={<NiHome size="medium" />}
                onClick={() => router.push("/")}
              >
                Beranda
              </Button>
              <Button variant="outlined" color="grey" component={Link} href="/login">
                Login Lain
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default function DeactivatedPage() {
  return (
    <Suspense fallback={null}>
      <DeactivatedInner />
    </Suspense>
  );
}
