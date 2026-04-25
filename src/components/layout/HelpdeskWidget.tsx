"use client";

import { useEffect, useRef, useState } from "react";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Fab,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Zoom,
} from "@mui/material";

import NiCheck from "@/icons/nexture/ni-check";
import NiClock from "@/icons/nexture/ni-clock";
import NiCross from "@/icons/nexture/ni-cross";
import NiHeadset from "@/icons/nexture/ni-headset";
import NiMessage from "@/icons/nexture/ni-message";
import NiSendRight from "@/icons/nexture/ni-send-right";
import { useCurrentUser } from "@/lib/current-user";
import { useHelpdeskMessages, useHelpdeskSessions, useOnlineAdmins } from "@/lib/helpdesk-store";
import { useRole } from "@/lib/role-context";

export default function HelpdeskWidget() {
  const { user } = useCurrentUser();
  const { role } = useRole();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { openOrGet, closeSession } = useHelpdeskSessions();
  const { messages, send } = useHelpdeskMessages(sessionId);
  const onlineAdmins = useOnlineAdmins();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const isAdminRole = role === "ADMIN" || role === "SUPER_ADMIN";
  const myEmail = user.email || "guest@edudoc.id";
  const myName = user.name || "Tamu";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, open]);

  const ensureSession = async () => {
    if (sessionId) return sessionId;
    const s = await openOrGet(myEmail, myName);
    setSessionId(s.id);
    return s.id;
  };

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    // AWAIT session insert — supaya RLS check `exists session` di
    // helpdesk_messages tidak race dan reject pesan pertama.
    const sid = await ensureSession();
    send({
      sessionId: sid,
      author: "student",
      authorEmail: myEmail,
      authorName: myName,
      text: t,
    });
    setText("");
  };

  if (isAdminRole) return null;

  const onlineCount = onlineAdmins.length;
  const hour = new Date().getHours();
  const withinOfficeHours = (hour >= 9 && hour < 11) || (hour >= 13 && hour < 16);

  return (
    <Box sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 1300 }}>
      <Zoom in={open} unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            mb: 2,
            width: 380,
            maxWidth: "calc(100vw - 40px)",
            maxHeight: 600,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: "primary.light",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Badge color="success" variant="dot" invisible={onlineCount === 0} overlap="circular">
              <Avatar sx={{ bgcolor: "primary.main" }}>
                <NiHeadset size="medium" />
              </Avatar>
            </Badge>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2">Live Chat Admin</Typography>
              <Typography variant="caption" className="text-text-secondary">
                {onlineCount > 0 ? `${onlineCount} admin online` : "Admin offline"}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <NiCross size="small" />
            </IconButton>
          </Box>

          {onlineCount > 0 && (
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider", overflowX: "auto" }}
            >
              <Typography variant="caption" color="success.main" sx={{ flexShrink: 0 }}>
                Online:
              </Typography>
              {onlineAdmins.map((a) => (
                <Chip
                  key={a.email}
                  size="small"
                  label={a.name.split(" ")[0]}
                  color={a.role === "SUPER_ADMIN" ? "warning" : "primary"}
                  variant="outlined"
                  avatar={<Avatar>{a.name.charAt(0)}</Avatar>}
                />
              ))}
            </Stack>
          )}

          {onlineCount === 0 && (
            <Box
              sx={{
                m: 2,
                p: 1.5,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "warning.main",
                bgcolor: "warning.light",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5, color: "warning.main" }}>
                <NiClock size="small" />
                <Typography variant="caption" fontWeight="bold">
                  Jadwal Admin Online
                </Typography>
              </Stack>
              <Typography variant="caption" component="p" className="text-text-secondary">
                Sesi 1: 09:00–11:00 WIB · Sesi 2: 13:00–16:00 WIB
              </Typography>
              <Typography variant="caption" className="text-text-secondary-light" sx={{ display: "block", mt: 0.5 }}>
                {withinOfficeHours
                  ? "Admin sedang istirahat — kirim pesan, kami segera balas."
                  : "Di luar jam operasional — pesan tetap bisa dikirim."}
              </Typography>
            </Box>
          )}

          <Box
            ref={scrollRef}
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 1.5,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              minHeight: 240,
            }}
          >
            {sessionEnded ? (
              <Box sx={{ textAlign: "center", py: 5 }}>
                <NiCheck size="large" />
                <Typography variant="body2" sx={{ mt: 1, color: "success.main", fontWeight: 600 }}>
                  Sesi chat telah berakhir
                </Typography>
                <Typography variant="caption" className="text-text-secondary-light" sx={{ display: "block", mb: 2 }}>
                  Riwayat tersimpan di server. Mulai sesi baru untuk chat ulang.
                </Typography>
                <Button variant="contained" color="primary" size="small" onClick={() => setSessionEnded(false)}>
                  Mulai Chat Baru
                </Button>
              </Box>
            ) : messages.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 5 }}>
                <NiMessage size="large" />
                <Typography variant="body2" className="text-text-secondary" sx={{ mt: 1 }}>
                  Mulai percakapan
                </Typography>
                <Typography variant="caption" className="text-text-secondary-light">
                  Admin akan merespons saat online. Pesan tetap terkirim meski admin offline.
                </Typography>
              </Box>
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
                    {!mine && <Avatar sx={{ width: 26, height: 26 }}>{m.authorName.charAt(0)}</Avatar>}
                    <Box
                      sx={{
                        maxWidth: "75%",
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: mine ? "warning.light" : "primary.light",
                        color: "text.primary",
                      }}
                    >
                      {!mine && (
                        <Typography variant="caption" color="primary.main" fontWeight="bold" display="block">
                          {m.authorName}
                        </Typography>
                      )}
                      <Typography variant="body2">{m.text}</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                        <Typography variant="caption" className="text-text-secondary-light">
                          {new Date(m.at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                        {mine && <NiCheck size="small" />}
                      </Stack>
                    </Box>
                  </Stack>
                );
              })
            )}
          </Box>

          <Box sx={{ p: 1.25, borderTop: "1px solid", borderColor: "divider" }}>
            {sessionEnded ? null : confirmClose && sessionId ? (
              <Box
                sx={{
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 2,
                  bgcolor: "error.light",
                  border: "1px solid",
                  borderColor: "error.main",
                }}
              >
                <Typography variant="body2" sx={{ mb: 1, color: "error.main", fontWeight: 600 }}>
                  Akhiri sesi chat?
                </Typography>
                <Typography variant="caption" className="text-text-secondary" sx={{ display: "block", mb: 1.25 }}>
                  Riwayat pesan akan terhapus dan kamu perlu memulai sesi baru untuk chat lagi.
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="tiny" variant="paper" color="grey" onClick={() => setConfirmClose(false)}>
                    Batal
                  </Button>
                  <Button
                    size="tiny"
                    variant="contained"
                    color="error"
                    onClick={() => {
                      closeSession(sessionId);
                      setSessionId(null);
                      setConfirmClose(false);
                      setSessionEnded(true);
                      setText("");
                    }}
                  >
                    Ya, Akhiri
                  </Button>
                </Stack>
              </Box>
            ) : (
              <>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Tulis pesan untuk admin..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                      }
                    }}
                  />
                  <IconButton color="primary" onClick={submit} disabled={!text.trim()}>
                    <NiSendRight size="medium" />
                  </IconButton>
                </Stack>
                {sessionId && (
                  <Typography
                    variant="caption"
                    onClick={() => setConfirmClose(true)}
                    sx={{
                      mt: 1,
                      display: "block",
                      textAlign: "center",
                      cursor: "pointer",
                      color: "text.secondary",
                      "&:hover": { color: "error.main" },
                    }}
                  >
                    Tutup Sesi Chat
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Paper>
      </Zoom>

      <Badge badgeContent={!open && onlineCount > 0 ? onlineCount : 0} color="success" overlap="circular">
        <Fab color="primary" variant="extended" onClick={() => setOpen((v) => !v)}>
          {open ? <NiMessage size="medium" /> : <NiHeadset size="medium" />}
          <Box sx={{ ml: 1 }}>Bantuan</Box>
        </Fab>
      </Badge>
    </Box>
  );
}
