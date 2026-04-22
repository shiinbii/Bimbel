"use client";

import { useEffect, useMemo, useState } from "react";
import { Formik, Form } from "formik";
import { useSnackbar } from "notistack";
import * as Yup from "yup";

import {
  Autocomplete,
  Avatar,
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
import NiSendRight from "@/icons/nexture/ni-send-right";
import NiStars from "@/icons/nexture/ni-stars";
import { useWallet } from "@/lib/points-store";
import { getSupabase } from "@/lib/supabase";
import { useUsersStore, type ManagedUser } from "@/lib/users-store";

const GrantSchema = Yup.object().shape({
  userId: Yup.string().required("Pilih user"),
  amount: Yup.number().min(1, "Minimal 1 poin").max(100000, "Maksimal 100.000").required(),
  validityDays: Yup.number().min(1, "Minimal 1 hari").max(365, "Maksimal 365 hari").required(),
  note: Yup.string().trim().required("Isi catatan"),
});

export default function AdminPointsPage() {
  const { settings, grantTo } = useWallet();
  const { list: allUsers, loaded: usersLoaded } = useUsersStore();
  const { enqueueSnackbar } = useSnackbar();
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const users = useMemo(
    () => allUsers.filter((u) => u.role === "STUDENT" || u.role === "TEACHER"),
    [allUsers],
  );

  // Fetch live balance whenever selected user changes (or after a grant).
  useEffect(() => {
    if (!selectedUser) {
      setLiveBalance(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const supa = getSupabase();
      if (!supa) {
        if (!cancelled) setLiveBalance(selectedUser.points);
        return;
      }
      setBalanceLoading(true);
      const { data, error } = await supa.rpc("compute_balance", {
        p_user_id: selectedUser.id,
      });
      if (cancelled) return;
      if (error) {
        setLiveBalance(selectedUser.points);
      } else {
        setLiveBalance(typeof data === "number" ? data : 0);
      }
      setBalanceLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedUser, refreshKey]);

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Grant Poin Manual
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Berikan poin bonus/koreksi ke user secara manual. Aktivitas tercatat di wallet user.
          </Typography>
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        {/* Selected user balance */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">
            Total Poin User
          </Typography>
          <Card>
            <CardContent className="flex flex-col gap-3">
              {selectedUser ? (
                <>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar src={selectedUser.avatar} sx={{ width: 48, height: 48 }}>
                      {selectedUser.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1">{selectedUser.name}</Typography>
                      <Typography variant="caption" className="text-text-secondary">
                        {selectedUser.email}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    size="small"
                    label={selectedUser.role === "STUDENT" ? "Siswa" : "Guru"}
                    color={selectedUser.role === "STUDENT" ? "info" : "primary"}
                    variant="outlined"
                    sx={{ alignSelf: "flex-start" }}
                  />
                  <Box sx={{ mt: 1, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" alignItems="center" spacing={1} className="text-warning">
                      <NiCoin size="medium" />
                      <Typography variant="overline">Saldo saat ini</Typography>
                    </Stack>
                    <Typography variant="h3" component="p">
                      {balanceLoading
                        ? "..."
                        : (liveBalance ?? selectedUser.points ?? 0).toLocaleString("id-ID")}
                    </Typography>
                    <Typography variant="caption" className="text-text-secondary-light">
                      Default validity: {settings.defaultValidityDays} hari
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Box className="text-text-secondary-light" sx={{ mb: 1 }}>
                    <NiCoin size="medium" />
                  </Box>
                  <Typography variant="body2" className="text-text-secondary">
                    Pilih user untuk melihat saldo poin
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Grant form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">
            Kirim Poin ke User
          </Typography>
          <Formik
            initialValues={{
              userId: "",
              amount: 100,
              validityDays: settings.defaultValidityDays,
              note: "Bonus dari admin",
            }}
            validationSchema={GrantSchema}
            onSubmit={async (values, { resetForm, setSubmitting }) => {
              const user = users.find((u) => u.id === values.userId);
              if (!user) {
                enqueueSnackbar("User tidak ditemukan", { variant: "error" });
                setSubmitting(false);
                return;
              }
              const res = await grantTo(
                user.id,
                values.amount,
                values.validityDays,
                "ADMIN_GRANT",
                values.note,
              );
              if (!res.ok) {
                enqueueSnackbar(res.error ?? "Gagal kirim poin", { variant: "error" });
                setSubmitting(false);
                return;
              }
              enqueueSnackbar(`+${values.amount} poin terkirim ke ${user.name}`, {
                variant: "success",
              });
              resetForm({
                values: {
                  userId: user.id,
                  amount: 100,
                  validityDays: settings.defaultValidityDays,
                  note: "Bonus dari admin",
                },
              });
              setRefreshKey((k) => k + 1);
              setSubmitting(false);
            }}
          >
            {({ values, handleChange, handleBlur, errors, touched, isSubmitting, setFieldValue }) => (
              <Form>
                <Card>
                  <CardContent className="flex flex-col gap-2.5">
                    <Autocomplete<ManagedUser>
                      options={users}
                      loading={!usersLoaded}
                      getOptionLabel={(u) => `${u.name} — ${u.email}`}
                      filterOptions={(options, state) => {
                        const q = state.inputValue.trim().toLowerCase();
                        if (!q) return options.slice(0, 100);
                        return options.filter(
                          (u) =>
                            u.name.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q) ||
                            (u.phone ?? "").toLowerCase().includes(q),
                        );
                      }}
                      isOptionEqualToValue={(a, b) => a.id === b.id}
                      value={users.find((u) => u.id === values.userId) ?? null}
                      onChange={(_, picked) => {
                        setFieldValue("userId", picked?.id ?? "");
                        setSelectedUser(picked);
                      }}
                      renderOption={(props, option) => {
                        const { key, ...rest } = props as typeof props & { key: string };
                        return (
                          <Box component="li" key={key} {...rest}>
                            <Avatar src={option.avatar} sx={{ width: 28, height: 28, mr: 1.5 }}>
                              {option.name.charAt(0)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" noWrap>
                                {option.name}
                              </Typography>
                              <Typography variant="caption" className="text-text-secondary" noWrap>
                                {option.email} · {option.role === "STUDENT" ? "Siswa" : "Guru"}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Cari & Pilih User"
                          placeholder="Ketik nama / email / nomor HP…"
                          error={touched.userId && Boolean(errors.userId)}
                          helperText={(touched.userId && errors.userId) || `${users.length} user tersedia`}
                        />
                      )}
                      noOptionsText={!usersLoaded ? "Memuat user..." : "Tidak ada user cocok"}
                    />

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Jumlah Poin"
                          name="amount"
                          value={values.amount}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.amount && Boolean(errors.amount)}
                          helperText={touched.amount && errors.amount}
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
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Validity (hari)"
                          name="validityDays"
                          value={values.validityDays}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.validityDays && Boolean(errors.validityDays)}
                          helperText={touched.validityDays && errors.validityDays}
                        />
                      </Grid>
                    </Grid>

                    <TextField
                      fullWidth
                      label="Catatan (muncul di riwayat user)"
                      name="note"
                      value={values.note}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.note && Boolean(errors.note)}
                      helperText={touched.note && errors.note}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <NiStars size="small" />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />

                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="warning"
                        startIcon={<NiSendRight size="small" />}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Mengirim..." : "Kirim Poin"}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Form>
            )}
          </Formik>
        </Grid>
      </Grid>
    </Grid>
  );
}
