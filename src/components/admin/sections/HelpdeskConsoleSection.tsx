"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCheck, Circle, Headset, MessageCircle, Search, Send, Users, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { useCurrentUser } from "@/lib/current-user";
import { useRole } from "@/lib/role-context";
import {
  useHelpdeskMessages,
  useHelpdeskSessions,
  useOnlineAdmins,
  type HelpdeskSession,
} from "@/lib/helpdesk-store";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtRelative(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const s = Math.floor(d / 1000);
  if (s < 60) return "baru saja";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

export default function HelpdeskConsoleSection() {
  const { user } = useCurrentUser();
  const { role } = useRole();
  const { sessions, updateSession, closeSession } = useHelpdeskSessions();
  const onlineAdmins = useOnlineAdmins();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "CLAIMED" | "CLOSED">(
    "ALL"
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions
      .filter((s) => (filter === "ALL" ? true : s.status === filter))
      .filter(
        (s) =>
          !q ||
          s.studentName.toLowerCase().includes(q) ||
          s.studentEmail.toLowerCase().includes(q) ||
          s.lastMessagePreview.toLowerCase().includes(q)
      )
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      );
  }, [sessions, filter, query]);

  useEffect(() => {
    if (!activeId && filtered.length) setActiveId(filtered[0].id);
    if (activeId && !filtered.find((s) => s.id === activeId)) {
      setActiveId(filtered[0]?.id ?? null);
    }
  }, [filtered, activeId]);

  const active = sessions.find((s) => s.id === activeId) ?? null;
  const counts = useMemo(
    () => ({
      OPEN: sessions.filter((s) => s.status === "OPEN").length,
      CLAIMED: sessions.filter((s) => s.status === "CLAIMED").length,
      CLOSED: sessions.filter((s) => s.status === "CLOSED").length,
    }),
    [sessions]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)]">
            <Headset className="w-5 h-5 text-[var(--color-text)]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-soft)]">
              Helpdesk Console
            </p>
            <h2 className="font-serif text-2xl text-[var(--color-text)]">Live Chat Admin</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-soft)] px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5">
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-emerald-200">
              {onlineAdmins.length} admin online
            </span>
          </span>
          <Badge tone="primary">
            Login: {user.email || "—"}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Belum ditangani", value: counts.OPEN, tone: "amber" },
          { label: "Sedang ditangani", value: counts.CLAIMED, tone: "indigo" },
          { label: "Selesai", value: counts.CLOSED, tone: "emerald" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/70 p-4"
          >
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-soft)]">
              {s.label}
            </p>
            <p
              className={`mt-1 text-3xl font-serif ${
                s.tone === "amber"
                  ? "text-amber-300"
                  : s.tone === "indigo"
                  ? "text-indigo-300"
                  : "text-emerald-300"
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chat layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 min-h-[560px]">
        {/* Sessions list */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/70 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[var(--color-border-soft)] space-y-2">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3">
              <Search className="w-4 h-4 text-[var(--color-text-soft)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari sesi..."
                className="flex-1 h-9 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-mute)]"
              />
            </div>
            <div className="flex gap-1">
              {(["ALL", "OPEN", "CLAIMED", "CLOSED"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 text-[10px] uppercase tracking-widest py-1.5 rounded-lg transition ${
                    filter === f
                      ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/40"
                      : "bg-[var(--color-bg-soft)] text-[var(--color-text-soft)] border border-transparent hover:bg-[var(--color-bg-soft)]"
                  }`}
                >
                  {f === "ALL"
                    ? "Semua"
                    : f === "OPEN"
                    ? "Baru"
                    : f === "CLAIMED"
                    ? "Aktif"
                    : "Selesai"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-10 text-center">
                <MessageCircle className="w-8 h-8 mx-auto text-[var(--color-text-mute)] mb-2" />
                <p className="text-sm text-[var(--color-text-soft)]">
                  Belum ada sesi chat
                </p>
              </div>
            ) : (
              filtered.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  active={s.id === activeId}
                  onClick={() => setActiveId(s.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat pane */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/70 overflow-hidden flex flex-col min-h-[560px]">
          {active ? (
            <ChatPane
              key={active.id}
              session={active}
              meEmail={user.email || "admin@edudoc.id"}
              meName={user.name || "Admin"}
              onClaim={() =>
                updateSession(active.id, {
                  status: "CLAIMED",
                  adminEmail: user.email || "admin@edudoc.id",
                  adminName: user.name || "Admin",
                })
              }
              onClose={() => closeSession(active.id)}
              canReply={
                role === "ADMIN" ||
                role === "SUPER_ADMIN" ||
                active.status !== "CLOSED"
              }
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <Headset className="w-10 h-10 text-[var(--color-text-mute)] mb-3" />
              <p className="text-sm text-[var(--color-text-soft)]">
                Pilih sesi di sebelah kiri untuk mulai membalas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionRow({
  session,
  active,
  onClick,
}: {
  session: HelpdeskSession;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-b border-[var(--color-border)] flex gap-3 transition ${
        active ? "bg-indigo-500/10" : "hover:bg-[var(--color-bg-soft)]"
      }`}
    >
      <Avatar name={session.studentName} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--color-text)] truncate">
            {session.studentName}
          </p>
          <StatusPill status={session.status} />
        </div>
        <p className="text-xs text-[var(--color-text-soft)] truncate">
          {session.lastMessagePreview}
        </p>
        <p className="text-[10px] text-[var(--color-text-mute)] mt-0.5">
          {fmtRelative(session.lastMessageAt)}
        </p>
      </div>
    </button>
  );
}

function StatusPill({ status }: { status: HelpdeskSession["status"] }) {
  if (status === "OPEN")
    return (
      <Badge tone="warning" className="text-[9px]">
        BARU
      </Badge>
    );
  if (status === "CLAIMED")
    return (
      <Badge tone="primary" className="text-[9px]">
        AKTIF
      </Badge>
    );
  return (
    <span className="text-[9px] uppercase tracking-widest text-[var(--color-text-mute)]">
      Selesai
    </span>
  );
}

function ChatPane({
  session,
  meEmail,
  meName,
  onClaim,
  onClose,
  canReply,
}: {
  session: HelpdeskSession;
  meEmail: string;
  meName: string;
  onClaim: () => void;
  onClose: () => void;
  canReply: boolean;
}) {
  const { messages, send } = useHelpdeskMessages(session.id);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length]);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    if (session.status === "OPEN") onClaim();
    send({
      sessionId: session.id,
      author: "admin",
      authorEmail: meEmail,
      authorName: meName,
      text: t,
    });
    setText("");
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-soft)] flex items-center gap-3">
        <Avatar name={session.studentName} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[var(--color-text)] truncate">
              {session.studentName}
            </p>
            <StatusPill status={session.status} />
          </div>
          <p className="text-xs text-[var(--color-text-soft)] truncate">
            {session.studentEmail}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {session.status === "OPEN" && (
            <button
              onClick={onClaim}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-100 hover:bg-indigo-500/30 transition"
            >
              Ambil Sesi
            </button>
          )}
          {session.status !== "CLOSED" && (
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 hover:bg-red-500/20 transition flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* Thread */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]"
      >
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <Circle className="w-8 h-8 mx-auto text-[var(--color-text-mute)] mb-2" />
            <p className="text-sm text-[var(--color-text-soft)]">
              Belum ada pesan di sesi ini
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const mine = m.author === "admin";
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}
                >
                  <Avatar name={m.authorName} size={28} />
                  <div
                    className={`max-w-[70%] flex flex-col ${
                      mine ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <p
                        className={`text-[10px] font-semibold ${
                          mine ? "text-indigo-300" : "text-[var(--color-text)]"
                        }`}
                      >
                        {m.authorName}
                      </p>
                      {mine && (
                        <Badge tone="primary" className="text-[8px]">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        mine
                          ? "bg-indigo-500/20 border border-indigo-500/30 text-[var(--color-text)] rounded-br-sm"
                          : "bg-[var(--color-bg-soft)] border border-[var(--color-border)] text-[var(--color-text)] rounded-bl-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--color-text-mute)]">
                      <span>{fmtTime(m.at)}</span>
                      {mine && (
                        <CheckCheck className="w-3 h-3 text-indigo-300" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--color-border-soft)]">
        {session.status === "CLOSED" ? (
          <p className="text-center text-xs text-[var(--color-text-mute)] py-2">
            Sesi ini sudah ditutup.
          </p>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 focus-within:border-indigo-500/50 transition">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={
                canReply
                  ? `Balas ke ${session.studentName.split(" ")[0]}...`
                  : "Tidak bisa membalas"
              }
              disabled={!canReply}
              className="flex-1 h-10 bg-transparent outline-none text-sm placeholder:text-[var(--color-text-mute)] disabled:cursor-not-allowed"
            />
            <button
              onClick={submit}
              disabled={!text.trim() || !canReply}
              className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-[var(--color-text)] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
