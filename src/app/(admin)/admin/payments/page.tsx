"use client";

import { useSnackbar } from "notistack";

import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import NiRefresh from "@/icons/nexture/ni-refresh";
import { usePaymentSettings, type PaymentMethodId } from "@/lib/payment-settings-store";

const METHOD_LABELS: Record<PaymentMethodId, string> = {
  VA: "Virtual Account",
  GOPAY: "GoPay",
  QRIS: "QRIS",
  CC: "Credit Card",
  TRANSFER: "Bank Transfer",
};

export default function AdminPaymentsPage() {
  const { settings, setMethod, update, reset } = usePaymentSettings();
  const { enqueueSnackbar } = useSnackbar();

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">Pengaturan Pembayaran</Typography>
          <Typography variant="body2" className="text-text-secondary">
            Enable/disable metode + setup VA banks, QRIS, GoPay, dan transfer.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }}>
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
        </Grid>
      </Grid>

      <Grid size={12}>
        <Typography variant="h6" component="h6" className="mt-2 mb-3">Metode Pembayaran</Typography>
        <Card>
          <CardContent className="flex flex-col gap-2">
            {(Object.keys(METHOD_LABELS) as PaymentMethodId[]).map((id) => {
              const m = settings.methods[id];
              return (
                <Stack
                  key={id}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: m.enabled ? "primary.main" : "divider",
                    bgcolor: m.enabled ? "primary.light" : "background.default",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">{METHOD_LABELS[id]}</Typography>
                    <Typography variant="caption" className="text-text-secondary">
                      {m.enabled ? "Aktif — bisa dipilih student saat top-up" : "Nonaktif — tersembunyi"}
                    </Typography>
                  </Box>
                  <Switch
                    checked={m.enabled}
                    onChange={() => {
                      setMethod(id, { enabled: !m.enabled });
                      enqueueSnackbar(`${METHOD_LABELS[id]} ${!m.enabled ? "aktif" : "nonaktif"}`, { variant: "success" });
                    }}
                  />
                </Stack>
              );
            })}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">QRIS</Typography>
          <Card>
            <CardContent>
              <TextField
                fullWidth
                label="Nama Merchant QRIS"
                value={settings.qrisMerchant}
                onChange={(e) => update({ qrisMerchant: e.target.value })}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">GoPay</Typography>
          <Card>
            <CardContent>
              <TextField
                fullWidth
                label="Nomor GoPay"
                value={settings.gopayPhone}
                onChange={(e) => update({ gopayPhone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid size={12}>
        <Typography variant="h6" component="h6" className="mt-2 mb-3">Virtual Accounts</Typography>
        <Card>
          <CardContent className="flex flex-col gap-1.5">
            {settings.virtualAccounts.length === 0 ? (
              <Typography variant="body2" className="text-text-secondary">Belum ada bank VA terdaftar.</Typography>
            ) : (
              settings.virtualAccounts.map((va) => (
                <Stack
                  key={va.id}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">{va.name}</Typography>
                    <Typography variant="caption" className="text-text-secondary-light" sx={{ fontFamily: "monospace" }}>
                      {va.code}
                    </Typography>
                  </Box>
                </Stack>
              ))
            )}
            <Typography variant="caption" className="text-text-secondary-light" sx={{ mt: 1 }}>
              Tambah/edit VA bank: lewat API langsung atau via rilis CRUD VA mendatang.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <Typography variant="h6" component="h6" className="mt-2 mb-3">Bank Transfer</Typography>
        <Card>
          <CardContent className="flex flex-col gap-1.5">
            {settings.transferAccounts.length === 0 ? (
              <Typography variant="body2" className="text-text-secondary">Belum ada rekening transfer.</Typography>
            ) : (
              settings.transferAccounts.map((acc) => (
                <Stack
                  key={acc.id}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">{acc.bank} — {acc.accountName}</Typography>
                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                      {acc.accountNumber}
                    </Typography>
                  </Box>
                </Stack>
              ))
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
