"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Box, Button, Card, CardContent, Chip, Grid, IconButton, Stack, Typography } from "@mui/material";

import NiArrowLeft from "@/icons/nexture/ni-arrow-left";
import NiCross from "@/icons/nexture/ni-cross";
import NiCrown from "@/icons/nexture/ni-crown";
import NiShield from "@/icons/nexture/ni-shield";
import NiSparkle from "@/icons/nexture/ni-sparkle";
import type { TierConfig } from "@/lib/tier-config-store";

interface Props {
  required: TierConfig;
  current: TierConfig;
  feature: string;
  description?: string;
  upgradeHref?: string;
  onClose?: () => void;
}

export default function TierGate({
  required,
  current,
  feature,
  description,
  upgradeHref = "/student/dashboard",
  onClose,
}: Props) {
  const router = useRouter();
  const pointsNeeded = Math.max(0, required.minPoints - current.minPoints);

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/student/dashboard");
  };

  return (
    <Card sx={{ position: "relative", overflow: "hidden" }}>
      <IconButton
        size="small"
        onClick={handleClose}
        sx={{ position: "absolute", top: 12, right: 12 }}
        aria-label="Tutup"
      >
        <NiCross size={16} />
      </IconButton>

      <CardContent sx={{ textAlign: "center", py: 6, px: { xs: 3, md: 5 } }}>
        <Box sx={{ color: "warning.main", display: "inline-flex", justifyContent: "center", mb: 2 }}>
          <NiShield size={28} />
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Chip icon={<NiCrown size={14} />} label={`Tier ${required.name}+`} color="warning" />
        </Box>

        <Typography variant="h4" component="h2">
          {feature} butuh tier {required.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 480, mx: "auto" }}>
          {description ??
            `Tier kamu saat ini (${current.name}) belum mencakup fitur ini. Top up poin untuk naik tier otomatis.`}
        </Typography>

        <Grid container spacing={2} sx={{ mt: 3, maxWidth: 560, mx: "auto", textAlign: "left" }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Tier kamu
                </Typography>
                <Typography variant="h6">{current.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Min. {current.minPoints} poin · {current.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined" sx={{ borderColor: "warning.main" }}>
              <CardContent>
                <Typography variant="overline" color="warning.main">
                  Tier yang dibutuhkan
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {required.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Min. {required.minPoints} poin · {required.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {pointsNeeded > 0 && (
          <Typography variant="caption" color="warning.main" sx={{ mt: 2, display: "block" }}>
            Butuh <strong>+{pointsNeeded} poin</strong> lagi untuk naik tier otomatis.
          </Typography>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ mt: 3 }}>
          <Button variant="outlined" startIcon={<NiArrowLeft size={16} />} onClick={handleClose}>
            Kembali
          </Button>
          <Button
            component={Link}
            href={upgradeHref}
            variant="contained"
            color="warning"
            size="large"
            startIcon={<NiSparkle size={16} />}
          >
            Top Up ke {required.name}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
