"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useSnackbar } from "notistack";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import NiArrowLeft from "@/icons/nexture/ni-arrow-left";
import NiSendRight from "@/icons/nexture/ni-send-right";
import NiShieldCross from "@/icons/nexture/ni-shield-cross";
import { useCurrentUser } from "@/lib/current-user";
import { detectOffPlatform, usePrivateChat } from "@/lib/private-chat-store";
import { usePrivateZoom } from "@/lib/private-zoom-store";

export default function PrivateChatPage() {
  const params = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const { list: requests } = usePrivateZoom();
  const { messages, send } = usePrivateChat(params.id);
  const { enqueueSnackbar } = useSnackbar();
  const [draft, setDraft] = useState("");

  const request = useMemo(() => requests.find((r) => r.id === params.id), [requests, params.id]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !request) return;
    const offPlatform = detectOffPlatform(text);
    if (offPlatform) {
      enqueueSnackbar("Pesan terdeteksi berisi kontak di luar platform — akan di-review admin.", {
        variant: "warning",
      });
    }
    send({
      requestId: request.id,
      author: "student",
      name: user.name ?? "Siswa",
      text,
    });
    setDraft("");
  };

  if (!request) {
    return (
      <Card>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h6">Permintaan tidak ditemukan.</Typography>
          <Button component={Link} href="/student/private-zoom" sx={{ mt: 2 }}>
            Kembali
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      <Button
        component={Link}
        href="/student/private-zoom"
        startIcon={<NiArrowLeft size="small" />}
        size="small"
        sx={{ alignSelf: "flex-start" }}
      >
        Kembali ke permintaan
      </Button>

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Avatar>{request.teacherName.charAt(0)}</Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1">Chat dengan {request.teacherName}</Typography>
              <Typography variant="caption" className="text-text-secondary">
                {request.subject} · {request.topic}
              </Typography>
            </Box>
            <Chip size="small" label={request.status} variant="outlined" />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box
            sx={{
              maxHeight: 480,
              minHeight: 280,
              overflowY: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {messages.length === 0 ? (
              <Typography variant="body2" className="text-text-secondary" sx={{ textAlign: "center", py: 4 }}>
                Belum ada pesan. Sapa guru dulu, yuk.
              </Typography>
            ) : (
              messages.map((m) => {
                const mine = m.author === "student";
                return (
                  <Stack
                    key={m.id}
                    direction="row"
                    spacing={1}
                    justifyContent={mine ? "flex-end" : "flex-start"}
                    alignItems="flex-end"
                  >
                    {!mine && <Avatar sx={{ width: 28, height: 28 }}>{m.name.charAt(0)}</Avatar>}
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
                        {m.name}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {m.text}
                      </Typography>
                      {m.flagged && (
                        <Chip
                          size="small"
                          icon={<NiShieldCross size="small" />}
                          label="Flagged off-platform"
                          color="error"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                      <Typography variant="caption" sx={{ opacity: 0.6, display: "block", mt: 0.25 }}>
                        {new Date(m.at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </Typography>
                    </Box>
                    {mine && <Avatar sx={{ width: 28, height: 28 }}>{m.name.charAt(0)}</Avatar>}
                  </Stack>
                );
              })
            )}
          </Box>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              p: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Ketik pesan..."
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
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="caption" className="text-text-secondary-light">
        Deteksi off-platform aktif: pesan yang berisi kontak (WA/email/Telegram) akan diberi
        tanda <strong>Flagged</strong> untuk review admin.
      </Typography>
    </Stack>
  );
}
