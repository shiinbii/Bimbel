"use client";

import { useMemo, useState } from "react";
import { useSnackbar } from "notistack";

import {
  Box,
  Grid,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import TierGate from "@/components/TierGate";
import NiCamera from "@/icons/nexture/ni-camera";
import NiSearch from "@/icons/nexture/ni-search";
import { useWallet } from "@/lib/points-store";
import { computeTier, useTierConfigs } from "@/lib/tier-config-store";
import { useZoomSessions } from "@/lib/zoom-sessions-store";

import ZoomCard from "./_components/zoom-card";

type StatusFilter = "ALL" | "SCHEDULED" | "LIVE" | "ENDED";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "Semua" },
  { key: "SCHEDULED", label: "Upcoming" },
  { key: "LIVE", label: "Live" },
  { key: "ENDED", label: "Selesai" },
];

export default function ZoomListPage() {
  const { balance, spend } = useWallet();
  const { list: zoomList } = useZoomSessions();
  const { list: tiers } = useTierConfigs();
  const currentTier = computeTier(balance, tiers);
  const firstZoomTier = tiers.find((t) => t.canAccessZoom);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [registered, setRegistered] = useState<Set<string>>(new Set());
  const { enqueueSnackbar } = useSnackbar();

  if (!currentTier.canAccessZoom) {
    return (
      <TierGate
        required={firstZoomTier ?? currentTier}
        current={currentTier}
        feature="Sesi Zoom Live"
        description={`Akses sesi zoom live grup tersedia mulai paket ${
          firstZoomTier?.name ?? "—"
        } ke atas. Top up poin untuk naik tier otomatis.`}
      />
    );
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return zoomList.filter((z) => {
      const matchStatus = statusFilter === "ALL" || z.status === statusFilter;
      const matchSearch =
        !q ||
        z.title.toLowerCase().includes(q) ||
        z.teacher.toLowerCase().includes(q) ||
        z.subject.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [statusFilter, search, zoomList]);

  const handleRegister = async (id: string, cost: number, title: string) => {
    await new Promise((r) => setTimeout(r, 900));
    const ok = spend(cost, `Daftar sesi: ${title}`);
    if (!ok) {
      enqueueSnackbar("Gagal memotong poin. Silakan coba lagi.", { variant: "error" });
      return;
    }
    setRegistered((s) => new Set(s).add(id));
    enqueueSnackbar(`Berhasil daftar — ${cost} poin dipotong`, { variant: "success" });
  };

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Sesi Zoom
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Ikuti sesi interaktif dengan chat room, waiting room, dan pembahasan eksklusif.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }} className="flex flex-row items-start gap-2">
          <Box className="text-primary flex items-center gap-2">
            <NiCamera size="medium" />
            <Typography variant="body2" className="text-text-secondary-dark">
              Live Zoom Class
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Grid size={12}>
        <Tabs
          value={statusFilter}
          onChange={(_, v) => setStatusFilter(v as StatusFilter)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {STATUS_TABS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
      </Grid>

      <Grid size={12}>
        <TextField
          fullWidth
          placeholder="Cari judul, guru, atau mata pelajaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <NiSearch size="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Grid>

      <Grid size={12}>
        {filtered.length === 0 ? (
          <Box className="py-10 text-center">
            <Typography variant="body2" className="text-text-secondary">
              Belum ada sesi yang cocok.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {filtered.map((z) => (
              <Grid size={{ xs: 12, md: 6, xl: 4 }} key={z.id}>
                <ZoomCard
                  session={z}
                  registered={registered.has(z.id)}
                  onRegister={() => handleRegister(z.id, z.cost, z.title)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
