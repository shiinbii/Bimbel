"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, Ban, CheckCheck, Send, ShieldAlert, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  detectOffPlatform,
  usePrivateChat,
} from "@/lib/private-chat-store";
import { pushNotification } from "@/lib/notifications-store";
import type { PrivateZoomRequest } from "@/lib/private-zoom-store";

interface Props {
  open: boolean;
  onClose: () => void;
  request: PrivateZoomRequest | null;
  /** Who is viewing the chat */
  viewAs: "student" | "teacher";
  selfName: string;
  selfEmail: string;
}

const ACK_KEY = "edudoc.private_chat_policy_ack";

export default function PrivateChatPanel({
  open,
  onClose,
  request,
  viewAs,
  selfName,
  selfEmail,
}: Props) {
  const { messages, send } = usePrivateChat(request?.id ?? null);
  const [text, setText] = useState("");
  const [showPolicy, setShowPolicy] = useState(false);
  const [policyAcked, setPolicyAcked] = useState(false);
  const [ackCheck, setAckCheck] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  // Show policy popup on first-ever open (per-user)
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const acked = localStorage.getItem(ACK_KEY + ":" + selfEmail);
    if (!acked) {
      setShowPolicy(true);
      setPolicyAcked(false);
    } else {
      setPolicyAcked(true);
    }
  }, [open, selfEmail]);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  if (!request) {
    return (
      <Modal open={false} onClose={onClose}>
        <div />
      </Modal>
    );
  }

  const otherName =
    viewAs === "student" ? request.teacherName : request.studentName;
  const otherInitials = otherName;

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    if (!policyAcked) {
      setShowPolicy(true);
      return;
    }
    const isOffPlatform = detectOffPlatform(t);
    if (isOffPlatform) {
      toast.error(
        "Pesan ini terdeteksi mengarahkan komunikasi di luar EduDoc. Pesan ditandai untuk moderasi."
      );
    }
    send({
      requestId: request.id,
      author: viewAs,
      name: selfName,
      text: t,
    });
    // Notify the other side
    const otherEmail =
      viewAs === "student" ? request.teacherId + "@edudoc.id" : request.studentEmail;
    pushNotification({
      kind: "CHAT_MESSAGE",
      targetEmail: otherEmail,
      title: `${selfName} mengirim pesan`,
      body: t.slice(0, 80),
      link:
        viewAs === "student"
          ? "/teacher/private-zoom"
          : "/student/private-zoom",
    });
    setText("");
  };

  const ackPolicy = () => {
    if (!ackCheck) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(ACK_KEY + ":" + selfEmail, "1");
    }
    setPolicyAcked(true);
    setShowPolicy(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`Chat dengan ${otherName}`}
        description={`Sesi privat: ${request.topic}`}
        size="md"
      >
        <div className="flex flex-col" style={{ maxHeight: "60vh" }}>
          {/* Persistent policy banner */}
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-200">
            <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              <strong>Jangan</strong> bertukar kontak/komunikasi di luar EduDoc.
              Pelanggaran akan menyebabkan akun dinonaktifkan.
            </span>
          </div>

          <div
            ref={scroller}
            className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[240px]"
          >
            {messages.length === 0 && (
              <div className="text-center text-xs text-[var(--color-text-soft)] py-8">
                Mulai percakapan...
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((m) => {
                const mine = m.author === viewAs;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar name={mine ? selfName : otherInitials} size={26} />
                    <div
                      className={`max-w-[78%] flex flex-col ${
                        mine ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? "bg-gradient-to-br from-amber-500/25 to-amber-700/10 border border-amber-500/25 text-amber-50 rounded-br-sm"
                            : "bg-indigo-500/15 border border-indigo-500/25 text-[var(--color-text)] rounded-bl-sm"
                        } ${m.flagged ? "ring-2 ring-red-500/60" : ""}`}
                      >
                        {m.text}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--color-text-mute)]">
                        <span>
                          {new Date(m.at).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {mine && <CheckCheck className="w-3 h-3 text-indigo-300" />}
                        {m.flagged && (
                          <Badge tone="danger" className="text-[8px] gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Terdeteksi
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 focus-within:border-indigo-500/50 transition">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={
                policyAcked
                  ? "Tulis pesan..."
                  : "Baca & setujui kebijakan dulu..."
              }
              disabled={!policyAcked}
              className="flex-1 h-10 bg-transparent outline-none text-sm placeholder:text-[var(--color-text-mute)] disabled:opacity-50"
            />
            <button
              onClick={submit}
              disabled={!text.trim() || !policyAcked}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-[var(--color-text)] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Modal>

      {/* OFF-PLATFORM POLICY MODAL */}
      <Modal
        open={showPolicy}
        onClose={() => {
          /* require ack */
        }}
        title="Peringatan Penting"
        description="Wajib dibaca sebelum chat dengan guru/siswa"
        size="md"
        align="center"
        icon={<ShieldAlert className="w-6 h-6" />}
      >
        <div className="space-y-4 text-left">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent p-4"
          >
            <div className="flex items-center gap-2 text-red-300 mb-2">
              <Ban className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest font-semibold">
                Kebijakan Komunikasi
              </span>
            </div>
            <p className="text-sm text-[var(--color-text)] leading-relaxed">
              Semua komunikasi antara <strong>siswa</strong> dan{" "}
              <strong>guru</strong> harus dilakukan di dalam platform EduDoc.
            </p>
            <ul className="mt-3 text-sm text-[var(--color-text)] space-y-1.5 list-disc pl-5">
              <li>
                Dilarang bertukar nomor WhatsApp, Telegram, Instagram, atau
                email pribadi.
              </li>
              <li>
                Dilarang menggunakan platform chat eksternal untuk keperluan
                sesi EduDoc.
              </li>
              <li>
                Sistem akan mendeteksi & menandai pesan yang melanggar
                kebijakan ini.
              </li>
            </ul>
            <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-200">
              <strong>Konsekuensi:</strong> Jika ketahuan berkomunikasi di luar
              platform, akun akan <strong>dinonaktifkan (terminate)</strong>{" "}
              tanpa pemberitahuan.
            </div>
          </motion.div>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-bg-soft)] cursor-pointer hover:border-indigo-500/40 transition">
            <input
              type="checkbox"
              checked={ackCheck}
              onChange={(e) => setAckCheck(e.target.checked)}
              className="mt-0.5 accent-indigo-500 w-4 h-4"
            />
            <span className="text-sm text-[var(--color-text)]">
              Saya memahami kebijakan ini dan setuju untuk tetap berkomunikasi
              hanya di dalam platform EduDoc. Jika saya melanggar, saya bersedia
              akun saya dinonaktifkan.
            </span>
          </label>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              full
              onClick={() => {
                setShowPolicy(false);
                onClose();
              }}
            >
              Batal
            </Button>
            <Button full onClick={ackPolicy} disabled={!ackCheck}>
              Saya Setuju
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
