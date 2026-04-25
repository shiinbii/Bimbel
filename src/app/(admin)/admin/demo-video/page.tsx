"use client";

import { useSnackbar } from "notistack";
import { useState } from "react";

import { Box, Button, Card, CardContent, Grid, Stack, TextField, Typography } from "@mui/material";

import NiPlay from "@/icons/nexture/ni-play";
import NiRefresh from "@/icons/nexture/ni-refresh";
import { useDemoVideoUrl } from "@/lib/demo-video";

export default function AdminDemoVideoPage() {
  const { url, setUrl, reset, embed } = useDemoVideoUrl();
  const { enqueueSnackbar } = useSnackbar();
  const [draft, setDraft] = useState(url);

  const save = () => {
    setUrl(draft.trim());
    enqueueSnackbar("URL demo video disimpan", { variant: "success" });
  };

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Video Demo
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            URL video YouTube yang tampil di landing page / onboarding.
          </Typography>
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">
            Setting URL
          </Typography>
          <Card>
            <CardContent className="flex flex-col gap-2.5">
              <TextField
                fullWidth
                label="URL YouTube"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                helperText="Format: full URL YouTube atau hanya video ID"
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="paper"
                  color="grey"
                  startIcon={<NiRefresh size="small" />}
                  onClick={() => {
                    reset();
                    enqueueSnackbar("Reset ke default", { variant: "info" });
                    setDraft("");
                  }}
                >
                  Reset Default
                </Button>
                <Button variant="contained" color="primary" onClick={save}>
                  Simpan
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">
            Preview
          </Typography>
          <Card>
            <CardContent>
              {embed ? (
                <Box
                  sx={{
                    aspectRatio: "16 / 9",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "common.black",
                  }}
                >
                  <Box
                    component="iframe"
                    src={embed}
                    allowFullScreen
                    sx={{ width: "100%", height: "100%", border: 0 }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    aspectRatio: "16 / 9",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "action.hover",
                    borderRadius: 2,
                  }}
                >
                  <NiPlay size="large" />
                  <Typography variant="caption" className="text-text-secondary" sx={{ mt: 1 }}>
                    URL tidak valid atau kosong
                  </Typography>
                </Box>
              )}
              <Typography variant="caption" className="text-text-secondary-light" sx={{ mt: 1, display: "block" }}>
                Current URL: <strong>{url || "—"}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  );
}
