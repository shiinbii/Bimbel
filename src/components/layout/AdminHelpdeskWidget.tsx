"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSnackbar } from "notistack";

import {
  Avatar,
  Badge,
  Box,
  Chip,
  Fab,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Zoom,
} from "@mui/material";

import NiArrowLeft from "@/icons/nexture/ni-arrow-left";
import NiCheck from "@/icons/nexture/ni-check";
import NiCross from "@/icons/nexture/ni-cross";
import NiHeadset from "@/icons/nexture/ni-headset";
import NiMessage from "@/icons/nexture/ni-message";
import NiSendRight from "@/icons/nexture/ni-send-right";
import { useCurrentUser } from "@/lib/current-user";
import {
  useHelpdeskMessages,
  useHelpdeskSessions,
  type HelpdeskMessage,
  type HelpdeskSession,
} from "@/lib/helpdesk-store";
import { useRole } from "@/lib/role-context";

const READ_KEY = "edudoc.helpdesk_admin_read";

function loadReadMap(email: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(`${READ_KEY}:${email.toLowerCase()}`);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveReadMap(email: string, m: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${READ_KEY}:${email.toLowerCase()}`, JSON.stringify(m));
}

function fmtRelative(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const s = Math.floor(d / 1000);
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export default function AdminHelpdeskWidget() {
  const { user } = useCurrentUser();
  const { role } = useRole();
  const { sessions, updateSession } = useHelpdeskSessions();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const meEmail = user.email || "admin@edudoc.id";
  const meName = user.name || "Admin";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const [readMap, setReadMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAdmin || !user.email) return;
    setReadMap(loadReadMap(user.email));
  }, [isAdmin, user.email]);

  const openSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.status !== "CLOSED")
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()),
    [sessions],
  );

  const unreadPerSession = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of openSessions) {
      const lastRead = readMap[s.id] ?? 0;
      const lastMsg = new Date(s.lastMessageAt).getTime();
      if (lastMsg > lastRead && s.lastMessagePreview !== "Sesi baru dimulai") {
        map[s.id] = 1;
      }
    }
    return map;
  }, [openSessions, readMap]);

  const totalUnread = Object.keys(unreadPerSession).length;

  const prevLastMsgs = useRef<Record<string, string>>({});
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (!isAdmin) return;
    const snapshot: Record<string, string> = {};
    const newOnes: HelpdeskSession[] = [];
    for (const s of openSessions) {
      snapshot[s.id] = s.lastMessageAt;
      const prev = prevLastMsgs.current[s.id];
      if (
        bootstrappedRef.current &&
        prev &&
        prev !== s.lastMessageAt &&
        new Date(s.lastMessageAt).getTime() > (readMap[s.id] ?? 0)
      ) {
        newOnes.push(s);
      }
    }
    prevLastMsgs.current = snapshot;
    bootstrappedRef.current = true;

    if (newOnes.length > 0 && !open) {
      for (const s of newOnes.slice(0, 2)) {
        enqueueSnackbar(`Pesan baru dari ${s.studentName}: ${s.lastMessagePreview}`, {
          variant: "info",
          autoHideDuration: 6000,
        });
      }
    }
  }, [openSessions, isAdmin, open, readMap, enqueueSnackbar]);

  const markSessionRead = useCallback(
    (sessionId: string) => {
      if (!user.email) return;
      const now = Date.now();
      setReadMap((prev) => {
        if ((prev[sessionId] ?? 0) >= now - 50) return prev;
        const next = { ...prev, [sessionId]: now };
        saveReadMap(user.email!, next);
        return next;
      });
    },
    [user.email],
  );

  const onOpenSession = useCallback(
    (id: string) => {
      setActiveId(id);
      markSessionRead(id);
    },
    [markSessionRead],
  );

  if (!isAdmin) return null;

  return (
    <Box sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 1300 }}>
      <Zoom in={open} unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            mb: 2,
            width: 400,
            maxWidth: "calc(100vw - 40px)",
            height: 580,
            maxHeight: "calc(100vh - 120px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 2, bgcolor: "primary.light", display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
            {activeId && (
              <IconButton size="small" onClick={() => setActiveId(null)}>
                <NiArrowLeft size="small" />
              </IconButton>
            )}
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <NiHeadset size="medium" />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2">
                {activeId ? "Balas Chat" : "Helpdesk Masuk"}
              </Typography>
              <Typography variant="caption" className="text-text-secondary">
                {openSessions.length} aktif · {totalUnread} belum dibaca
              </Typography>
            </Box>
            <Typography
              variant="caption"
              component={Link}
              href="/admin/helpdesk"
              onClick={() => setOpen(false)}
              sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              Full View
            </Typography>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <NiCross size="small" />
            </IconButton>
          </Box>

          {activeId ? (
            <ActiveChat
              sessionId={activeId}
              session={sessions.find((s) => s.id === activeId) ?? null}
              meEmail={meEmail}
              meName={meName}
              updateSession={updateSession}
              onMarkRead={markSessionRead}
            />
          ) : (
            <SessionsList sessions={openSessions} unread={unreadPerSession} onSelect={onOpenSession} />
          )}
        </Paper>
      </Zoom>

      <Badge badgeContent={!open && totalUnread > 0 ? totalUnread : 0} color="warning" overlap="circular">
        <Fab color="primary" variant="extended" onClick={() => setOpen((v) => !v)}>
          {open ? <NiCross size="medium" /> : <NiHeadset size="medium" />}
          <Box sx={{ ml: 1 }}>Helpdesk</Box>
        </Fab>
      </Badge>
    </Box>
  );
}

function SessionsList({
  sessions,
  unread,
  onSelect,
}: {
  sessions: HelpdeskSession[];
  unread: Record<string, number>;
  onSelect: (id: string) => void;
}) {
  const sorted = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const ua = unread[a.id] ? 1 : 0;
      const ub = unread[b.id] ? 1 : 0;
      if (ua !== ub) return ub - ua;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  }, [sessions, unread]);

  if (sorted.length === 0) {
    return (
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 4, textAlign: "center" }}>
        <NiMessage size="large" />
        <Typography variant="body2" className="text-text-secondary" sx={{ mt: 1 }}>
          Belum ada sesi chat aktif
        </Typography>
        <Typography variant="caption" className="text-text-secondary-light">
          Student yang menghubungi helpdesk akan muncul di sini realtime.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflowY: "auto" }}>
      {sorted.map((s) => (
        <Stack
          key={s.id}
          direction="row"
          spacing={1.5}
          onClick={() => onSelect(s.id)}
          sx={{
            p: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            cursor: "pointer",
            bgcolor: unread[s.id] ? "primary.light" : undefined,
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Avatar sx={{ width: 38, height: 38 }}>{s.studentName.charAt(0)}</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                {s.studentName}
              </Typography>
              <Chip size="small" label={s.status === "OPEN" ? "BARU" : "AKTIF"} color={s.status === "OPEN" ? "warning" : "primary"} variant="outlined" />
            </Stack>
            <Typography variant="caption" className="text-text-secondary" noWrap component="p">
              {s.lastMessagePreview}
            </Typography>
            <Typography variant="caption" className="text-text-secondary-light">
              {fmtRelative(s.lastMessageAt)}
            </Typography>
          </Box>
          {unread[s.id] && <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "warning.main", mt: 1 }} />}
        </Stack>
      ))}
    </Box>
  );
}

function ActiveChat({
  sessionId,
  session,
  meEmail,
  meName,
  updateSession,
  onMarkRead,
}: {
  sessionId: string;
  session: HelpdeskSession | null;
  meEmail: string;
  meName: string;
  updateSession: (id: string, patch: Partial<HelpdeskSession>) => void;
  onMarkRead: (sessionId: string) => void;
}) {
  const { messages, send } = useHelpdeskMessages(sessionId);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length]);

  useEffect(() => {
    onMarkRead(sessionId);
  }, [sessionId, messages.length, onMarkRead]);

  const submit = () => {
    const t = text.trim();
    if (!t || !session) return;
    if (session.status === "OPEN") {
      updateSession(session.id, { status: "CLAIMED", adminEmail: meEmail, adminName: meName });
    }
    send({ sessionId, author: "admin", authorEmail: meEmail, authorName: meName, text: t });
    setText("");
  };

  if (!session) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body2" className="text-text-secondary">
          Sesi tidak ditemukan
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider", bgcolor: "action.hover" }}>
        <Avatar sx={{ width: 26, height: 26 }}>{session.studentName.charAt(0)}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {session.studentName}
          </Typography>
          <Typography variant="caption" className="text-text-secondary-light" noWrap>
            {session.studentEmail}
          </Typography>
        </Box>
      </Stack>

      <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
        {messages.length === 0 ? (
          <Typography variant="body2" className="text-text-secondary" sx={{ textAlign: "center", py: 5 }}>
            Mulai percakapan dengan {session.studentName.split(" ")[0]}
          </Typography>
        ) : (
          messages.map((m: HelpdeskMessage) => {
            const mine = m.author === "admin";
            return (
              <Stack key={m.id} direction="row" spacing={1} justifyContent={mine ? "flex-end" : "flex-start"} alignItems="flex-end">
                {!mine && <Avatar sx={{ width: 26, height: 26 }}>{m.authorName.charAt(0)}</Avatar>}
                <Box sx={{ maxWidth: "75%", px: 1.5, py: 1, borderRadius: 2, bgcolor: mine ? "primary.light" : "action.hover" }}>
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
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder={`Balas ke ${session.studentName.split(" ")[0]}...`}
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
      </Box>
    </>
  );
}
