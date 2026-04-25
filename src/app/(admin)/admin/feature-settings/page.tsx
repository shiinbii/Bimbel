"use client";

import { useSnackbar } from "notistack";
import { useState } from "react";

import { Box, Button, Card, CardContent, Chip, Grid, Stack, Switch, Typography } from "@mui/material";

import RequireSuperAdmin from "@/components/layout/RequireSuperAdmin";
import NiEmail from "@/icons/nexture/ni-email";
import NiHeadset from "@/icons/nexture/ni-headset";
import NiShieldCheck from "@/icons/nexture/ni-shield-check";
import NiSparkle from "@/icons/nexture/ni-sparkle";
import NiUser from "@/icons/nexture/ni-user";
import NiWorld from "@/icons/nexture/ni-world";

interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  default: boolean;
}

const FLAGS: FeatureFlag[] = [
  {
    key: "google_oauth",
    label: "Google OAuth Login",
    description: "Izinkan login/register via Google. Kalau off, user harus pakai email+password.",
    icon: <NiWorld size="medium" />,
    default: true,
  },
  {
    key: "otp_login",
    label: "OTP Email Login",
    description: "Opsi login via kode OTP (dikirim ke email) tanpa password.",
    icon: <NiEmail size="medium" />,
    default: true,
  },
  {
    key: "first_login_modal",
    label: "First Login Policy Modal",
    description: "Tampilkan modal kebijakan 3-bulan inactivity saat login pertama student/teacher.",
    icon: <NiUser size="medium" />,
    default: true,
  },
  {
    key: "helpdesk_realtime",
    label: "Helpdesk Realtime Chat",
    description: "Enable Supabase realtime channel untuk helpdesk. Kalau off, fallback ke polling.",
    icon: <NiHeadset size="medium" />,
    default: true,
  },
  {
    key: "private_zoom",
    label: "Private Zoom 1-on-1",
    description: "Izinkan student premium request sesi privat ke guru.",
    icon: <NiSparkle size="medium" />,
    default: true,
  },
  {
    key: "anti_cheat_strict",
    label: "Anti-Cheat Strict Mode",
    description: "Auto-submit quiz saat tab-switch > 5x. Kalau off, hanya flag untuk review manual.",
    icon: <NiShieldCheck size="medium" />,
    default: false,
  },
];

export default function AdminFeatureSettingsPage() {
  return (
    <RequireSuperAdmin>
      <FeatureSettingsContent />
    </RequireSuperAdmin>
  );
}

function FeatureSettingsContent() {
  const { enqueueSnackbar } = useSnackbar();
  const [state, setState] = useState<Record<string, boolean>>(() =>
    FLAGS.reduce((acc, f) => ({ ...acc, [f.key]: f.default }), {}),
  );
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => {
    setState((s) => ({ ...s, [key]: !s[key] }));
  };

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    enqueueSnackbar("Feature flags tersimpan (demo — belum persist ke DB)", {
      variant: "success",
    });
  };

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Pengaturan Fitur
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Toggle fitur platform. Perubahan berlaku untuk semua user.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }}>
          <Chip icon={<NiShieldCheck size="small" />} label="Super Admin Only" color="warning" />
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        {FLAGS.map((f) => (
          <Grid size={{ xs: 12, md: 6 }} key={f.key}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: state[f.key] ? "primary.light" : "action.hover",
                      color: state[f.key] ? "primary.main" : "text.secondary",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1">{f.label}</Typography>
                      <Switch checked={state[f.key]} onChange={() => toggle(f.key)} />
                    </Stack>
                    <Typography variant="caption" className="text-text-secondary">
                      {f.description}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid size={12}>
        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button
            variant="paper"
            color="grey"
            onClick={() => setState(FLAGS.reduce((acc, f) => ({ ...acc, [f.key]: f.default }), {}))}
          >
            Reset Default
          </Button>
          <Button variant="contained" color="primary" onClick={save} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Feature Flags"}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
}
