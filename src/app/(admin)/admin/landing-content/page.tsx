"use client";

import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";

import { Button, Card, CardContent, Grid, Stack, TextField, Typography } from "@mui/material";

import NiRefresh from "@/icons/nexture/ni-refresh";
import { useLandingContent } from "@/lib/landing-content";

export default function AdminLandingContentPage() {
  const { content, update, reset } = useLandingContent();
  const { enqueueSnackbar } = useSnackbar();
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    setDraft(content);
  }, [content]);

  const save = () => {
    update(draft);
    enqueueSnackbar("Landing content disimpan", { variant: "success" });
  };

  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Edit Landing
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Ubah copy hero, CTA, dan teks yang tampil di landing page.
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

      <Grid size={12}>
        <Typography variant="h6" component="h6" className="mt-2 mb-3">
          Hero Section
        </Typography>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <TextField
              fullWidth
              label="Hero Badge"
              value={draft.heroBadge}
              onChange={(e) => set("heroBadge", e.target.value)}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Title Lead"
                  value={draft.heroTitleLead}
                  onChange={(e) => set("heroTitleLead", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Title Accent 1"
                  value={draft.heroTitleAccent1}
                  onChange={(e) => set("heroTitleAccent1", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Title Connector"
                  value={draft.heroTitleConnector}
                  onChange={(e) => set("heroTitleConnector", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Title Accent 2"
                  value={draft.heroTitleAccent2}
                  onChange={(e) => set("heroTitleAccent2", e.target.value)}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Hero Description"
              value={draft.heroDescription}
              onChange={(e) => set("heroDescription", e.target.value)}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="CTA Primer"
                  value={draft.heroPrimaryCta}
                  onChange={(e) => set("heroPrimaryCta", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="CTA Sekunder"
                  value={draft.heroSecondaryCta}
                  onChange={(e) => set("heroSecondaryCta", e.target.value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <Typography variant="caption" className="text-text-secondary-light">
          Stats + features + FAQ + footer masih hardcoded di landing page — tambahkan section editor di rilis
          berikutnya.
        </Typography>
      </Grid>
    </Grid>
  );
}
