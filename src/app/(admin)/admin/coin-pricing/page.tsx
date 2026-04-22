"use client";

import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import NiCoin from "@/icons/nexture/ni-coin";
import NiRefresh from "@/icons/nexture/ni-refresh";
import { packageDiscount, useCoinPricing } from "@/lib/coin-pricing-store";
import { useCreditPackages } from "@/lib/credit-packages-store";
import { formatIDR } from "@/lib/format";

export default function AdminCoinPricingPage() {
  const { pricing, update, reset } = useCoinPricing();
  const { list: packages } = useCreditPackages();
  const { enqueueSnackbar } = useSnackbar();
  const [price, setPrice] = useState(pricing.pricePerCoin);
  const [topUpsStr, setTopUpsStr] = useState(pricing.quickTopUps.join(", "));

  useEffect(() => {
    setPrice(pricing.pricePerCoin);
    setTopUpsStr(pricing.quickTopUps.join(", "));
  }, [pricing]);

  const save = () => {
    const parsed = topUpsStr
      .split(/[,\s]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    const uniq = Array.from(new Set(parsed)).sort((a, b) => a - b);
    if (price <= 0) {
      enqueueSnackbar("Harga per coin harus > 0", { variant: "error" });
      return;
    }
    if (uniq.length === 0) {
      enqueueSnackbar("Isi minimal 1 nominal top-up", { variant: "error" });
      return;
    }
    update({ pricePerCoin: price, quickTopUps: uniq });
    enqueueSnackbar("Pricing tersimpan", { variant: "success" });
  };

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Point Pricing
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Atur harga per coin + nominal top-up cepat. Paket Harga otomatis
            menghitung diskon dari harga dasar ini.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="paper"
              color="grey"
              startIcon={<NiRefresh size="small" />}
              onClick={() => {
                reset();
                enqueueSnackbar("Reset ke default", { variant: "info" });
              }}
            >
              Reset Default
            </Button>
            <Button variant="contained" color="primary" onClick={save}>
              Simpan
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent className="flex flex-col gap-2.5">
            <Typography variant="h6">Harga Dasar per Coin</Typography>
            <Typography variant="body2" className="text-text-secondary">
              User bisa beli poin satuan dengan harga ini (tanpa paket). Paket bundle
              akan tampil diskon relatif terhadap harga ini.
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Rp per 1 coin"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <NiCoin size="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              label="Top-Up Cepat (pisahkan koma)"
              value={topUpsStr}
              onChange={(e) => setTopUpsStr(e.target.value)}
              placeholder="10, 50, 100, 500, 1000"
              helperText={`Preview: ${topUpsStr
                .split(/[,\s]+/)
                .filter(Boolean)
                .map((n) => `${n} poin = ${formatIDR((parseInt(n, 10) || 0) * (price || 0))}`)
                .join(" · ")}`}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <Typography variant="h6">Simulasi Top-Up</Typography>
            <Typography variant="body2" className="text-text-secondary">
              Nominal yang muncul di halaman beli poin.
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {(topUpsStr
                .split(/[,\s]+/)
                .map((s) => parseInt(s, 10))
                .filter((n) => Number.isFinite(n) && n > 0)
                .sort((a, b) => a - b) as number[]).map((pts) => (
                <Stack
                  key={pts}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ py: 0.5, px: 1, borderRadius: 1, bgcolor: "background.default" }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <NiCoin size="small" />
                    <Typography variant="body2">
                      {pts} poin
                    </Typography>
                  </Stack>
                  <Typography variant="subtitle2" color="warning.main">
                    {formatIDR(pts * price)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <Typography variant="h6" component="h6" sx={{ mb: 1.5, mt: 1 }}>
          Diskon Paket (dihitung otomatis)
        </Typography>
        <Grid container spacing={2}>
          {packages.length === 0 ? (
            <Grid size={12}>
              <Typography variant="body2" className="text-text-secondary">
                Belum ada paket.
              </Typography>
            </Grid>
          ) : (
            [...packages]
              .sort((a, b) => a.order - b.order)
              .map((pkg) => {
                const base = pkg.points * pricing.pricePerCoin;
                const diff = base - pkg.price;
                const discount = packageDiscount(pkg.price, pkg.points, pricing.pricePerCoin);
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="subtitle2">Paket {pkg.points} pts</Typography>
                          {pkg.popular && <Chip size="small" label="Populer" color="primary" />}
                        </Stack>
                        <Typography variant="h5" sx={{ mt: 1 }}>
                          {formatIDR(pkg.price)}
                        </Typography>
                        <Typography variant="caption" className="text-text-secondary">
                          Harga per-coin: {formatIDR(base)}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {discount > 0 ? (
                            <Chip
                              size="small"
                              color="success"
                              variant="outlined"
                              label={`Hemat ${discount}% (Rp ${diff.toLocaleString("id-ID")})`}
                            />
                          ) : (
                            <Chip size="small" variant="outlined" label="Tanpa diskon" />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })
          )}
        </Grid>
      </Grid>
    </Grid>
  );
}
