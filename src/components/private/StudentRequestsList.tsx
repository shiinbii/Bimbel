"use client";

import { motion } from "framer-motion";
import {
  AlertCircle, Calendar, Check, CheckCircle2, ExternalLink, MessageCircle, Video, X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import OpenZoomConfirm from "@/components/zoom/OpenZoomConfirm";
import PrivateChatPanel from "./PrivateChatPanel";
import { sleep } from "@/lib/utils";
import {
  usePrivateZoom,
  type PrivateZoomRequest,
  type PrivateZoomStatus,
} from "@/lib/private-zoom-store";
import { pushNotification } from "@/lib/notifications-store";

const STATUS_TONE: Record<PrivateZoomStatus, "info" | "warning" | "success" | "danger" | "neutral" | "primary"> = {
  PENDING: "warning",
  SCHEDULED: "info",
  CONFIRMED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
  DONE: "primary",
};

const STATUS_LABEL: Record<PrivateZoomStatus, string> = {
  PENDING: "Menunggu Guru",
  SCHEDULED: "Perlu Konfirmasi Kamu",
  CONFIRMED: "Dikonfirmasi",
  REJECTED: "Perlu Re-schedule",
  CANCELLED: "Dibatalkan",
  DONE: "Selesai",
};

export default function StudentRequestsList({
  studentEmail,
  studentName,
}: {
  studentEmail: string;
  studentName: string;
}) {
  const { list, update } = usePrivateZoom();
  const mine = list.filter(
    (r) => r.studentEmail.toLowerCase() === studentEmail.toLowerCase()
  );
  const [chatFor, setChatFor] = useState<PrivateZoomRequest | null>(null);
  const [zoomFor, setZoomFor] = useState<PrivateZoomRequest | null>(null);
  const [cancelFor, setCancelFor] = useState<PrivateZoomRequest | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const confirm = (r: PrivateZoomRequest) => {
    update(r.id, { status: "CONFIRMED" });
    pushNotification({
      kind: "PRIVATE_ZOOM_CONFIRMED",
      targetEmail: r.teacherId + "@edudoc.id",
      title: "Jadwal Dikonfirmasi",
      body: `${studentName} sudah konfirmasi hadir pada ${new Date(
        r.scheduledAt!
      ).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}`,
    });
    toast.success("Jadwal dikonfirmasi. Notifikasi dikirim ke guru.");
  };

  const reject = (r: PrivateZoomRequest) => {
    update(r.id, { status: "REJECTED" });
    pushNotification({
      kind: "PRIVATE_ZOOM_REJECTED",
      targetEmail: r.teacherId + "@edudoc.id",
      title: "Siswa Belum Bisa Hadir",
      body: `${studentName} belum bisa di jadwal yang diajukan. Silakan chat untuk re-schedule.`,
    });
    toast("Guru akan dikabari. Buka chat untuk diskusi jadwal baru.", {
      icon: "💬",
    });
    setChatFor(r);
  };

  if (mine.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center mx-auto mb-3 border border-indigo-500/25">
          <Video className="w-5 h-5" />
        </div>
        <p className="font-serif text-lg text-[var(--color-text)]">
          Belum ada permintaan sesi privat
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-soft)] max-w-sm mx-auto">
          Pilih guru dan kirim permintaan di atas — guru akan merespon dengan
          jadwal yang tersedia.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {mine
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="p-4">
              <div className="flex items-start gap-4">
                <Avatar name={r.teacherName} size={44} ring />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-serif text-lg text-[var(--color-text)]">
                      {r.teacherName}
                    </p>
                    <Badge tone="primary">{r.subject}</Badge>
                    <Badge tone={STATUS_TONE[r.status]}>
                      {STATUS_LABEL[r.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--color-text-soft)] mt-1">
                    <strong className="text-[var(--color-text)]">Topik:</strong> {r.topic}
                  </p>
                  {r.notes && (
                    <p className="text-xs text-[var(--color-text-mute)] mt-0.5">
                      Catatan: {r.notes}
                    </p>
                  )}

                  {r.scheduledAt && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-indigo-500/25 bg-indigo-500/5 px-3 py-2 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                      <span className="text-[var(--color-text)]">
                        {new Date(r.scheduledAt).toLocaleString("id-ID", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </span>
                      {r.durationMinutes && (
                        <span className="text-[var(--color-text-soft)]">
                          · {r.durationMinutes} menit
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions per status */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.status === "SCHEDULED" && (
                      <>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => confirm(r)}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Saya Bisa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reject(r)}
                          leftIcon={<X className="w-3.5 h-3.5" />}
                          className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                        >
                          Tidak Bisa — Re-schedule
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChatFor(r)}
                          leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
                        >
                          Chat Guru
                        </Button>
                      </>
                    )}
                    {r.status === "CONFIRMED" && r.meetingUrl && (
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => setZoomFor(r)}
                        leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Masuk Zoom
                      </Button>
                    )}
                    {(r.status === "SCHEDULED" ||
                      r.status === "CONFIRMED" ||
                      r.status === "REJECTED" ||
                      r.status === "PENDING") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChatFor(r)}
                        leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
                      >
                        Chat
                      </Button>
                    )}
                    {(r.status === "PENDING" ||
                      r.status === "SCHEDULED" ||
                      r.status === "REJECTED") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                        leftIcon={<X className="w-3.5 h-3.5" />}
                        onClick={() => setCancelFor(r)}
                      >
                        Batalkan
                      </Button>
                    )}
                  </div>

                  {r.status === "PENDING" && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-amber-300">
                      <AlertCircle className="w-3 h-3" />
                      <span>Guru akan merespon dalam 1×24 jam</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

      <PrivateChatPanel
        open={!!chatFor}
        onClose={() => setChatFor(null)}
        request={chatFor}
        viewAs="student"
        selfName={studentName}
        selfEmail={studentEmail}
      />
      <OpenZoomConfirm
        open={!!zoomFor}
        onClose={() => setZoomFor(null)}
        title={zoomFor ? `Sesi Privat dengan ${zoomFor.teacherName}` : ""}
        url={zoomFor?.meetingUrl ?? ""}
      />

      <Modal
        open={!!cancelFor}
        onClose={() => setCancelFor(null)}
        title="Batalkan Permintaan Sesi?"
        description={
          cancelFor
            ? `Sesi privat dengan ${cancelFor.teacherName} akan dibatalkan. Aksi ini akan memberitahu guru.`
            : undefined
        }
        size="sm"
        align="center"
        icon={<X className="w-6 h-6" />}
      >
        <div className="flex items-center gap-2 pt-2">
          <Button full variant="ghost" onClick={() => setCancelFor(null)}>
            Tidak
          </Button>
          <Button
            full
            variant="danger"
            loading={cancelling}
            leftIcon={<X className="w-4 h-4" />}
            onClick={async () => {
              if (!cancelFor) return;
              setCancelling(true);
              await sleep(500);
              update(cancelFor.id, { status: "CANCELLED" });
              pushNotification({
                kind: "PRIVATE_ZOOM_REJECTED",
                targetEmail: cancelFor.teacherId + "@edudoc.id",
                title: "Siswa Membatalkan Sesi",
                body: `${studentName} membatalkan permintaan "${cancelFor.topic}".`,
              });
              setCancelling(false);
              setCancelFor(null);
              toast.success("Permintaan dibatalkan");
            }}
          >
            Ya, Batalkan
          </Button>
        </div>
      </Modal>
    </div>
  );
}
