"use client";

import Link from "next/link";

import { Avatar, Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";

import NiAward from "@/icons/nexture/ni-badge";
import NiCalendar from "@/icons/nexture/ni-calendar";
import NiCheck from "@/icons/nexture/ni-check";
import NiCoin from "@/icons/nexture/ni-coin";
import NiEmail from "@/icons/nexture/ni-email";
import NiPen from "@/icons/nexture/ni-pen";
import NiPhone from "@/icons/nexture/ni-phone";
import NiShieldCheck from "@/icons/nexture/ni-shield-check";
import NiTrophy from "@/icons/nexture/ni-trophy";
import NiUser from "@/icons/nexture/ni-user";
import { ROLE_LABEL } from "@/config/roles";
import { useCurrentUser } from "@/lib/current-user";
import { mockUser } from "@/lib/mock-data";
import { daysUntil, useWallet } from "@/lib/points-store";
import { useRole } from "@/lib/role-context";

export default function ProfilePage() {
  const { role } = useRole();
  const { user } = useCurrentUser();
  const { balance, nextExpiring, history } = useWallet();

  const displayName = user.name || mockUser.name;
  const displayEmail = user.email || mockUser.email;
  const displayPhone = user.phone || mockUser.phone;

  const infoRows = [
    { icon: <NiUser size="small" />, label: "Nama Lengkap", value: displayName },
    { icon: <NiEmail size="small" />, label: "Email", value: displayEmail },
    { icon: <NiPhone size="small" />, label: "Nomor HP", value: displayPhone ?? "—" },
    { icon: <NiShieldCheck size="small" />, label: "Role Aktif", value: ROLE_LABEL[role] },
  ];

  const verification = [
    { label: "Email terverifikasi", ok: !!displayEmail },
    { label: "Nomor HP aktif", ok: !!displayPhone },
    { label: "Foto profil", ok: !!user.avatar },
  ];

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Profil Saya
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Informasi akun kamu. Untuk edit, buka Pengaturan Akun.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row items-start gap-2">
          <Button
            component={Link}
            href="/account-settings"
            variant="contained"
            color="primary"
            size="medium"
            startIcon={<NiPen size="medium" />}
          >
            Edit di Pengaturan
          </Button>
        </Grid>
      </Grid>

      {/* Hero card */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              alignItems={{ md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={3} alignItems="center">
                <Avatar src={user.avatar} sx={{ width: 96, height: 96 }}>
                  {displayName.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Chip label={ROLE_LABEL[role]} color="primary" size="small" sx={{ mb: 1 }} />
                  <Typography variant="h3" component="h2">
                    {displayName}
                  </Typography>
                  <Typography variant="body2" className="text-text-secondary-light">
                    Bergabung {mockUser.joinedAt} · ID {mockUser.id}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Account info */}
      <Grid size={12} container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">
            Info Akun
          </Typography>
          <Card>
            <CardContent className="flex flex-col gap-3">
              <Grid container spacing={2}>
                {infoRows.map((r) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={r.label}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 1.5,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.default",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" className="text-text-secondary">
                        {r.icon}
                        <Typography variant="caption">{r.label}</Typography>
                      </Stack>
                      <Typography variant="subtitle2" sx={{ mt: 0.5 }} noWrap>
                        {r.value || "—"}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" className="text-text-secondary-dark">
                  Status Verifikasi
                </Typography>
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  {verification.map((x) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={x.label}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{
                          p: 1.25,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: x.ok ? "success.main" : "divider",
                          bgcolor: x.ok ? "success.light" : "background.default",
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: x.ok ? "success.main" : "action.hover",
                            color: x.ok ? "success.contrastText" : "text.secondary",
                            flexShrink: 0,
                          }}
                        >
                          <NiCheck size="small" />
                        </Box>
                        <Typography variant="caption">{x.label}</Typography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>

          <Typography variant="h6" component="h6" className="mt-6 mb-3">
            Statistik Belajar
          </Typography>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                {[
                  { icon: <NiAward size="small" />, label: "Achievement", value: 12 },
                  { icon: <NiTrophy size="small" />, label: "Streak Belajar", value: "12 hari" },
                  { icon: <NiCalendar size="small" />, label: "Sesi Diikuti", value: 18 },
                ].map((s) => (
                  <Grid size={{ xs: 12, sm: 4 }} key={s.label}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1.5,
                          bgcolor: "primary.light",
                          color: "primary.main",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {s.icon}
                      </Box>
                      <Box>
                        <Typography variant="caption" className="text-text-secondary-light">
                          {s.label}
                        </Typography>
                        <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                          {s.value}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {role === "STUDENT" && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <Typography variant="h6" component="h6" className="mt-2 mb-3">
              Poin & Aktivitas
            </Typography>
            <Stack spacing={2.5}>
              <Card>
                <CardContent className="flex flex-col gap-3">
                  <Stack direction="row" alignItems="center" spacing={1} className="text-warning">
                    <NiCoin size="small" />
                    <Typography variant="overline">Poin Aktif</Typography>
                  </Stack>
                  <Typography variant="h2" component="p">
                    {balance.toLocaleString("id-ID")}
                  </Typography>
                  {nextExpiring && (
                    <Typography variant="caption" className="text-text-secondary-light">
                      {nextExpiring.remaining} pts kedaluwarsa dalam{" "}
                      <strong>{daysUntil(nextExpiring.expiresAt)} hari</strong>
                    </Typography>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="subtitle1">Aktivitas Poin</Typography>
                  <Typography variant="caption" className="text-text-secondary-light">
                    5 transaksi terakhir
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {history.slice(0, 5).map((h) => (
                      <Stack
                        key={h.id}
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{
                          p: 1.25,
                          borderRadius: 1.5,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "background.default",
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor:
                              h.kind === "SPEND"
                                ? "error.main"
                                : h.kind === "EXPIRE"
                                  ? "warning.main"
                                  : "success.main",
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" noWrap>
                            {h.note}
                          </Typography>
                          <Typography variant="caption" className="text-text-secondary-light" component="p">
                            {new Date(h.at).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          className="font-semibold"
                          sx={{ color: h.kind === "GRANT" ? "success.main" : "error.main" }}
                        >
                          {h.kind === "GRANT" ? "+" : "-"}
                          {h.points}
                        </Typography>
                      </Stack>
                    ))}
                    {history.length === 0 && (
                      <Typography variant="caption" className="text-text-secondary" sx={{ py: 2 }}>
                        Belum ada aktivitas poin.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
