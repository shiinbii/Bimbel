"use client";

import { useSnackbar } from "notistack";
import { useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import NiPen from "@/icons/nexture/ni-pen";
import NiRefresh from "@/icons/nexture/ni-refresh";
import { formatIDR } from "@/lib/format";
import { type TierBadgeTone, type TierConfig, useTierConfigs } from "@/lib/tier-config-store";

const BADGE_TONES: { v: TierBadgeTone; label: string }[] = [
  { v: "neutral", label: "Neutral" },
  { v: "info", label: "Info" },
  { v: "primary", label: "Primary" },
  { v: "gold", label: "Gold" },
];

const TONE_COLOR: Record<TierBadgeTone, "default" | "info" | "primary" | "warning"> = {
  neutral: "default",
  info: "info",
  primary: "primary",
  gold: "warning",
};

export default function AdminTiersPage() {
  const { list, upsert, reset } = useTierConfigs();
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState<TierConfig | null>(null);

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Tier Siswa
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Atur nama, threshold poin minimum, dan capabilities per tier.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }}>
          <Button
            variant="surface"
            color="grey"
            startIcon={<NiRefresh size="medium" />}
            onClick={() => {
              reset();
              enqueueSnackbar("Tier dikembalikan ke default", { variant: "info" });
            }}
          >
            Reset Default
          </Button>
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        {list.map((tier) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={tier.id}>
            <Card sx={{ height: "100%" }}>
              <CardContent className="flex flex-col gap-2.5">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Chip label={tier.name} color={TONE_COLOR[tier.badgeTone]} />
                  <IconButton size="small" onClick={() => setEditing(tier)}>
                    <NiPen size="small" />
                  </IconButton>
                </Stack>
                <Typography variant="h5">{tier.name}</Typography>
                <Typography variant="body2" className="text-text-secondary">
                  {tier.description}
                </Typography>
                <Box sx={{ mt: 1, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" className="text-text-secondary-dark">
                    Harga Tier
                  </Typography>
                  {tier.price > 0 ? (
                    <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
                      {tier.discountPrice && tier.discountPrice < tier.price ? (
                        <>
                          <Typography variant="h6" className="text-success">
                            {formatIDR(tier.discountPrice)}
                          </Typography>
                          <Typography
                            variant="body2"
                            className="text-text-secondary-light"
                            sx={{ textDecoration: "line-through" }}
                          >
                            {formatIDR(tier.price)}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="h6">{formatIDR(tier.price)}</Typography>
                      )}
                    </Stack>
                  ) : (
                    <Chip size="small" label="GRATIS" color="success" variant="outlined" />
                  )}
                </Box>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                  <Box>
                    <Typography variant="caption" className="text-text-secondary-dark">
                      Min. Poin
                    </Typography>
                    <Typography variant="body2" className="text-warning font-semibold">
                      {tier.minPoints.toLocaleString("id-ID")} pts
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-text-secondary-dark">
                      Bonus Beli
                    </Typography>
                    <Typography variant="body2" className="text-warning font-semibold">
                      +{tier.bonusPoints.toLocaleString("id-ID")} pts
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {tier.canAccessZoom && <Chip size="small" label="Zoom Grup" color="info" variant="outlined" />}
                  {tier.canRequestPrivateZoom && (
                    <Chip size="small" label="Privat 1-on-1" color="warning" variant="outlined" />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Tier: {editing?.name}</DialogTitle>
        <DialogContent>
          {editing && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Nama Tier"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
              <TextField
                fullWidth
                label="Deskripsi"
                multiline
                minRows={2}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
              <TextField
                fullWidth
                type="number"
                label="Minimum Poin"
                helperText="Threshold poin total user untuk auto-promote ke tier ini."
                value={editing.minPoints}
                onChange={(e) => setEditing({ ...editing, minPoints: Math.max(0, Number(e.target.value) || 0) })}
              />
              <Stack direction="row" spacing={1.5}>
                <TextField
                  fullWidth
                  type="number"
                  label="Harga (Rp)"
                  helperText="0 = tier gratis (default tier untuk user baru)."
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Math.max(0, Number(e.target.value) || 0) })}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Harga Diskon / Promo (Rp)"
                  helperText="Opsional. Kalau diisi & < harga, tampil coret di student dashboard."
                  value={editing.discountPrice ?? ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? undefined : Math.max(0, Number(e.target.value) || 0);
                    setEditing({ ...editing, discountPrice: v });
                  }}
                />
              </Stack>
              <TextField
                fullWidth
                type="number"
                label="Bonus Poin saat Beli Tier"
                helperText="Poin yang langsung user dapat saat beli tier ini (sekali, tidak berulang)."
                value={editing.bonusPoints}
                onChange={(e) => setEditing({ ...editing, bonusPoints: Math.max(0, Number(e.target.value) || 0) })}
              />
              <TextField
                fullWidth
                select
                label="Badge Tone"
                value={editing.badgeTone}
                onChange={(e) => setEditing({ ...editing, badgeTone: e.target.value as TierBadgeTone })}
              >
                {BADGE_TONES.map((t) => (
                  <MenuItem key={t.v} value={t.v}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={
                  <Switch
                    checked={editing.canAccessZoom}
                    onChange={(e) => setEditing({ ...editing, canAccessZoom: e.target.checked })}
                  />
                }
                label="Akses Sesi Zoom Grup"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editing.canRequestPrivateZoom}
                    onChange={(e) => setEditing({ ...editing, canRequestPrivateZoom: e.target.checked })}
                  />
                }
                label="Akses Sesi Privat 1-on-1"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="paper" color="grey" onClick={() => setEditing(null)}>
            Batal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (!editing) return;
              upsert(editing);
              enqueueSnackbar(`Tier ${editing.name} disimpan`, { variant: "success" });
              setEditing(null);
            }}
          >
            Simpan
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
