"use client";

import { useSnackbar } from "notistack";
import { useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import NiHeadset from "@/icons/nexture/ni-headset";
import NiSendRight from "@/icons/nexture/ni-send-right";
import { useCurrentUser } from "@/lib/current-user";
import { useHelpdeskMessages, useHelpdeskSessions } from "@/lib/helpdesk-store";

const STATUS_COLOR = {
  OPEN: "warning",
  CLAIMED: "info",
  CLOSED: "default",
} as const;

export default function AdminHelpdeskPage() {
  const { sessions, updateSession, closeSession } = useHelpdeskSessions();
  const { user } = useCurrentUser();
  const { enqueueSnackbar } = useSnackbar();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { messages, send } = useHelpdeskMessages(activeId);
  const [draft, setDraft] = useState("");

  const active = sessions.find((s) => s.id === activeId) ?? null;

  const handleSend = () => {
    if (!activeId || !draft.trim()) return;
    send({
      sessionId: activeId,
      author: "admin",
      authorEmail: user.email ?? "admin@edudoc.id",
      authorName: user.name ?? "Admin",
      text: draft.trim(),
    });
    setDraft("");
  };

  return (
    <Grid container spacing={5}>
      <Grid container spacing={2.5} className="w-full" size={12}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Typography variant="h1" component="h1" className="mb-0">
            Helpdesk
          </Typography>
          <Typography variant="body2" className="text-text-secondary">
            Monitor sesi helpdesk dan balas pesan siswa.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: "auto" }}>
          <Chip
            icon={<NiHeadset size="small" />}
            label={`${sessions.filter((s) => s.status === "OPEN").length} perlu respon`}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid size={12} container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">
            Sesi
          </Typography>
          <Card>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
                {sessions.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body2" className="text-text-secondary">
                      Belum ada sesi helpdesk.
                    </Typography>
                  </Box>
                ) : (
                  sessions.map((s) => (
                    <Stack
                      key={s.id}
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      onClick={() => {
                        setActiveId(s.id);
                        if (s.status === "OPEN") {
                          updateSession(s.id, {
                            status: "CLAIMED",
                            adminEmail: user.email ?? "admin@edudoc.id",
                            adminName: user.name ?? "Admin",
                          });
                        }
                      }}
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        bgcolor: s.id === activeId ? "primary.light" : undefined,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Avatar sx={{ width: 36, height: 36 }}>{s.studentName.charAt(0)}</Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {s.studentName}
                        </Typography>
                        <Typography variant="caption" className="text-text-secondary-light" noWrap>
                          {new Date(s.lastMessageAt).toLocaleString("id-ID", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </Typography>
                      </Box>
                      <Chip size="small" label={s.status} color={STATUS_COLOR[s.status]} variant="outlined" />
                    </Stack>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" component="h6" className="mt-2 mb-3">
            {active ? `Chat dengan ${active.studentName}` : "Pilih sesi"}
          </Typography>
          <Card>
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              <Box
                sx={{
                  maxHeight: 480,
                  minHeight: 320,
                  overflowY: "auto",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                {!active ? (
                  <Typography variant="body2" className="text-text-secondary" sx={{ textAlign: "center", py: 6 }}>
                    Pilih sesi di sebelah kiri untuk mulai chat.
                  </Typography>
                ) : messages.length === 0 ? (
                  <Typography variant="body2" className="text-text-secondary" sx={{ textAlign: "center", py: 6 }}>
                    Belum ada pesan di sesi ini.
                  </Typography>
                ) : (
                  messages.map((m) => {
                    const mine = m.author === "admin";
                    return (
                      <Stack
                        key={m.id}
                        direction="row"
                        justifyContent={mine ? "flex-end" : "flex-start"}
                        spacing={1}
                        alignItems="flex-end"
                      >
                        {!mine && <Avatar sx={{ width: 28, height: 28 }}>{m.authorName.charAt(0)}</Avatar>}
                        <Box
                          sx={{
                            maxWidth: "70%",
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: mine ? "primary.main" : "action.hover",
                            color: mine ? "primary.contrastText" : "text.primary",
                          }}
                        >
                          <Typography variant="caption" sx={{ opacity: 0.7, display: "block", mb: 0.25 }}>
                            {m.authorName}
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {m.text}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.6, display: "block", mt: 0.25 }}>
                            {new Date(m.at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })
                )}
              </Box>
              {active && (
                <Stack direction="row" spacing={1} sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Balas siswa..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <IconButton color="primary" onClick={handleSend} disabled={!draft.trim()}>
                    <NiSendRight size="medium" />
                  </IconButton>
                  {active.status !== "CLOSED" && (
                    <Button
                      size="tiny"
                      variant="paper"
                      color="grey"
                      onClick={() => {
                        closeSession(active.id);
                        enqueueSnackbar("Sesi ditutup", { variant: "info" });
                      }}
                    >
                      Tutup
                    </Button>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
          <Typography variant="caption" className="text-text-secondary-light" sx={{ mt: 1, display: "block" }}>
            Realtime subscribe Supabase channel — auto-refresh saat ada pesan baru dari siswa.
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
