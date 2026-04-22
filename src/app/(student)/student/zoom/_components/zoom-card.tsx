"use client";

import Link from "next/link";
import { useState } from "react";
import { useSnackbar } from "notistack";

import { Avatar, Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";

import NiCalendar from "@/icons/nexture/ni-calendar";
import NiClock from "@/icons/nexture/ni-clock";
import NiCoin from "@/icons/nexture/ni-coin";
import NiUsers from "@/icons/nexture/ni-users";
import { formatDate, timeUntil } from "@/lib/format";
import { useWallet } from "@/lib/points-store";
import type { ZoomSession } from "@/lib/types";

interface Props {
  session: ZoomSession;
  registered: boolean;
  onRegister: () => Promise<void>;
}

export default function ZoomCard({ session: z, registered, onRegister }: Props) {
  const [loading, setLoading] = useState(false);
  const { balance } = useWallet();
  const { enqueueSnackbar } = useSnackbar();

  const handleRegister = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (registered) return;
    if (z.status === "LIVE") {
      enqueueSnackbar("Sesi sedang berlangsung, ikuti sesi berikutnya.", { variant: "warning" });
      return;
    }
    if (z.cost > balance) {
      enqueueSnackbar(`Poin tidak cukup. Butuh ${z.cost} pts, saldo ${balance} pts.`, {
        variant: "error",
      });
      return;
    }
    setLoading(true);
    try {
      await onRegister();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex h-full flex-col gap-2.5">
        <Box className="flex items-center justify-between gap-2 flex-wrap">
          {z.status === "LIVE" ? (
            <Chip size="small" label="LIVE" color="error" />
          ) : z.status === "ENDED" ? (
            <Chip size="small" label="Selesai" variant="outlined" />
          ) : (
            <Chip size="small" label="Terjadwal" color="info" variant="outlined" />
          )}
          <Chip size="small" label={z.subject} color="primary" variant="outlined" />
        </Box>

        <Typography variant="subtitle1" className="line-clamp-2 leading-tight">
          {z.title}
        </Typography>
        <Typography variant="body2" className="text-text-secondary line-clamp-2">
          {z.description}
        </Typography>

        <Box className="flex items-center gap-2 mt-1">
          <Avatar sx={{ width: 36, height: 36, borderRadius: 1.5 }}>
            {z.teacher.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2">{z.teacher}</Typography>
            <Typography variant="caption" className="text-text-secondary-light">
              {z.subject}
            </Typography>
          </Box>
        </Box>

        <Box className="grid grid-cols-3 gap-1.5 mt-1">
          <TinyStat icon={<NiCalendar size="small" />} value={formatDate(z.scheduledAt).split(",")[0]} />
          <TinyStat icon={<NiClock size="small" />} value={`${z.duration} mnt`} />
          <TinyStat icon={<NiUsers size="small" />} value={`${z.currentParticipants}/${z.maxParticipants}`} />
        </Box>

        <Typography variant="caption" className="text-text-secondary-light">
          {z.status === "SCHEDULED"
            ? `Mulai ${timeUntil(z.scheduledAt)}`
            : z.status === "LIVE"
              ? "Sedang berlangsung"
              : "Telah selesai"}
        </Typography>

        <Box className="flex-1" />

        <Box
          className="flex items-center justify-between pt-2.5"
          sx={{ borderTop: "1px solid", borderColor: "divider" }}
        >
          <Box className="flex items-center gap-1 text-warning">
            <NiCoin size="small" />
            <Typography variant="body2" className="font-semibold">
              {z.cost} pts
            </Typography>
          </Box>
          {z.status === "ENDED" ? (
            <Button size="tiny" variant="paper" disabled>
              Selesai
            </Button>
          ) : registered ? (
            <Button
              component={Link}
              href={`/student/zoom/${z.id}`}
              size="tiny"
              variant="pastel"
              color="primary"
            >
              {z.status === "LIVE" ? "Masuk Sesi" : "Ruang Tunggu"}
            </Button>
          ) : (
            <Button
              size="tiny"
              variant="contained"
              color="primary"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? "Memproses..." : z.status === "LIVE" ? "Gabung" : "Daftar"}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function TinyStat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <Box
      className="text-text-secondary flex items-center gap-1 px-1.5 py-1"
      sx={{ borderRadius: 1, bgcolor: "action.hover" }}
    >
      {icon}
      <Typography variant="caption" noWrap>
        {value}
      </Typography>
    </Box>
  );
}
