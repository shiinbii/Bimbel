"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, CheckCheck, Coins, MessageCircle, ShieldAlert, Sparkles,
  Trash2, Video, X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/lib/current-user";
import {
  useNotifications,
  type AppNotification,
  type NotificationKind,
} from "@/lib/notifications-store";

const KIND_META: Record<
  NotificationKind,
  { icon: React.ReactNode; color: string }
> = {
  PRIVATE_ZOOM_REQUEST: {
    icon: <Video className="w-3.5 h-3.5" />,
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
  PRIVATE_ZOOM_SCHEDULED: {
    icon: <Video className="w-3.5 h-3.5" />,
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  PRIVATE_ZOOM_CONFIRMED: {
    icon: <CheckCheck className="w-3.5 h-3.5" />,
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  PRIVATE_ZOOM_REJECTED: {
    icon: <X className="w-3.5 h-3.5" />,
    color: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  CHAT_MESSAGE: {
    icon: <MessageCircle className="w-3.5 h-3.5" />,
    color: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  },
  ACCOUNT_WARNING: {
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
    color: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  SYSTEM: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}d lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  return `${d}h lalu`;
}

export default function NotificationsBell() {
  const { user } = useCurrentUser();
  const { list, unreadCount, markRead, markAllRead, clear } = useNotifications(
    user.email
  );
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleClick = (n: AppNotification) => {
    markRead(n.id);
    if (n.link) {
      router.push(n.link);
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative w-10 h-10 rounded-xl border transition flex items-center justify-center ${
          open
            ? "border-indigo-500/50 bg-indigo-500/10 text-[var(--color-text)]"
            : "border-[var(--color-border)] bg-[var(--color-bg-soft)] text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-soft)]"
        }`}
        title={`${unreadCount} notifikasi belum dibaca`}
        aria-label="Notifikasi"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-[10px] font-bold text-amber-900 flex items-center justify-center ring-2 ring-[var(--color-bg)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 backdrop-blur-xl shadow-2xl z-40 overflow-hidden"
          >
            <div className="p-4 flex items-center justify-between border-b border-[var(--color-border-soft)]">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Notifikasi</p>
                <p className="text-xs text-[var(--color-text-soft)]">
                  {unreadCount > 0
                    ? `${unreadCount} belum dibaca`
                    : "Semua sudah dibaca"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="text-[10px] uppercase tracking-widest text-indigo-300 hover:text-indigo-200 px-2 h-7 rounded-lg hover:bg-[var(--color-bg-soft)] transition"
                  >
                    Tandai semua
                  </button>
                )}
                {list.length > 0 && (
                  <button
                    type="button"
                    onClick={() => clear()}
                    className="text-[10px] uppercase tracking-widest text-red-300 hover:text-red-200 px-2 h-7 rounded-lg hover:bg-red-500/10 transition"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[480px] overflow-y-auto">
              {list.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 mx-auto text-[var(--color-text-mute)] mb-2" />
                  <p className="text-sm text-[var(--color-text-soft)]">
                    Belum ada notifikasi
                  </p>
                  <p className="text-[10px] text-[var(--color-text-mute)] mt-0.5">
                    Pemberitahuan akan muncul di sini.
                  </p>
                </div>
              ) : (
                list.map((n, i) => {
                  const meta = KIND_META[n.kind];
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => handleClick(n)}
                      className={`p-3 cursor-pointer border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-soft)] transition flex items-start gap-3 ${
                        !n.read ? "bg-indigo-500/[0.05]" : ""
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${meta.color}`}
                      >
                        {meta.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text)] truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-[var(--color-text-soft)] line-clamp-2 mt-0.5">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-mute)] mt-1">
                          {timeAgo(n.at)}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
